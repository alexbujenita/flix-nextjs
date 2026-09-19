import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import Movie from "../../../src/pages/movie/[movieId]";
import { makeMovie } from "../../fixtures/movie";
import { logout } from "../../helpers/auth";
import { renderWithRouter } from "../../helpers/render";

const secondCastMember = {
  adult: false,
  cast_id: 2,
  character: "Fixture Villain",
  credit_id: "cast-credit-2",
  gender: 1,
  id: 102,
  known_for_department: "Acting",
  name: "Second Fixture Actor",
  order: 1,
  original_name: "Second Fixture Actor",
  popularity: 9.1,
  profile_path: "",
};

describe("movie detail render body", () => {
  // A logged-out viewer skips the favourite lookup effect, so every assertion
  // below is about the render body rather than hydrated state.
  beforeEach(() => {
    logout();
  });

  it("renders the poster, year, tagline, genres, overview, and IMDb link", () => {
    const movie = makeMovie({
      genres: [
        { id: 18, name: "Drama" },
        { id: 80, name: "Crime" },
      ],
      id: 812,
    });

    renderWithRouter(<Movie movie={movie} />);

    const poster = screen.getByAltText("Fixture Movie");
    expect(decodeURIComponent(poster.getAttribute("src") ?? "")).toContain(
      "https://image.tmdb.org/t/p/w185/fixture-poster.jpg",
    );
    expect(
      screen.getByRole("heading", { name: "Fixture Movie (2024)" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Every test needs a hero." }),
    ).toBeVisible();
    expect(screen.getByText("Genres: Drama, Crime")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "A fully populated movie fixture." }),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "IMDb" })).toHaveAttribute(
      "href",
      "https://www.imdb.com/title/tt0000001",
    );
    expect(
      screen.getByRole("link", { name: "SIMILAR MOVIES" }),
    ).toHaveAttribute("href", "/movie/similar-movies/812");
    expect(
      screen.getByRole("link", { name: "RECOMMENDED MOVIES" }),
    ).toHaveAttribute("href", "/movie/recommendations/812");
    expect(
      screen.getByRole("heading", { name: "SHOW TRAILERS" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "ADD FAV" })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "MARK AS SEEN" }),
    ).not.toBeInTheDocument();
  });

  it("reveals every cast member when SHOW CAST is clicked and hides them again", async () => {
    const user = userEvent.setup();
    const movie = makeMovie({
      credits: {
        cast: [makeMovie().credits.cast[0], secondCastMember],
        crew: [],
      },
      id: 812,
    });
    renderWithRouter(<Movie movie={movie} />);
    expect(
      screen.queryByRole("heading", { name: "HIDE CAST" }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("heading", { name: "SHOW CAST" }));

    expect(screen.getByRole("heading", { name: "HIDE CAST" })).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "SHOW CAST" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Fixture Actor")).toBeInTheDocument();
    expect(screen.getByText("Second Fixture Actor")).toBeInTheDocument();
    expect(screen.getByText("Alex Hero")).toBeInTheDocument();
    expect(screen.getByText("Fixture Villain")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Second Fixture Actor" }),
    ).toHaveAttribute("href", "/actor/102");

    await user.click(screen.getByRole("heading", { name: "HIDE CAST" }));

    expect(screen.getByRole("heading", { name: "SHOW CAST" })).toBeVisible();
    expect(screen.queryByText("Fixture Villain")).not.toBeInTheDocument();
    expect(screen.queryByText("Fixture Actor")).not.toBeInTheDocument();
  });

  it("falls back to the original title and drops every optional block when the payload is blank", () => {
    const movie = makeMovie({
      credits: { cast: [], crew: [] },
      genres: [],
      id: 812,
      imdb_id: "",
      original_title: "Original Fixture Title",
      overview: "",
      poster_path: "",
      release_date: "",
      tagline: "",
      title: "",
      videos: { results: [] },
    });

    renderWithRouter(<Movie movie={movie} />);

    expect(
      screen.getByRole("heading", { name: "Original Fixture Title" }),
    ).toBeVisible();
    expect(screen.getByText("Genres: N/A")).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "IMDb" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "SHOW TRAILERS" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "SHOW CAST" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Every test needs a hero." }),
    ).not.toBeInTheDocument();
  });

  it("survives a payload that omits credits, videos, genres, and release_date entirely", () => {
    const {
      credits: _credits,
      genres: _genres,
      release_date: _releaseDate,
      videos: _videos,
      ...sparseMovie
    } = makeMovie({ id: 812 });

    renderWithRouter(<Movie movie={sparseMovie} />);

    expect(
      screen.getByRole("heading", { name: "Fixture Movie" }),
    ).toBeVisible();
    expect(screen.getByText("Genres: N/A")).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "SHOW TRAILERS" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "SHOW CAST" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "SIMILAR MOVIES" }),
    ).toHaveAttribute("href", "/movie/similar-movies/812");
  });

  it("expands the trailer list without disturbing the cast toggle", async () => {
    const user = userEvent.setup();
    renderWithRouter(<Movie movie={makeMovie({ id: 812 })} />);

    await user.click(screen.getByRole("heading", { name: "SHOW TRAILERS" }));

    expect(
      screen.getByRole("heading", { name: "HIDE TRAILERS" }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { name: "SHOW CAST" })).toBeVisible();
  });
});
