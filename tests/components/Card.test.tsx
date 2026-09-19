import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import Card from "../../src/components/Card/Card";
import { CONTENT_TYPE } from "../../src/utils/constants";
import { makeMovie } from "../fixtures/movie";
import { makeTvShow } from "../fixtures/tv";
import { loginAs, logout } from "../helpers/auth";
import { renderWithRouter } from "../helpers/render";

type CardEntity = {
  readonly id?: number;
  readonly poster_path?: string;
  readonly release_date?: string;
  readonly title?: string;
  readonly original_name?: string;
  readonly name?: string;
  readonly season_number?: number;
  readonly seriesId?: number;
  readonly [unreadField: string]: unknown;
};

const TMDB_POSTER_BASE = "https://image.tmdb.org/t/p/w342";
const PLACEHOLDER_POSTER = "/image-placeholder-vertical.jpg";
const YEAR_IN_PARENTHESES = /^\(\d{4}\)$/;

function renderCard(entity: CardEntity, contentType: string): void {
  // @ts-expect-error -- the defective `@param {Object} props` JSDoc at
  // src/components/Card/Card.js:9 types Card's props as the bare `Object`
  // type, which rejects every named prop the component actually reads.
  renderWithRouter(<Card {...entity} contentType={contentType} />);
}

function imageSource(): string {
  return screen.getByRole("img").getAttribute("src") ?? "";
}

function seasonEntity(seriesId: number): CardEntity {
  const [season] = makeTvShow().seasons;

  return { ...season, seriesId };
}

