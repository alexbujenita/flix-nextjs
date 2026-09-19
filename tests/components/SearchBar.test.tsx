import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { NextRouter } from "next/router";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { describe, expect, it } from "vitest";

import SearchBar from "../../src/components/SearchBar/SearchBar";
import { renderWithRouter } from "../helpers/render";

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

function renderSearchBar(): RouterCapture {
  const capture: RouterCapture = { router: null };

  renderWithRouter(
    <>
      <SearchBar />
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

function heading(): HTMLElement {
  return screen.getByRole("heading", { level: 3 });
}

function entityToggle(): HTMLElement {
  return screen.getByRole("button", { name: /^Currently searching/ });
}

describe("SearchBar", () => {
  describe("display toggle", () => {
    it("hides the search inputs until the heading is clicked", async () => {
      // Given: a freshly mounted search bar.
      const user = userEvent.setup();
      renderSearchBar();

      // Then: only the heading is rendered.
      expect(heading()).toHaveTextContent("Search movie");
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /^Currently searching/ }),
      ).not.toBeInTheDocument();

      // When: the heading is clicked.
      await user.click(heading());

      // Then: the inputs appear.
      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByRole("checkbox")).toBeInTheDocument();
      expect(entityToggle()).toBeInTheDocument();
    });

    it("hides the inputs again when the heading is clicked a second time", async () => {
      // Given: an open search bar.
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(heading());
      expect(screen.getByRole("textbox")).toBeInTheDocument();

      // When: the heading is clicked again.
      await user.click(heading());

      // Then: the inputs are unmounted.
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });
  });

  describe("entity toggle", () => {
    it("cycles movie -> tv -> person -> movie and relabels every affected control", async () => {
      // Given: an open search bar defaulting to the movie entity.
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(heading());

      // Then: the movie entity drives the heading, placeholder and toggle copy.
      expect(heading()).toHaveTextContent("Search movie");
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "placeholder",
        "Search for movie...",
      );
      expect(screen.getByLabelText("Search for movie")).toBeInTheDocument();
      expect(entityToggle()).toHaveAccessibleName(
        "Currently searching movie. Click to switch entity type.",
      );
      expect(entityToggle()).toHaveAttribute("title", "Switch to TV shows");
      expect(entityToggle()).toHaveTextContent("🎬");

      // When: the toggle is clicked once.
      await user.click(entityToggle());

      // Then: the entity advances to tv.
      expect(heading()).toHaveTextContent("Search tv");
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "placeholder",
        "Search for tv...",
      );
      expect(screen.getByLabelText("Search for tv")).toBeInTheDocument();
      expect(entityToggle()).toHaveAccessibleName(
        "Currently searching tv. Click to switch entity type.",
      );
      expect(entityToggle()).toHaveAttribute("title", "Switch to people");
      expect(entityToggle()).toHaveTextContent("📺");

      // When: the toggle is clicked again.
      await user.click(entityToggle());

      // Then: the entity advances to person.
      expect(heading()).toHaveTextContent("Search person");
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "placeholder",
        "Search for person...",
      );
      expect(screen.getByLabelText("Search for person")).toBeInTheDocument();
      expect(entityToggle()).toHaveAccessibleName(
        "Currently searching person. Click to switch entity type.",
      );
      expect(entityToggle()).toHaveAttribute("title", "Switch to movies");
      expect(entityToggle()).toHaveTextContent("👤");

      // When: the toggle is clicked a third time.
      await user.click(entityToggle());

      // Then: the cycle wraps back around to movie.
      expect(heading()).toHaveTextContent("Search movie");
      expect(screen.getByRole("textbox")).toHaveAttribute(
        "placeholder",
        "Search for movie...",
      );
      expect(entityToggle()).toHaveAttribute("title", "Switch to TV shows");
      expect(entityToggle()).toHaveTextContent("🎬");
    });

    it("keeps the typed search term while the entity cycles", async () => {
      // Given: an open search bar with a typed term.
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(heading());
      await user.type(screen.getByRole("textbox"), "alien");

      // When: the entity is swapped.
      await user.click(entityToggle());

      // Then: the controlled input keeps its value.
      expect(screen.getByRole("textbox")).toHaveValue("alien");
    });
  });

  describe("adult checkbox", () => {
    it("toggles on and back off", async () => {
      // Given: an open search bar.
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(heading());
      expect(screen.getByRole("checkbox")).not.toBeChecked();

      // When: the adult checkbox is clicked.
      await user.click(screen.getByRole("checkbox"));

      // Then: it is checked.
      expect(screen.getByRole("checkbox")).toBeChecked();

      // When: it is clicked again.
      await user.click(screen.getByRole("checkbox"));

      // Then: it is unchecked.
      expect(screen.getByRole("checkbox")).not.toBeChecked();
    });
  });

  describe("submitting with Enter", () => {
    it("pushes the movie search URL and closes the inputs", async () => {
      // Given: an open search bar with a search term.
      const user = userEvent.setup();
      const capture = renderSearchBar();
      await user.click(heading());

      // When: Enter is pressed after typing.
      await user.type(screen.getByRole("textbox"), "alien{Enter}");

      // Then: the search route is pushed with every query parameter.
      expect(currentRoute(capture).asPath).toBe(
        "/search?searchTerm=alien&includeAdult=false&entity=movie&page=1",
      );
      expect(currentRoute(capture).pathname).toBe("/search");
      expect(currentRoute(capture).query).toEqual({
        searchTerm: "alien",
        includeAdult: "false",
        entity: "movie",
        page: "1",
      });

      // Then: the inputs collapse again.
      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("pushes includeAdult=true and the selected entity", async () => {
      // Given: an open search bar switched to people with adult content enabled.
      const user = userEvent.setup();
      const capture = renderSearchBar();
      await user.click(heading());
      await user.click(entityToggle());
      await user.click(entityToggle());
      await user.click(screen.getByRole("checkbox"));

      // When: Enter is pressed after typing.
      await user.type(screen.getByRole("textbox"), "ripley{Enter}");

      // Then: the pushed URL carries the toggled adult flag and person entity.
      expect(currentRoute(capture).asPath).toBe(
        "/search?searchTerm=ripley&includeAdult=true&entity=person&page=1",
      );
    });

    it("trims and percent-encodes the search term", async () => {
      // Given: an open search bar.
      const user = userEvent.setup();
      const capture = renderSearchBar();
      await user.click(heading());

      // When: a padded multi-word term is submitted.
      await user.type(screen.getByRole("textbox"), "  blade runner  {Enter}");

      // Then: the term round-trips trimmed and encoded.
      // (`asPath` is regenerated by next-router-mock through URLSearchParams,
      // which renders the encoded space as `+`.)
      expect(currentRoute(capture).query.searchTerm).toBe("blade runner");
      expect(currentRoute(capture).asPath).toBe(
        "/search?searchTerm=blade+runner&includeAdult=false&entity=movie&page=1",
      );
    });

    it("does not navigate when the search term is only whitespace", async () => {
      // Given: an open search bar.
      const user = userEvent.setup();
      const capture = renderSearchBar();
      await user.click(heading());

      // When: Enter is pressed on a blank term.
      await user.type(screen.getByRole("textbox"), "   {Enter}");

      // Then: the router stays on the initial route and the inputs stay open.
      expect(currentRoute(capture).asPath).toBe("/");
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("does not navigate for non-Enter keys", async () => {
      // Given: an open search bar with a valid term.
      const user = userEvent.setup();
      const capture = renderSearchBar();
      await user.click(heading());

      // When: the term is typed without pressing Enter.
      await user.type(screen.getByRole("textbox"), "alien");

      // Then: no navigation happened.
      expect(currentRoute(capture).asPath).toBe("/");
    });
  });

  describe("entity icon default fallback", () => {
    it("renders the default movie icon through the cycle", async () => {
      // Given: a mounted search bar.
      const user = userEvent.setup();
      renderSearchBar();
      await user.click(heading());

      // When: the entity toggle cycles through tv and person and back.
      await user.click(entityToggle());
      await user.click(entityToggle());
      await user.click(entityToggle());

      // Then: the movie icon is present, exercising getEntityIcon's default case.
      expect(entityToggle()).toHaveTextContent("🎬");
    });
  });
});
