import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Series from "../../../src/pages/tv/series/[seriesId]";
import { makeTvShow } from "../../fixtures/tv";
import { renderWithRouter } from "../../helpers/render";

describe("<Series /> with seasons", () => {
  it("renders the poster, intro details and one card per season", () => {
    // Given: a fully populated series carrying a single season.
    const tvSeries = makeTvShow({ id: 501, name: "Rendered Series" });

    // When: the page renders.
    renderWithRouter(<Series tvSeries={tvSeries} />);

    // Then: the heading pairs the name with the first-air year.
    expect(
      screen.getByRole("heading", {
        name: "Rendered Series (first aired in 2023)",
      }),
    ).toBeInTheDocument();

    // And: the poster, overview, genres and counts are all present.
    expect(
      screen.getByRole("img", { name: "Rendered Series" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("A fully populated television fixture."),
    ).toBeInTheDocument();
    expect(screen.getByText("Drama")).toBeInTheDocument();
    expect(screen.getByText("Seasons: 1 | Episodes: 10")).toBeInTheDocument();

    // And: each season is a card linking to the season route of this series.
    expect(screen.getByRole("link", { name: "Season 1" })).toHaveAttribute(
      "href",
      "/tv/series/501/season/1",
    );
  });

  it("omits every optional intro section when its field is empty", () => {
    // Given: a series with no poster, air date, overview, genres or counts.
    const tvSeries = makeTvShow({
      first_air_date: "",
      genres: [],
      name: "Sparse Series",
      number_of_episodes: 0,
      number_of_seasons: 0,
      overview: "",
      poster_path: "",
    });

    // When: the page renders.
    renderWithRouter(<Series tvSeries={tvSeries} />);

    // Then: the heading carries the bare name with no air-date suffix.
    expect(
      screen.getByRole("heading", { name: "Sparse Series" }),
    ).toBeInTheDocument();

    // And: the optional blocks are absent rather than empty.
    expect(screen.queryByRole("img", { name: "Sparse Series" })).toBeNull();
    expect(screen.queryByText(/^Genres:/)).toBeNull();
    expect(screen.queryByText(/^Seasons: /)).toBeNull();

    // And: the seasons grid still renders.
    expect(screen.getByRole("link", { name: "Season 1" })).toBeInTheDocument();
  });

  it("falls back to original_name and drops genres when the payload omits them", () => {
    // Given: a series payload missing both name and genres.
    const tvSeries = makeTvShow({
      genres: undefined,
      name: undefined,
      original_name: "Original Fixture Name",
    });

    // When: the page renders.
    renderWithRouter(<Series tvSeries={tvSeries} />);

    // Then: original_name stands in for the missing name.
    expect(
      screen.getByRole("heading", {
        name: "Original Fixture Name (first aired in 2023)",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Original Fixture Name" }),
    ).toBeInTheDocument();

    // And: no genres block is rendered at all.
    expect(screen.queryByText(/^Genres:/)).toBeNull();
  });
});
