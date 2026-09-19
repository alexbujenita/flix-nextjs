import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { useRouter } from "next/router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LogInOut from "../../src/components/LogInOut/LogInOut";
import { renderWithRouter } from "../helpers/render";
import { server } from "../msw/server";

const origin = "http://localhost:3001";
const LOGOUT_URL = `${origin}/api/auth/logout`;

/**
 * `renderWithRouter` always supplies a `url`, so `MemoryRouterProvider` builds
 * an isolated router rather than the `next-router-mock` singleton. Navigation
 * is therefore observed through the same router the component consumes.
 */
function RouteProbe() {
  const router = useRouter();

  return <h1>{router.asPath}</h1>;
}

function currentRoute(): string {
  return screen.getByRole("heading", { level: 1 }).textContent ?? "";
}

describe("LogInOut", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("rendering branches", () => {
    it("renders a LOGOUT control when name is truthy", () => {
      // Given: a signed-in viewer with a display name.
      // When: the component renders.
      renderWithRouter(<LogInOut name="Ada" />);

      // Then: only the logout affordance is offered.
      expect(
        screen.getByRole("heading", { name: "LOGOUT" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "LOGIN" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "REGISTER" })).toBeNull();
    });

    it("renders LOGIN and REGISTER links when name is empty", () => {
      // Given: a signed-out viewer with no name.
      // When: the component renders.
      renderWithRouter(<LogInOut name="" />);

      // Then: both auth entry points are offered and logout is absent.
      expect(
        screen.getByRole("heading", { name: "LOGIN" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "REGISTER" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "LOGOUT" })).toBeNull();
    });

    it("points the LOGIN and REGISTER links at /login and /register", () => {
      // Given: a signed-out viewer.
      // When: the component renders.
      renderWithRouter(<LogInOut name="" />);

      // Then: the anchors carry the auth page hrefs.
      expect(screen.getByRole("link", { name: "LOGIN" })).toHaveAttribute(
        "href",
        "/login",
      );
      expect(screen.getByRole("link", { name: "REGISTER" })).toHaveAttribute(
        "href",
        "/register",
      );
    });
  });

  describe("logout cascade — success", () => {
    it("DELETEs /api/auth/logout when LOGOUT is clicked", async () => {
      // Given: a spy handler recording the logout request.
      const user = userEvent.setup();
      const logoutRequest = vi.fn();
      server.use(
        http.delete(LOGOUT_URL, ({ request }) => {
          logoutRequest({ method: request.method, url: request.url });
          return HttpResponse.json({ loggedOut: true });
        }),
      );
      renderWithRouter(<LogInOut name="Ada" />);

      // When: the viewer clicks LOGOUT.
      await user.click(screen.getByRole("heading", { name: "LOGOUT" }));

      // Then: the backend logout endpoint is called with DELETE.
      await waitFor(() => {
        expect(logoutRequest).toHaveBeenCalledWith({
          method: "DELETE",
          url: LOGOUT_URL,
        });
      });
    });

    it("resets the stored favourites to an empty list", async () => {
      // Given: a signed-in viewer with cached favourites.
      const user = userEvent.setup();
      localStorage.setItem("UserFavs", JSON.stringify([1, 2, 3]));
      renderWithRouter(<LogInOut name="Ada" />);

      // When: the viewer logs out.
      await user.click(screen.getByRole("heading", { name: "LOGOUT" }));

      // Then: setUserFavs([]) has rewritten the key as an empty array.
      await waitFor(() => {
        expect(localStorage.getItem("UserFavs")).toBe("[]");
      });
    });

    it("pushes /movies after a successful logout", async () => {
      // Given: a signed-in viewer on the home route.
      const user = userEvent.setup();
      renderWithRouter(
        <>
          <LogInOut name="Ada" />
          <RouteProbe />
        </>,
        { url: "/" },
      );
      expect(currentRoute()).toBe("/");

      // When: the viewer logs out.
      await user.click(screen.getByRole("heading", { name: "LOGOUT" }));

      // Then: the router navigates to the public movies listing.
      await waitFor(() => {
        expect(currentRoute()).toBe("/movies");
      });
    });
  });

  describe("logout cascade — localStorage bug lock", () => {
    /**
     * LogInOut.js:14 calls `localStorage.clear("LOGGED")`. `Storage.clear()`
     * accepts NO arguments, so the argument is ignored and the ENTIRE origin
     * storage is wiped rather than only the LOGGED key. These tests lock that
     * real behavior on purpose. Do not "fix" them into selective removal —
     * see docs/TEST-BUGS.md.
     */
    it("wipes every localStorage key, not just LOGGED, because Storage.clear ignores its argument", async () => {
      // Given: a LOGGED flag plus an unrelated key owned by another feature.
      const user = userEvent.setup();
      localStorage.setItem("LOGGED", "true");
      localStorage.setItem("unrelated", "keep");
      expect(localStorage.getItem("unrelated")).toBe("keep");
      renderWithRouter(<LogInOut name="Ada" />);

      // When: the viewer logs out.
      await user.click(screen.getByRole("heading", { name: "LOGOUT" }));

      // Then: the LOGGED key is gone — and so is the unrelated key (the bug).
      await waitFor(() => {
        expect(localStorage.getItem("LOGGED")).toBeNull();
      });
      expect(localStorage.getItem("unrelated")).toBeNull();
    });

    it("leaves only the UserFavs key written back after the wipe", async () => {
      // Given: three unrelated keys seeded before logout.
      const user = userEvent.setup();
      localStorage.setItem("LOGGED", "true");
      localStorage.setItem("unrelated", "keep");
      localStorage.setItem("theme", "dark");
      localStorage.setItem("UserFavs", JSON.stringify([7]));
      renderWithRouter(<LogInOut name="Ada" />);

      // When: the viewer logs out.
      await user.click(screen.getByRole("heading", { name: "LOGOUT" }));

      // Then: storage holds exactly the UserFavs key re-added by setUserFavs([]).
      await waitFor(() => {
        expect(localStorage.getItem("UserFavs")).toBe("[]");
      });
      expect(Object.keys(localStorage)).toEqual(["UserFavs"]);
      expect(localStorage.getItem("theme")).toBeNull();
      expect(localStorage.getItem("unrelated")).toBeNull();
    });
  });

  describe("logout cascade — failure", () => {
    it("alerts Retry. and does not navigate when the logout request fails", async () => {
      // Given: the logout endpoint returns 500.
      const user = userEvent.setup();
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      vi.spyOn(console, "log").mockImplementation(() => {});
      server.use(
        http.delete(LOGOUT_URL, () =>
          HttpResponse.json({ message: "boom" }, { status: 500 }),
        ),
      );
      renderWithRouter(
        <>
          <LogInOut name="Ada" />
          <RouteProbe />
        </>,
        { url: "/" },
      );

      // When: the viewer clicks LOGOUT.
      await user.click(screen.getByRole("heading", { name: "LOGOUT" }));

      // Then: the viewer is asked to retry and stays on the current route.
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("Retry.");
      });
      expect(currentRoute()).toBe("/");
    });

    it("leaves localStorage untouched when the logout request fails", async () => {
      // Given: seeded storage and a failing logout endpoint.
      const user = userEvent.setup();
      vi.spyOn(window, "alert").mockImplementation(() => {});
      vi.spyOn(console, "log").mockImplementation(() => {});
      localStorage.setItem("LOGGED", "true");
      localStorage.setItem("unrelated", "keep");
      server.use(
        http.delete(LOGOUT_URL, () =>
          HttpResponse.json({ message: "boom" }, { status: 500 }),
        ),
      );
      renderWithRouter(<LogInOut name="Ada" />);

      // When: the viewer clicks LOGOUT and the request rejects.
      await user.click(screen.getByRole("heading", { name: "LOGOUT" }));

      // Then: the clear/setUserFavs cascade never ran.
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith("Retry.");
      });
      expect(localStorage.getItem("LOGGED")).toBe("true");
      expect(localStorage.getItem("unrelated")).toBe("keep");
      expect(localStorage.getItem("UserFavs")).toBeNull();
    });

    it("logs the failure to the console", async () => {
      // Given: a failing logout endpoint and a console spy.
      const user = userEvent.setup();
      vi.spyOn(window, "alert").mockImplementation(() => {});
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      server.use(
        http.delete(LOGOUT_URL, () =>
          HttpResponse.json({ message: "boom" }, { status: 500 }),
        ),
      );
      renderWithRouter(<LogInOut name="Ada" />);

      // When: the viewer clicks LOGOUT.
      await user.click(screen.getByRole("heading", { name: "LOGOUT" }));

      // Then: the caught error is logged.
      await waitFor(() => {
        expect(logSpy).toHaveBeenCalled();
      });
    });
  });
});
