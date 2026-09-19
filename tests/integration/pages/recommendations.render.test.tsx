import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import Recommendations, {
  getServerSideProps,
} from "../../../src/pages/movie/recommendations/[recMovieId]";
import { makeMovie, type Movie } from "../../fixtures/movie";
import { createGsspContext } from "../../helpers/gssp";
import { renderWithRouter } from "../../helpers/render";
import { server } from "../../msw/server";

const recommendationsUrl =
  "http://localhost:3001/api/movie/:movieId/recommendations";
const currentMovieId = "17";

type MoviePage = {
  readonly page: number;
  readonly results: readonly Movie[];
  readonly total_pages: number;
  readonly total_results: number;
};

const results: readonly Movie[] = [
  makeMovie({ id: 812, title: "First Recommendation" }),
  makeMovie({ id: 813, title: "Second Recommendation" }),
];

function moviePage(page: number, totalPages: number): MoviePage {
  return { page, results, total_pages: totalPages, total_results: 2 };
}

async function renderFromServerProps(data: MoviePage): Promise<void> {
  server.use(http.get(recommendationsUrl, () => HttpResponse.json(data)));

  const result = await getServerSideProps(
    createGsspContext({ params: { recMovieId: currentMovieId } }),
  );
  const props = "props" in result ? result.props : undefined;

  if (props === undefined) {
    throw new Error("Expected getServerSideProps to return page props");
  }
  renderWithRouter(<Recommendations {...props} />);
}

describe("recommendations page rendered from getServerSideProps", () => {
  it("renders one card per recommended movie", async () => {
    // Given: two recommendations on a middle page.
    // When: the page renders the props returned by getServerSideProps.
    await renderFromServerProps(moviePage(2, 4));

    // Then: every result becomes a card linking to its movie route.
    expect(
      screen.getByRole("link", { name: "First Recommendation" }),
    ).toHaveAttribute("href", "/movie/812");
    expect(
      screen.getByRole("link", { name: "Second Recommendation" }),
    ).toHaveAttribute("href", "/movie/813");
    expect(screen.getByText("First Recommendation")).toBeInTheDocument();
    expect(screen.getAllByText("(2024)")).toHaveLength(2);
  });

  it("renders the page title and description in the document head", async () => {
    // Given: any recommendations response.
    // When: the page renders.
    await renderFromServerProps(moviePage(2, 4));

    // Then: the head carries the recommendations metadata.
    expect(document.querySelector("title")).toHaveTextContent(
      "Recommended movies",
    );
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "Showing recommended results.",
    );
  });

  it("steps the nav one page in each direction on a middle page", async () => {
    // Given: page two of four.
    // When: the page renders.
    await renderFromServerProps(moviePage(2, 4));

    // Then: the nav walks to the neighbouring pages of the same movie.
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      "/movie/recommendations/17?page=1",
    );
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      "/movie/recommendations/17?page=3",
    );
  });

  it("clamps the next link to the final page on the last page", async () => {
    // Given: the last of four pages.
    // When: the page renders.
    await renderFromServerProps(moviePage(4, 4));

    // Then: NEXT stops at the final page while PREV still steps back.
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      "/movie/recommendations/17?page=4",
    );
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      "/movie/recommendations/17?page=3",
    );
  });

  it("hides the nav entirely when there is only one page", async () => {
    // Given: a single page of recommendations.
    // When: the page renders.
    await renderFromServerProps(moviePage(1, 1));

    // Then: the cards render without any pagination controls.
    expect(screen.queryByRole("link", { name: "PREV" })).toBeNull();
    expect(screen.queryByRole("link", { name: "NEXT" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "First Recommendation" }),
    ).toBeInTheDocument();
  });

  it("renders no cards when the movie has no recommendations", async () => {
    // Given: an empty result set on a single page.
    // When: the page renders.
    await renderFromServerProps({
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    });

    // Then: nothing is linked at all.
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });
});
