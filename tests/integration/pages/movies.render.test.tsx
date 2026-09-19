import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it } from "vitest";

import Movies, { getServerSideProps } from "../../../src/pages/movies";
import { makeMovie, type Movie } from "../../fixtures/movie";
import { createGsspContext } from "../../helpers/gssp";
import { renderWithRouter } from "../../helpers/render";
import { server } from "../../msw/server";

const moviesUrl = "http://localhost:3001/api/movies";
const certificationsUrl = "http://localhost:3001/api/certifications";

type MoviePage = {
  readonly page?: number;
  readonly results: readonly Movie[];
  readonly total_pages: number;
  readonly total_results: number;
};

const results: readonly Movie[] = [
  makeMovie({ id: 812, title: "Rendered Movie One" }),
  makeMovie({ id: 813, title: "Rendered Movie Two" }),
];

function moviePage(page: number | undefined): MoviePage {
  return { page, results, total_pages: 500, total_results: 2 };
}

let certificationsRequests = 0;

beforeEach(() => {
  certificationsRequests = 0;
  server.use(
    http.get(certificationsUrl, () => {
      certificationsRequests += 1;
      return HttpResponse.json({
        certifications: {
          US: [
            { certification: "PG-13", meaning: "Parents cautioned.", order: 3 },
          ],
        },
      });
    }),
  );
});

/**
 * Fetches the page props the way Next.js would, then renders the page
 * component with exactly those props. The nested `FilterMovies` loads
 * certifications on mount, so the render waits for that request to land before
 * the assertions run.
 */
async function renderFromServerProps({
  data,
  query = {},
}: {
  readonly data: MoviePage;
  readonly query?: Record<string, string>;
}): Promise<void> {
  server.use(http.get(moviesUrl, () => HttpResponse.json(data)));

  const result = await getServerSideProps(createGsspContext({ query }));
  const props = "props" in result ? result.props : undefined;

  if (props === undefined) {
    throw new Error("Expected getServerSideProps to return page props");
  }
  renderWithRouter(<Movies {...props} />);
  await waitFor(() => expect(certificationsRequests).toBe(1));
}

describe("movies page rendered from getServerSideProps", () => {
  it("renders one card per movie result", async () => {
    // Given: two popular movies on page two.
    // When: the page renders the props returned by getServerSideProps.
    await renderFromServerProps({ data: moviePage(2) });

    // Then: every result becomes a card linking to its movie route.
    expect(
      screen.getByRole("link", { name: "Rendered Movie One" }),
    ).toHaveAttribute("href", "/movie/812");
    expect(
      screen.getByRole("link", { name: "Rendered Movie Two" }),
    ).toHaveAttribute("href", "/movie/813");
    expect(screen.getByText("Rendered Movie One")).toBeInTheDocument();
    expect(screen.getAllByText("(2024)")).toHaveLength(2);
  });

  it("puts the current page in the title and the summary in the head", async () => {
    // Given: page two of the popular movies.
    // When: the page renders.
    await renderFromServerProps({ data: moviePage(2) });

    // Then: the head reflects the page being viewed.
    expect(document.querySelector("title")).toHaveTextContent(
      "Movies | Page 2",
    );
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "Movies sorted by popularity.",
    );
  });

  it("falls back to page one in the title when the response omits page", async () => {
    // Given: a response with no page field.
    // When: the page renders.
    await renderFromServerProps({ data: moviePage(undefined) });

    // Then: the title falls back to page one and the cards still render.
    expect(document.querySelector("title")).toHaveTextContent(
      "Movies | Page 1",
    );
    expect(
      screen.getByRole("link", { name: "Rendered Movie One" }),
    ).toBeInTheDocument();
  });

  it("carries the active filter options into both nav links", async () => {
    // Given: a filtered movie listing on page two.
    // When: the page renders with those filters in the query.
    await renderFromServerProps({
      data: moviePage(2),
      query: {
        page: "2",
        year: "1999",
        certification: "PG-13",
        certificationCountry: "US",
        adult: "true",
      },
    });

    // Then: both nav links keep every filter and only move the page.
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      "/movies?page=1&year=1999&certificationCountry=US&certification=PG-13&adult=true",
    );
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      "/movies?page=3&year=1999&certificationCountry=US&certification=PG-13&adult=true",
    );
  });

  it("keeps the release-date filters on both nav links", async () => {
    // Given: a listing filtered by a release-date window.
    // When: the page renders with those dates in the query.
    await renderFromServerProps({
      data: moviePage(3),
      query: {
        page: "3",
        primaryReleaseDateGTE: "1990-01-01",
        primaryReleaseDateLTE: "1999-12-31",
      },
    });

    // Then: the date window survives pagination in both directions.
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      "/movies?page=2&primaryReleaseDateLTE=1999-12-31&primaryReleaseDateGTE=1990-01-01",
    );
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      "/movies?page=4&primaryReleaseDateLTE=1999-12-31&primaryReleaseDateGTE=1990-01-01",
    );
  });

  it("clamps the next link at the last reachable page", async () => {
    // Given: the five-hundredth page, which is the API ceiling.
    // When: the page renders.
    await renderFromServerProps({ data: moviePage(500) });

    // Then: NEXT stays on page 500 while PREV steps back.
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      "/movies?page=500",
    );
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      "/movies?page=499",
    );
  });

  it("clamps the previous link at the first page", async () => {
    // Given: the first page of results.
    // When: the page renders.
    await renderFromServerProps({ data: moviePage(1) });

    // Then: PREV stays on page one while NEXT advances.
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      "/movies?page=1",
    );
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      "/movies?page=2",
    );
  });

  it("mounts the filters and offers the countries returned by the API", async () => {
    // Given: a rendered movie listing.
    const user = userEvent.setup();
    await renderFromServerProps({ data: moviePage(1) });

    // When: the filter panel is opened.
    await user.click(screen.getByText("Filter Options"));

    // Then: the certification countries loaded by FilterMovies are selectable.
    expect(
      await screen.findByRole("option", { name: "US" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Refine search" }),
    ).toBeInTheDocument();
  });
});
