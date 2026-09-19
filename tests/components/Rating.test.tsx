import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Rating from "../../src/components/Rating/Rating";
import { makeMovie } from "../fixtures/movie";
import { renderWithRouter } from "../helpers/render";
import { server } from "../msw/server";

const origin = "http://localhost:3001";
const MOVIE_ID = 42;

/**
 * FaStar receives `color="red"` when filled and `color="grey"` when not, and
 * react-icons forwards that prop onto the rendered `<svg>` as an attribute.
 * Fill is therefore asserted from SVG attributes, never from class names.
 */
const FILLED = "red";
const UNFILLED = "grey";

type PatchCall = {
  readonly body: unknown;
  readonly credentials: RequestCredentials;
  readonly id: string;
};

function capturePatch(status = 200): readonly PatchCall[] {
  const calls: PatchCall[] = [];

  server.use(
    http.patch(`${origin}/api/favs/:id`, async ({ params, request }) => {
      calls.push({
        body: await request.json(),
        credentials: request.credentials,
        id: String(params.id),
      });

      return status === 200
        ? HttpResponse.json({ updated: true })
        : new HttpResponse(null, { status });
    }),
  );

  return calls;
}

function starColors(container: HTMLElement): readonly (string | null)[] {
  return Array.from(container.querySelectorAll("svg")).map((star) =>
    star.getAttribute("color"),
  );
}

function fillCounts(container: HTMLElement): {
  readonly filled: number;
  readonly unfilled: number;
} {
  const colors = starColors(container);

  return {
    filled: colors.filter((color) => color === FILLED).length,
    unfilled: colors.filter((color) => color === UNFILLED).length,
  };
}

function renderRating(props: {
  readonly isFav: unknown;
  readonly movieRating: number;
  readonly setMovieRating: (rating: number) => void;
}) {
  return renderWithRouter(
    <Rating
      isFav={props.isFav}
      movie={makeMovie({ id: MOVIE_ID })}
      movieRating={props.movieRating}
      setMovieRating={props.setMovieRating}
    />,
  );
}

