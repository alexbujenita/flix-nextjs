import { act, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import NavBar from "../../src/components/NavBar/NavBar";
import { loginAs, logout } from "../helpers/auth";
import { renderWithRouter } from "../helpers/render";

describe("<NavBar />", () => {
  beforeEach(() => {
    logout();
  });

  it("composes SearchBar and LogInOut in the logged-out state", () => {
    // Given: no auth cookie is present.
    // When: the nav bar is rendered.
    renderWithRouter(<NavBar />);

    // Then: SearchBar renders its toggle heading.
    expect(
      screen.getByRole("heading", { name: "Search movie" }),
    ).toBeInTheDocument();

    // Then: LogInOut renders its logged-out controls.
    expect(screen.getByRole("heading", { name: "LOGIN" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "REGISTER" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "LOGOUT" }),
    ).not.toBeInTheDocument();

    // Then: the nav's own logged-only link stays hidden.
    expect(
      screen.queryByRole("heading", { name: "FAVS" }),
    ).not.toBeInTheDocument();
  });

  it("propagates the logged-in state to LogInOut", () => {
    // Given: the auth cookie is set before the first render.
    loginAs();

    // When: the nav bar is rendered.
    renderWithRouter(<NavBar />);

    // Then: SearchBar still renders alongside LogInOut.
    expect(
      screen.getByRole("heading", { name: "Search movie" }),
    ).toBeInTheDocument();

    // Then: LogInOut swaps to its logged-in control.
    expect(screen.getByRole("heading", { name: "LOGOUT" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "LOGIN" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "REGISTER" }),
    ).not.toBeInTheDocument();

    // Then: the nav's logged-only link is shown from the same state.
    expect(screen.getByRole("heading", { name: "FAVS" })).toBeInTheDocument();
  });

  it("renders the primary section links regardless of login state", () => {
    // Given: no auth cookie is present.
    // When: the nav bar is rendered.
    renderWithRouter(<NavBar />);

    // Then: the static section links are present.
    expect(screen.getByRole("heading", { name: "Movies" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "TV" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "RaNDom" })).toBeInTheDocument();
  });

  it("re-reads the login state on window focus and updates LogInOut", async () => {
    // Given: a nav bar rendered while logged out.
    renderWithRouter(<NavBar />);
    expect(screen.getByRole("heading", { name: "LOGIN" })).toBeInTheDocument();

    // When: the cookie appears and the store's focus subscription fires.
    act(() => {
      loginAs();
      window.dispatchEvent(new Event("focus"));
    });
    await act(async () => {
      await Promise.resolve();
    });

    // Then: LogInOut reflects the new state without a remount.
    expect(screen.getByRole("heading", { name: "LOGOUT" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "LOGIN" }),
    ).not.toBeInTheDocument();
  });
});
