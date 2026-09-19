import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import BottomNav from "../../src/components/BottomNav/BottomNav";
import { renderWithRouter } from "../helpers/render";

describe("<BottomNav />", () => {
  it("renders the prev and next anchors with exactly the given hrefs", () => {
    // Given: paginated routes either side of the current page.
    const prev = "/movies?page=2";
    const next = "/movies?page=4";

    // When: the navigation is rendered.
    renderWithRouter(<BottomNav prev={prev} next={next} />);

    // Then: each anchor points at its supplied route.
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      prev,
    );
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      next,
    );
  });

  it("renders no anchors beyond prev and next", () => {
    // Given: paginated routes either side of the current page.
    // When: the navigation is rendered.
    renderWithRouter(<BottomNav prev="/tv?page=1" next="/tv?page=3" />);

    // Then: exactly two links exist.
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });

  it("passes through non-paginated routes unchanged", () => {
    // Given: hrefs that are not query-string pages.
    const prev = "/movies";
    const next = "/user-favs";

    // When: the navigation is rendered.
    renderWithRouter(<BottomNav prev={prev} next={next} />);

    // Then: the anchors use those exact hrefs.
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      prev,
    );
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      next,
    );
  });
});