describe("Rating", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("favourite guard", () => {
    it("renders nothing when isFav is false", () => {
      // Given: the movie is not among the user's favourites.
      const setMovieRating = vi.fn();

      // When: the rating widget is rendered.
      const { container } = renderRating({
        isFav: false,
        movieRating: 5,
        setMovieRating,
      });

      // Then: the component renders null.
      expect(container.firstChild).toBeNull();
      expect(container.querySelectorAll("svg")).toHaveLength(0);
    });

    it("renders nothing when isFav is undefined", () => {
      // Given: the favourite flag has not resolved yet.
      const setMovieRating = vi.fn();

      // When: the rating widget is rendered.
      const { container } = renderRating({
        isFav: undefined,
        movieRating: 5,
        setMovieRating,
      });

      // Then: the component renders null.
      expect(container.firstChild).toBeNull();
    });
  });

  describe("star rendering", () => {
    it("renders exactly ten stars when isFav is truthy", () => {
      // Given: the movie is a favourite.
      const setMovieRating = vi.fn();

      // When: the rating widget is rendered.
      const { container } = renderRating({
        isFav: true,
        movieRating: 0,
        setMovieRating,
      });

      // Then: the fixed ten-star scale is rendered.
      expect(container.querySelectorAll("svg")).toHaveLength(10);
    });

    it("leaves every star unfilled at rating 0", () => {
      // Given: an unrated favourite.
      const setMovieRating = vi.fn();

      // When: the rating widget is rendered.
      const { container } = renderRating({
        isFav: true,
        movieRating: 0,
        setMovieRating,
      });

      // Then: no star is filled.
      expect(fillCounts(container)).toEqual({ filled: 0, unfilled: 10 });
    });

    it("fills exactly movieRating stars at a mid-scale rating", () => {
      // Given: a favourite rated seven out of ten.
      const setMovieRating = vi.fn();

      // When: the rating widget is rendered.
      const { container } = renderRating({
        isFav: true,
        movieRating: 7,
        setMovieRating,
      });

      // Then: seven stars are filled and three are not.
      expect(fillCounts(container)).toEqual({ filled: 7, unfilled: 3 });
    });

    it("fills the leading stars in order rather than an arbitrary subset", () => {
      // Given: a favourite rated three out of ten.
      const setMovieRating = vi.fn();

      // When: the rating widget is rendered.
      const { container } = renderRating({
        isFav: true,
        movieRating: 3,
        setMovieRating,
      });

      // Then: the first three stars carry the filled colour.
      expect(starColors(container)).toEqual([
        FILLED,
        FILLED,
        FILLED,
        UNFILLED,
        UNFILLED,
        UNFILLED,
        UNFILLED,
        UNFILLED,
        UNFILLED,
        UNFILLED,
      ]);
    });

    it("fills every star at the maximum rating", () => {
      // Given: a favourite rated ten out of ten.
      const setMovieRating = vi.fn();

      // When: the rating widget is rendered.
      const { container } = renderRating({
        isFav: true,
        movieRating: 10,
        setMovieRating,
      });

      // Then: all ten stars are filled.
      expect(fillCounts(container)).toEqual({ filled: 10, unfilled: 0 });
    });
  });

  describe("rating a movie", () => {
    it("PATCHes the movie with the clicked star position and credentials", async () => {
      // Given: an unrated favourite and a captured PATCH endpoint.
      const setMovieRating = vi.fn();
      const calls = capturePatch();
      const { container } = renderRating({
        isFav: true,
        movieRating: 0,
        setMovieRating,
      });

      // When: the third star is clicked.
      await userEvent.click(container.querySelectorAll("svg")[2]);

      // Then: the one-based rating is sent credentialed to the movie route.
      await waitFor(() => expect(calls).toHaveLength(1));
      expect(calls[0].id).toBe(String(MOVIE_ID));
      expect(calls[0].body).toEqual({ rating: 3 });
      expect(calls[0].credentials).toBe("include");
    });

    it("calls setMovieRating with the clicked star position", async () => {
      // Given: an unrated favourite.
      const setMovieRating = vi.fn();
      capturePatch();
      const { container } = renderRating({
        isFav: true,
        movieRating: 0,
        setMovieRating,
      });

      // When: the third star is clicked.
      await userEvent.click(container.querySelectorAll("svg")[2]);

      // Then: the local rating state is advanced to that value.
      await waitFor(() => expect(setMovieRating).toHaveBeenCalledWith(3));
      expect(setMovieRating).toHaveBeenCalledTimes(1);
    });

    it("sends rating 10 for the last star", async () => {
      // Given: an unrated favourite.
      const setMovieRating = vi.fn();
      const calls = capturePatch();
      const { container } = renderRating({
        isFav: true,
        movieRating: 0,
        setMovieRating,
      });

      // When: the final star is clicked.
      await userEvent.click(container.querySelectorAll("svg")[9]);

      // Then: the maximum rating is sent, proving the index is one-based.
      await waitFor(() => expect(calls).toHaveLength(1));
      expect(calls[0].body).toEqual({ rating: 10 });
      expect(setMovieRating).toHaveBeenCalledWith(10);
    });

    it("does nothing when the already selected star is clicked", async () => {
      // Given: a favourite already rated four out of ten.
      const setMovieRating = vi.fn();
      const calls = capturePatch();
      const { container } = renderRating({
        isFav: true,
        movieRating: 4,
        setMovieRating,
      });

      // When: the fourth star, the current rating, is clicked.
      await userEvent.click(container.querySelectorAll("svg")[3]);

      // Then: no request is made and the rating state is untouched.
      expect(calls).toHaveLength(0);
      expect(setMovieRating).not.toHaveBeenCalled();
    });
  });

  describe("failure path", () => {
    it("logs the error and leaves the rating unchanged when the PATCH fails", async () => {
      // Given: the favourites API rejects the rating update.
      const setMovieRating = vi.fn();
      const calls = capturePatch(500);
      const { container } = renderRating({
        isFav: true,
        movieRating: 0,
        setMovieRating,
      });

      // When: a star is clicked.
      await userEvent.click(container.querySelectorAll("svg")[5]);

      // Then: the error is logged and the rating state is not advanced.
      await waitFor(() => expect(console.log).toHaveBeenCalledTimes(1));
      expect(calls).toHaveLength(1);
      expect(calls[0].body).toEqual({ rating: 6 });
      expect(setMovieRating).not.toHaveBeenCalled();
    });

    it("keeps the rendered stars unchanged after a failed PATCH", async () => {
      // Given: the favourites API rejects the rating update.
      const setMovieRating = vi.fn();
      capturePatch(500);
      const { container } = renderRating({
        isFav: true,
        movieRating: 2,
        setMovieRating,
      });

      // When: a higher star is clicked and the request fails.
      await userEvent.click(container.querySelectorAll("svg")[8]);

      // Then: the fill counts still reflect the original rating.
      await waitFor(() => expect(console.log).toHaveBeenCalledTimes(1));
      expect(fillCounts(container)).toEqual({ filled: 2, unfilled: 8 });
    });
  });
});
