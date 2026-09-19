import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import SimilarMovies, {
  getServerSideProps,
} from "../../../src/pages/movie/similar-movies/[movieIdSimilar]";
import { makeMovie, type Movie } from "../../fixtures/movie";
import { createGsspContext } from "../../helpers/gssp";
import { renderWithRouter } from "../../helpers/render";
import { server } from "../../msw/server";

const similarUrl = "http://localhost:3001/api/movie/:movieId/similar";
const currentMovieId = "23";

type MoviePage = {
  readonly page: number;
  readonly results: readonly Movie[];
  readonly total_pages: number;
  readonly total_results: number;
};

const results: readonly Movie[] = [
  makeMovie({ id: 914, title: "First Similar Movie" }),
  makeMovie({ id: 915, title: "Second Similar Movie" }),
];

function moviePage(page: number, totalPages: number): MoviePage {
  return { page, results, total_pages: totalPages, total_results: 2 };
}

async function renderFromServerProps(data: MoviePage): Promise<void> {
  server.use(http.get(similarUrl, () => HttpResponse.json(data)));

  const result = await getServerSideProps(
    createGsspContext({ params: { movieIdSimilar: currentMovieId } }),
  );
  const props = "props" in result ? result.props : undefined;

  if (props === undefined) {
    throw new Error("Expected getServerSideProps to return page props");
  }
  renderWithRouter(<SimilarMovies {...props} />);
}

describe("similar movies page rendered from getServerSideProps", () => {
  it("renders one card per similar movie", async () => {
    // Given: two similar movies on a middle page.
    // When: the page renders the props returned by getServerSideProps.
    await renderFromServerProps(moviePage(2, 4));

    // Then: every result becomes a card linking to its movie route.
    expect(
      screen.getByRole("link", { name: "First Similar Movie" }),
    ).toHaveAttribute("href", "/movie/914");
    expect(
      screen.getByRole("link", { name: "Second Similar Movie" }),
    ).toHaveAttribute("href", "/movie/915");
    expect(screen.getByText("Second Similar Movie")).toBeInTheDocument();
    expect(screen.getAllByText("(2024)")).toHaveLength(2);
  });

  it("renders the page title and description in the document head", async () => {
    // Given: any similar-movies response.
    // When: the page renders.
    await renderFromServerProps(moviePage(2, 4));

    // Then: the head carries the similar-movies metadata.
    expect(document.querySelector("title")).toHaveTextContent("Similar movies");
    expect(document.querySelector('meta[name="description"]')).toHaveAttribute(
      "content",
      "Showing similar results.",
    );
  });

  it("steps the nav one page in each direction on a middle page", async () => {
    // Given: page two of four.
    // When: the page renders.
    await renderFromServerProps(moviePage(2, 4));

    // Then: the nav walks to the neighbouring pages of the same movie.
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      "/movie/similar-movies/23?page=1",
    );
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      "/movie/similar-movies/23?page=3",
    );
  });

  it("clamps the next link to the final page on the last page", async () => {
    // Given: the last of four pages.
    // When: the page renders.
    await renderFromServerProps(moviePage(4, 4));

    // Then: NEXT stops at the final page while PREV still steps back.
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      "/movie/similar-movies/23?page=4",
    );
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      "/movie/similar-movies/23?page=3",
    );
  });

  it("hides the nav entirely when there is only one page", async () => {
    // Given: a single page of similar movies.
    // When: the page renders.
    await renderFromServerProps(moviePage(1, 1));

    // Then: the cards render without any pagination controls.
    expect(screen.queryByRole("link", { name: "PREV" })).toBeNull();
    expect(screen.queryByRole("link", { name: "NEXT" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "First Similar Movie" }),
    ).toBeInTheDocument();
  });

  it("renders no cards when the movie has no similar movies", async () => {
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