describe("<Card />", () => {
  beforeEach(() => {
    logout();
  });

  describe("poster image", () => {
    it("renders the TMDB poster through next/image when poster_path is set", () => {
      // Given: a movie carrying a TMDB poster path.
      const movie = makeMovie({ poster_path: "/fixture-poster.jpg" });

      // When: the card is rendered.
      renderCard(movie, CONTENT_TYPE.MOVIE);

      // Then: next/image optimises the remote TMDB poster.
      expect(imageSource()).toContain(
        encodeURIComponent(`${TMDB_POSTER_BASE}/fixture-poster.jpg`),
      );
    });

    it("renders the local placeholder when poster_path is missing", () => {
      // Given: a movie without a poster path.
      const movie = makeMovie({ poster_path: "" });

      // When: the card is rendered.
      renderCard(movie, CONTENT_TYPE.MOVIE);

      // Then: next/image falls back to the bundled placeholder.
      expect(imageSource()).toContain(encodeURIComponent(PLACEHOLDER_POSTER));
    });

    it("labels the poster with the resolved card title", () => {
      // Given: a movie with a known title.
      const movie = makeMovie({ title: "Poster Alt Movie" });

      // When: the card is rendered.
      renderCard(movie, CONTENT_TYPE.MOVIE);

      // Then: the image alt text is that title.
      expect(
        screen.getByRole("img", { name: "Poster Alt Movie" }),
      ).toBeInTheDocument();
    });
  });

  describe("release year", () => {
    it("shows the four-digit year when release_date is present", () => {
      // Given: a movie released on a known date.
      const movie = makeMovie({ release_date: "1999-03-31" });

      // When: the card is rendered.
      renderCard(movie, CONTENT_TYPE.MOVIE);

      // Then: only the year part of the date is displayed.
      expect(screen.getByText("(1999)")).toBeInTheDocument();
    });

    it("omits the year element when release_date is an empty string", () => {
      // Given: a movie whose release date is blank.
      const movie = makeMovie({ release_date: "" });

      // When: the card is rendered.
      renderCard(movie, CONTENT_TYPE.MOVIE);

      // Then: no year element exists at all.
      expect(screen.queryByText(YEAR_IN_PARENTHESES)).toBeNull();
    });

    it("omits the year element when the entity has no release_date field", () => {
      // Given: a tv season, which carries air_date rather than release_date.
      const season = seasonEntity(501);

      // When: the card is rendered.
      renderCard(season, CONTENT_TYPE.TV_SERIES_SEASON);

      // Then: no year element exists at all.
      expect(screen.queryByText(YEAR_IN_PARENTHESES)).toBeNull();
    });
  });

  describe("link target", () => {
    it("links a movie to its movie route", () => {
      // Given: a movie with a known id.
      const movie = makeMovie({ id: 27 });

      // When: the card is rendered as movie content.
      renderCard(movie, CONTENT_TYPE.MOVIE);

      // Then: the card links to the movie detail route.
      expect(screen.getByRole("link")).toHaveAttribute("href", "/movie/27");
    });

    it("links a tv series to its series route", () => {
      // Given: a tv series with a known id.
      const series = makeTvShow({ id: 88 });

      // When: the card is rendered as tv-series content.
      renderCard(series, CONTENT_TYPE.TV_SERIES);

      // Then: the card links to the series detail route.
      expect(screen.getByRole("link")).toHaveAttribute("href", "/tv/series/88");
    });

    it("links a tv season to the season route built from seriesId and season_number", () => {
      // Given: a season of a known series.
      const season = seasonEntity(88);

      // When: the card is rendered as tv-season content.
      renderCard(season, CONTENT_TYPE.TV_SERIES_SEASON);

      // Then: the route combines the series id with the season number.
      expect(screen.getByRole("link")).toHaveAttribute(
        "href",
        "/tv/series/88/season/1",
      );
    });

    it("falls back to the movie route for an unrecognised content type", () => {
      // Given: a content type the card does not handle explicitly.
      const movie = makeMovie({ id: 27 });

      // When: the card is rendered as person content.
      renderCard(movie, CONTENT_TYPE.PERSON);

      // Then: the default branch still links to the movie route.
      expect(screen.getByRole("link")).toHaveAttribute("href", "/movie/27");
    });
  });

  describe("title fallback chain", () => {
    it("prefers title over original_name and name", () => {
      // Given: an entity carrying all three title fields.
      const entity: CardEntity = {
        ...makeMovie({ title: "Primary Title" }),
        original_name: "Secondary Original Name",
        name: "Tertiary Name",
      };

      // When: the card is rendered.
      renderCard(entity, CONTENT_TYPE.MOVIE);

      // Then: only the title is displayed.
      expect(screen.getByText("Primary Title")).toBeInTheDocument();
      expect(screen.queryByText("Secondary Original Name")).toBeNull();
      expect(screen.queryByText("Tertiary Name")).toBeNull();
    });

    it("falls back to original_name when title is absent", () => {
      // Given: a tv series with distinct original_name and name, and no title.
      const series = makeTvShow({
        original_name: "Secondary Original Name",
        name: "Tertiary Name",
      });

      // When: the card is rendered.
      renderCard(series, CONTENT_TYPE.TV_SERIES);

      // Then: original_name wins over name.
      expect(screen.getByText("Secondary Original Name")).toBeInTheDocument();
      expect(screen.queryByText("Tertiary Name")).toBeNull();
    });

    it("falls back to name when both title and original_name are absent", () => {
      // Given: a tv series whose original_name is blank.
      const series = makeTvShow({
        original_name: "",
        name: "Tertiary Name",
      });

      // When: the card is rendered.
      renderCard(series, CONTENT_TYPE.TV_SERIES);

      // Then: name is the last resort.
      expect(screen.getByText("Tertiary Name")).toBeInTheDocument();
    });
  });

  describe("nested AddRemoveIcon", () => {
    it("renders the add control for movie content when the user is logged in", () => {
      // Given: a logged-in user viewing a movie card.
      loginAs();

      // When: the card is rendered.
      renderCard(makeMovie(), CONTENT_TYPE.MOVIE);

      // Then: the nested AddRemoveIcon offers the add affordance.
      expect(screen.getByText("+")).toBeInTheDocument();
    });

    it("renders no add control for tv-season content", () => {
      // Given: a logged-in user viewing a season card.
      loginAs();

      // When: the card is rendered.
      renderCard(seasonEntity(501), CONTENT_TYPE.TV_SERIES_SEASON);

      // Then: the nested AddRemoveIcon renders nothing.
      expect(screen.queryByText("+")).toBeNull();
      expect(screen.queryByText("-")).toBeNull();
    });
  });
});
