import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import RegisterRoute from "../../src/pages/register";
import { renderWithRouter } from "../helpers/render";

/**
 * `/register` is a four-line route file that renders `<RegisterPage />` and
 * nothing else. The form's own behavior is covered in
 * tests/components/RegisterPage.test.tsx; these tests only prove the route
 * mounts that component, adds no chrome of its own, and hands it no props.
 *
 * The four inputs carry no accessible label (see docs/TEST-BUGS.md), so they
 * are queried by placeholder, as tests/README.md requires.
 */

const PLACEHOLDERS = [
  "Enter Name",
  "Enter Surname",
  "Enter Email",
  "Enter Password",
] as const;

describe("Register route", () => {
  it("renders the RegisterPage form", () => {
    // Given / When: the route renders.
    renderWithRouter(<RegisterRoute />, { url: "/register" });

    // Then: every field of the registration form is present.
    for (const placeholder of PLACEHOLDERS) {
      expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    }
    expect(
      screen.getByRole("button", { name: "Register" }),
    ).toBeInTheDocument();
  });

  it("passes no props, so every field starts empty", () => {
    // Given / When: the route renders.
    renderWithRouter(<RegisterRoute />, { url: "/register" });

    // Then: the wrapper seeds nothing into the controlled inputs.
    for (const placeholder of PLACEHOLDERS) {
      expect(screen.getByPlaceholderText(placeholder)).toHaveValue("");
    }
  });

  it("adds no route-level chrome around the form", () => {
    // Given / When: the route renders.
    renderWithRouter(<RegisterRoute />, { url: "/register" });

    // Then: the form is mounted once and the route contributes nothing else.
    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
