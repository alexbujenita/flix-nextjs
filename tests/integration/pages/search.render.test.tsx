import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import Search, { getServerSideProps } from "../../../src/pages/search";
import { ENTITIES } from "../../../src/utils/constants";
import { makeMovie, type Movie } from "../../fixtures/movie";
import { makePerson, type Person } from "../../fixtures/person";
import { createGsspContext } from "../../helpers/gssp";
import { renderWithRouter } from "../../helpers/render";
import { server } from "../../msw/server";

const searchUrl = "http://localhost:3001/api/search/:entity";

type SearchResponse = {
  readonly page: number;
  readonly results: readonly (Movie | Person)[];
  readonly total_pages: number;
  readonly total_results: number;
};

async function renderFromServerProps({
  query,
  response,
}: {
  readonly query: Record<string, string>;
  readonly response: SearchResponse;
}): Promise<void> {
  server.use(http.get(searchUrl, () => HttpResponse.json(response)));
  const result = await getServerSideProps(createGsspContext({ query }));
  const props = "props" in result ? result.props : undefined;

  if (!props || !props.data || !props.searchOpt) {
    throw new Error("Expected getServerSideProps to return page props");
  }
  renderWithRouter(<Search data={props.data} searchOpt={props.searchOpt} />);
}

function navHref(name: "NEXT" | "PREV"): string | null {
  return screen.getByRole("link", { name }).getAttribute("href");
}

describe("search page rendered from getServerSideProps", () => {
  it("renders a movie card grid and both pagination links mid-list", async () => {
    // Given: page two of a four page movie search.
    await renderFromServerProps({
      query: {
        entity: ENTITIES.MOVIE,
        includeAdult: "false",
        page: "2",
        searchTerm: "  Matrix  ",
      },
      response: {
        page: 2,
        results: [makeMovie({ id: 812, title: "Rendered Search Movie" })],
        total_pages: 4,
        total_results: 1,
      },
    });

    // Then: each result is a movie card linking to its movie route.
    expect(screen.getByText("Rendered Search Movie")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Rendered Search Movie" }),
    ).toHaveAttribute("href", "/movie/812");

    // And: the nav steps one page either side, carrying the normalised term.
    expect(navHref("PREV")).toBe(
      "/search?searchTerm=matrix&includeAdult=false&entity=movie&page=1",
    );
    expect(navHref("NEXT")).toBe(
      "/search?searchTerm=matrix&includeAdult=false&entity=movie&page=3",
    );
  });

  it("clamps both pagination links on a single page of person results", async () => {
    // Given: a person search whose single page is also the first page.
    await renderFromServerProps({
      query: {
        entity: ENTITIES.PERSON,
        includeAdult: "true",
        page: "1",
        searchTerm: "Fixture Actor",
      },
      response: {
        page: 1,
        results: [makePerson({ id: 101, original_name: "Searched Actor" })],
        total_pages: 1,
        total_results: 1,
      },
    });

    // Then: person results render as person cards, not movie cards.
    expect(screen.getByText("Searched Actor")).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/actor/101");

    // And: a single page of results hides the pagination nav entirely.
    expect(screen.queryByRole("link", { name: "PREV" })).toBeNull();
    expect(screen.queryByRole("link", { name: "NEXT" })).toBeNull();
  });

  it("holds the next link on the final page of results", async () => {
    // Given: the last page of a four page search.
    await renderFromServerProps({
      query: {
        entity: ENTITIES.MOVIE,
        includeAdult: "false",
        page: "4",
        searchTerm: "matrix",
      },
      response: {
        page: 4,
        results: [makeMovie({ id: 812, title: "Last Page Movie" })],
        total_pages: 4,
        total_results: 1,
      },
    });

    // Then: next stays on the final page while prev steps back.
    expect(navHref("PREV")).toBe(
      "/search?searchTerm=matrix&includeAdult=false&entity=movie&page=3",
    );
    expect(navHref("NEXT")).toBe(
      "/search?searchTerm=matrix&includeAdult=false&entity=movie&page=4",
    );
  });

  it("renders the not-found message when the search returns no results", async () => {
    // Given: a search that matched nothing.
    await renderFromServerProps({
      query: {
        entity: ENTITIES.MOVIE,
        includeAdult: "false",
        page: "1",
        searchTerm: "no such film",
      },
      response: { page: 1, results: [], total_pages: 0, total_results: 0 },
    });

    // Then: the empty state replaces the grid and the nav.
    expect(
      screen.getByRole("heading", {
        name: "Nothing found, try a different search term",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link")).toBeNull();
  });
});
