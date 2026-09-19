import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import Tv, { getServerSideProps } from "../../../src/pages/tv";
import { makeTvShow, type TvShow } from "../../fixtures/tv";
import { createGsspContext } from "../../helpers/gssp";
import { renderWithRouter } from "../../helpers/render";
import { server } from "../../msw/server";

const tvUrl = "http://localhost:3001/api/tv";

type TvPage = {
  readonly page?: number;
  readonly results: readonly TvShow[];
  readonly total_pages: number;
  readonly total_results: number;
};

const results: readonly TvShow[] = [
  makeTvShow({ id: 501, original_name: "Rendered Series One" }),
  makeTvShow({ id: 502, original_name: "Rendered Series Two" }),
];

function tvPage(page: number | undefined): TvPage {
  return { page, results, total_pages: 500, total_results: 2 };
}

async function renderFromServerProps({
  data,
  query = {},
}: {
  readonly data: TvPage;
  readonly query?: Record<string, string>;
}): Promise<void> {
  server.use(http.get(tvUrl, () => HttpResponse.json(data)));

  const result = await getServerSideProps(createGsspContext({ query }));
  const props = "props" in result ? result.props : undefined;

  if (props === undefined) {
    throw new Error("Expected getServerSideProps to return page props");
  }
  // `Tv` destructures `filterOptions.year` (src/pages/tv/index.js:11) but its
  // getServerSideProps only ever returns `{ adult }`, so the inferred prop type
  // demands a key production never sends. Spreading the real props over an
  // absent `year` keeps the rendered values identical to production.
  renderWithRouter(
    <Tv
      data={props.data}
      filterOptions={{ year: undefined, ...props.filterOptions }}
    />,
  );
}

describe("tv page rendered from getServerSideProps", () => {
  it("renders one card per series result", async () => {
    // Given: two series on page two.
    // When: the page renders the props returned by getServerSideProps.
    await renderFromServerProps({ data: tvPage(2) });

    // Then: every result becomes a card linking to its series route.
    expect(
      screen.getByRole("link", { name: "Rendered Series One" }),
    ).toHaveAttribute("href", "/tv/series/501");
    expect(
      screen.getByRole("link", { name: "Rendered Series Two" }),
    ).toHaveAttribute("href", "/tv/series/502");
    expect(screen.getByText("Rendered Series One")).toBeInTheDocument();
  });

  it("puts the current page in the title and the summary in the head", async () => {
    // Given: page two of the popular series.
    // When: the page renders.
    await renderFromServerProps({ data: tvPage(2) });

    // Then: the head reflects the page being viewed.
    expect(document.querySelector("title")).toHaveTextContent("TV | Page 2");
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "Tv series sorted by popularity.",
    );
  });

  it("falls back to page one in the title when the response omits page", async () => {
    // Given: a response with no page field.
    // When: the page renders.
    await renderFromServerProps({ data: tvPage(undefined) });

    // Then: the title falls back to page one and the cards still render.
    expect(document.querySelector("title")).toHaveTextContent("TV | Page 1");
    expect(
      screen.getByRole("link", { name: "Rendered Series One" }),
    ).toBeInTheDocument();
  });

  it("steps the nav one page in each direction on a middle page", async () => {
    // Given: page two of the series listing.
    // When: the page renders.
    await renderFromServerProps({ data: tvPage(2), query: { page: "2" } });

    // Then: the nav walks the tv route one page at a time.
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      "/tv?page=1",
    );
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      "/tv?page=3",
    );
  });

  it("carries the adult filter into both nav links", async () => {
    // Given: an adult-inclusive series listing on page two.
    // When: the page renders with that filter in the query.
    await renderFromServerProps({
      data: tvPage(2),
      query: { page: "2", adult: "true" },
    });

    // Then: both nav links keep the filter and only move the page.
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      "/tv?page=1&adult=true",
    );
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      "/tv?page=3&adult=true",
    );
  });

  it("clamps the next link at the last reachable page", async () => {
    // Given: the five-hundredth page, which is the API ceiling.
    // When: the page renders.
    await renderFromServerProps({ data: tvPage(500) });

    // Then: NEXT stays on page 500 while PREV steps back.
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      "/tv?page=500",
    );
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      "/tv?page=499",
    );
  });

  it("clamps the previous link at the first page", async () => {
    // Given: the first page of results.
    // When: the page renders.
    await renderFromServerProps({ data: tvPage(1) });

    // Then: PREV stays on page one while NEXT advances.
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      "/tv?page=1",
    );
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      "/tv?page=2",
    );
  });

  it("renders no cards when the listing is empty", async () => {
    // Given: an empty page of series.
    // When: the page renders.
    await renderFromServerProps({
      data: { page: 1, results: [], total_pages: 0, total_results: 0 },
    });

    // Then: only the pagination links remain.
    expect(screen.queryAllByRole("img")).toHaveLength(0);
    expect(screen.getAllByRole("link")).toHaveLength(2);
  });
});
