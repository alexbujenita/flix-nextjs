import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { NextRouter } from "next/router";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import FilterMovies from "../../src/components/FilterMovies/FilterMovies";
import { renderWithRouter } from "../helpers/render";
import { server } from "../msw/server";

const CERTIFICATIONS_URL = "http://localhost:3001/api/certifications";

/**
 * `renderWithRouter` always passes a `url`, so `MemoryRouterProvider` builds an
 * isolated router instead of mutating the `next-router-mock` singleton. This
 * probe renders inside the same provider and exposes that isolated router so
 * navigation assertions read the router the component actually pushed to.
 */
type RouterCapture = { router: NextRouter | null };

function RouterProbe({
  onRoute,
}: {
  readonly onRoute: (router: NextRouter) => void;
}) {
  const router = useRouter();

  useEffect(() => {
    onRoute(router);
  }, [onRoute, router]);

  return null;
}

function renderFilterMovies(): RouterCapture {
  const capture: RouterCapture = { router: null };

  renderWithRouter(
    <>
      <FilterMovies />
      <RouterProbe
        onRoute={(router) => {
          capture.router = router;
        }}
      />
    </>,
  );

  return capture;
}

function currentRoute(capture: RouterCapture): NextRouter {
  if (capture.router === null) {
    throw new Error("RouterProbe never captured a router instance.");
  }

  return capture.router;
}

/**
 * The selects carry no accessible name: their `<label>` siblings have no `for`
 * attribute. Identify each one by its own disabled placeholder `<option>`,
 * which is stable, visible text rather than a CSS class or DOM position.
 */
function selectWithPlaceholder(placeholder: string): HTMLSelectElement {
  const match = screen
    .getAllByRole("combobox")
    .find(
      (candidate) =>
        within(candidate).queryByRole("option", { name: placeholder }) !== null,
    );

  if (!(match instanceof HTMLSelectElement)) {
    throw new Error(`No <select> offering the "${placeholder}" option.`);
  }

  return match;
}

function queryPlaceholderOption(placeholder: string): HTMLElement | null {
  return screen.queryByRole("option", { name: placeholder });
}

/** `input[type="date"]` exposes no ARIA role, so anchor on its label text. */
function dateInputFor(labelText: string): HTMLInputElement {
  const input = screen
    .getByText(labelText)
    .parentElement?.querySelector("input");

  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`No <input> beside the "${labelText}" label.`);
  }

  return input;
}

function filterOptionsTrigger(): HTMLElement {
  return screen.getByText("Filter Options");
}

function submitButton(): HTMLElement {
  return screen.getByRole("button", { name: "Refine search" });
}

async function openFilters(user: ReturnType<typeof userEvent.setup>) {
  await user.click(filterOptionsTrigger());
  await screen.findByRole("button", { name: "Refine search" });
}

async function waitForCertifications(): Promise<void> {
  await screen.findByRole("option", { name: "US" });
}

