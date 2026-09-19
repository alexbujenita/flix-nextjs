import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "../../src/pages/index";
import { renderWithRouter } from "../helpers/render";

/**
 * The home page is static markup: a welcome heading and three `<Link>`s into
 * the app. It has no state, no data fetching, and no router reads, so these
 * tests lock the copy and the destinations. The `<Link>`s still need the
 * router context supplied by `renderWithRouter`.
 *
 * `next/head` is mocked in tests/setup.ts to render its children inline; React
 * then hoists the resulting `<title>` and `<link>` into `document.head`, which
 * is why the metadata assertions read from the document rather than the
 * rendered container.
 */

type LinkExpectation = {
  readonly href: string;
  readonly name: string;
};

const LINKS: readonly LinkExpectation[] = [
  { href: "/movies", name: "movies" },
  { href: "/register", name: "create" },
  { href: "/login", name: "Log in!" },
];

describe("Home page", () => {
  it("renders the welcome heading", () => {
    // Given / When: the home page renders.
    renderWithRouter(<Home />);

    // Then: the single h1 greets the visitor.
    expect(
      screen.getByRole("heading", { level: 1, name: "Welcome to My Flix." }),
    ).toBeInTheDocument();
  });

  it("links to movies, register, and login", () => {
    // Given / When: the home page renders.
    renderWithRouter(<Home />);

    // Then: each call to action points at its route.
    for (const { href, name } of LINKS) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });

  it("renders exactly the three calls to action", () => {
    // Given / When: the home page renders.
    renderWithRouter(<Home />);

    // Then: nothing else on the page is a link.
    expect(screen.getAllByRole("link")).toHaveLength(LINKS.length);
  });

  it("wraps each link in its surrounding sentence", () => {
    // Given / When: the home page renders.
    renderWithRouter(<Home />);

    // Then: the three h2s read as complete sentences, link text included.
    const sentences = screen
      .getAllByRole("heading", { level: 2 })
      .map((heading) => heading.textContent);
    expect(sentences).toEqual([
      "Start browsing movies right away.",
      "Or create a free account to save a personal list of favourites.",
      "Have an account already? Log in!",
    ]);
  });

  it("sets the document title and favicon through next/head", () => {
    // Given / When: the home page renders.
    renderWithRouter(<Home />);

    // Then: the metadata React hoisted into the head is the page's own.
    expect(document.title).toBe("MyFlix");
    expect(document.head.querySelector('link[rel="icon"]')).toHaveAttribute(
      "href",
      "/favicon.ico",
    );
  });
});