describe("FilterMovies", () => {
  const requestLog: string[] = [];

  function recordRequest({ request }: { readonly request: Request }) {
    requestLog.push(`${request.method} ${request.url}`);
  }

  beforeEach(() => {
    requestLog.length = 0;
    server.events.on("request:start", recordRequest);
  });

  afterEach(() => {
    server.events.removeListener("request:start", recordRequest);
  });

  describe("certifications fetch on mount", () => {
    it("GETs the certifications endpoint and offers the returned countries", async () => {
      // Given: a mounted filter panel.
      const user = userEvent.setup();
      renderFilterMovies();

      // Then: the certifications endpoint was requested once on mount.
      await waitFor(() => {
        expect(requestLog).toEqual([`GET ${CERTIFICATIONS_URL}`]);
      });

      // When: the filter form is opened.
      await openFilters(user);
      await waitForCertifications();

      // Then: the country select is populated from the response.
      const countries = selectWithPlaceholder("Choose a country");
      expect(
        within(countries).getByRole("option", { name: "US" }),
      ).toBeInTheDocument();
    });
  });

  describe("form visibility", () => {
    it("keeps the form hidden until Filter Options is clicked and hides it again", async () => {
      // Given: a mounted filter panel.
      const user = userEvent.setup();
      renderFilterMovies();

      // Then: only the trigger is rendered.
      expect(filterOptionsTrigger()).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Refine search" }),
      ).not.toBeInTheDocument();
      expect(screen.queryAllByRole("combobox")).toHaveLength(0);

      // When: the trigger is clicked.
      await openFilters(user);

      // Then: the form and its controls appear.
      expect(submitButton()).toBeInTheDocument();
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
      expect(screen.getByRole("checkbox")).toBeInTheDocument();

      // When: the trigger is clicked again.
      await user.click(filterOptionsTrigger());

      // Then: the form collapses.
      expect(
        screen.queryByRole("button", { name: "Refine search" }),
      ).not.toBeInTheDocument();
      expect(screen.queryAllByRole("combobox")).toHaveLength(0);
    });
  });

  describe("country to certification dependency", () => {
    it("reveals the certification select only after a country is chosen", async () => {
      // Given: an open filter form with no country chosen.
      const user = userEvent.setup();
      renderFilterMovies();
      await openFilters(user);
      await waitForCertifications();

      // Then: only the year and country selects exist.
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
      expect(queryPlaceholderOption("Choose a certification")).toBeNull();

      // When: a country is chosen.
      await user.selectOptions(selectWithPlaceholder("Choose a country"), "US");

      // Then: the certification select appears with that country's values.
      expect(screen.getAllByRole("combobox")).toHaveLength(3);
      const certifications = selectWithPlaceholder("Choose a certification");
      expect(
        within(certifications).getByRole("option", { name: "PG-13" }),
      ).toBeInTheDocument();
    });
  });

  describe("submitting the filters", () => {
    it("pushes the buildQuery URL for a year, certification and adult combination", async () => {
      // Given: an open filter form.
      const user = userEvent.setup();
      const capture = renderFilterMovies();
      await openFilters(user);
      await waitForCertifications();

      // When: every non-date filter is set and the form is submitted.
      await user.selectOptions(selectWithPlaceholder("Choose a year"), "1994");
      await user.selectOptions(selectWithPlaceholder("Choose a country"), "US");
      await user.selectOptions(
        selectWithPlaceholder("Choose a certification"),
        "PG-13",
      );
      await user.click(screen.getByRole("checkbox"));
      await user.click(submitButton());

      // Then: buildQuery's exact output is pushed.
      await waitFor(() => {
        expect(currentRoute(capture).asPath).toBe(
          "/movies?page=1&year=1994&certificationCountry=US&certification=PG-13&adult=true",
        );
      });
      expect(currentRoute(capture).query).toEqual({
        page: "1",
        year: "1994",
        certificationCountry: "US",
        certification: "PG-13",
        adult: "true",
      });
    });

    it("drops the year when both release-date bounds are set", async () => {
      // Given: an open filter form.
      const user = userEvent.setup();
      const capture = renderFilterMovies();
      await openFilters(user);
      await waitForCertifications();

      // When: both date bounds are set alongside every other filter.
      fireEvent.change(dateInputFor("Released after"), {
        target: { value: "2000-01-01" },
      });
      fireEvent.change(dateInputFor("Released before"), {
        target: { value: "2010-12-31" },
      });
      await user.selectOptions(selectWithPlaceholder("Choose a year"), "1994");
      await user.selectOptions(selectWithPlaceholder("Choose a country"), "US");
      await user.selectOptions(
        selectWithPlaceholder("Choose a certification"),
        "PG-13",
      );
      await user.click(screen.getByRole("checkbox"));
      await user.click(submitButton());

      // Then: buildQuery suppresses `year` because both bounds are present.
      await waitFor(() => {
        expect(currentRoute(capture).asPath).toBe(
          "/movies?page=1&primaryReleaseDateLTE=2010-12-31&primaryReleaseDateGTE=2000-01-01&certificationCountry=US&certification=PG-13&adult=true",
        );
      });
      expect(currentRoute(capture).query).not.toHaveProperty("year");
    });

    it("pushes the bare movies route when nothing is selected", async () => {
      // Given: an open filter form with untouched controls.
      const user = userEvent.setup();
      const capture = renderFilterMovies();
      await openFilters(user);

      // When: the form is submitted.
      await user.click(submitButton());

      // Then: buildQuery normalises the null page to 1 and adds nothing else.
      await waitFor(() => {
        expect(currentRoute(capture).asPath).toBe("/movies?page=1");
      });
    });

    it("closes the form and clears the selections after submitting", async () => {
      // Given: an open filter form with a country and adult flag set.
      const user = userEvent.setup();
      renderFilterMovies();
      await openFilters(user);
      await user.selectOptions(selectWithPlaceholder("Choose a country"), "US");
      await user.click(screen.getByRole("checkbox"));

      // When: the form is submitted.
      await user.click(submitButton());

      // Then: the form collapses.
      await waitFor(() => {
        expect(
          screen.queryByRole("button", { name: "Refine search" }),
        ).not.toBeInTheDocument();
      });

      // When: the form is reopened.
      await user.click(filterOptionsTrigger());

      // Then: the dependent certification select and adult flag are reset.
      expect(screen.getAllByRole("combobox")).toHaveLength(2);
      expect(queryPlaceholderOption("Choose a certification")).toBeNull();
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });
  });

  describe("when the certifications request fails", () => {
    it("still renders the form, logs the error and omits the certification select", async () => {
      // Given: the certifications endpoint returns 500.
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
      server.use(
        http.get(CERTIFICATIONS_URL, () =>
          HttpResponse.json({ message: "boom" }, { status: 500 }),
        ),
      );
      const user = userEvent.setup();
      renderFilterMovies();

      // Then: the component swallows the failure into console.log.
      await waitFor(() => {
        expect(consoleLog).toHaveBeenCalledTimes(1);
      });

      // When: the filter form is opened.
      await user.click(filterOptionsTrigger());

      // Then: the component still renders its controls.
      expect(submitButton()).toBeInTheDocument();
      expect(screen.getAllByRole("combobox")).toHaveLength(2);

      // Then: the country select holds only its disabled placeholder.
      const countries = selectWithPlaceholder("Choose a country");
      expect(within(countries).getAllByRole("option")).toHaveLength(1);
      expect(
        within(countries).queryByRole("option", { name: "US" }),
      ).toBeNull();

      // Then: no certification select is reachable.
      expect(queryPlaceholderOption("Choose a certification")).toBeNull();
    });

    it("still submits the non-certification filters after a failed fetch", async () => {
      // Given: the certifications endpoint returns 500.
      const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
      server.use(
        http.get(CERTIFICATIONS_URL, () =>
          HttpResponse.json({ message: "boom" }, { status: 500 }),
        ),
      );
      const user = userEvent.setup();
      const capture = renderFilterMovies();
      await waitFor(() => {
        expect(consoleLog).toHaveBeenCalledTimes(1);
      });

      // When: a year is chosen and the form submitted.
      await user.click(filterOptionsTrigger());
      await user.selectOptions(selectWithPlaceholder("Choose a year"), "1994");
      await user.click(submitButton());

      // Then: buildQuery still produces a valid route.
      await waitFor(() => {
        expect(currentRoute(capture).asPath).toBe("/movies?page=1&year=1994");
      });
    });
  });
});
