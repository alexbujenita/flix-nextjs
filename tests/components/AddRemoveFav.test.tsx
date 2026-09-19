import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/router";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AddRemoveFav from "../../src/components/AddRemoveFav/AddRemoveFav";
import {
  addMovieToFavs,
  removeMovieFromFavs,
} from "../../src/components/AddRemoveIcon/utils";
import { makeMovie, type Movie } from "../fixtures/movie";
import { loginAs, logout } from "../helpers/auth";
import { renderWithRouter } from "../helpers/render";

vi.mock("../../src/components/AddRemoveIcon/utils", () => ({
  addMovieToFavs: vi.fn(),
  removeMovieFromFavs: vi.fn(),
}));

const addFavSpy = vi.mocked(addMovieToFavs);
const removeFavSpy = vi.mocked(removeMovieFromFavs);

const ADD_HEADING = { name: "ADD FAV" } as const;
const REMOVE_HEADING = { name: "REMOVE" } as const;

/** Exposes the router route of the surrounding provider as a status region. */
function RouteProbe() {
  const router = useRouter();

  return <p role="status">{router.asPath}</p>;
}

function currentRoute(): string {
  return screen.getByRole("status").textContent ?? "";
}

type HostProps = {
  readonly movie: Movie;
  readonly initialIsFav: boolean;
  readonly movieId?: number;
};

/** Owns `isFav` the way the movie page does, so the flip is observable in the DOM. */
function FavHost({ movie, initialIsFav, movieId }: HostProps) {
  const [isFav, setIsFav] = useState(initialIsFav);

  return (
    <AddRemoveFav
      movie={movie}
      isFav={isFav}
      setIsFav={setIsFav}
      movieId={movieId ?? movie.id}
    />
  );
}

describe("AddRemoveFav", () => {
  const movie = makeMovie({
    id: 77,
    title: "Fav Fixture",
    poster_path: "/fav.jpg",
  });
  const startRoute = `/movie/${movie.id}`;

  beforeEach(() => {
    localStorage.clear();
    logout();
  });

  describe("rendering", () => {
    it("offers ADD FAV when the movie is not a favourite", () => {
      const setIsFav = vi.fn();

      renderWithRouter(
        <AddRemoveFav
          movie={movie}
          isFav={false}
          setIsFav={setIsFav}
          movieId={movie.id}
        />,
        { url: startRoute },
      );

      expect(screen.getByRole("heading", ADD_HEADING)).toBeInTheDocument();
      expect(screen.queryByRole("heading", REMOVE_HEADING)).toBeNull();
    });

    it("offers REMOVE when the movie is a favourite", () => {
      const setIsFav = vi.fn();

      renderWithRouter(
        <AddRemoveFav
          movie={movie}
          isFav={true}
          setIsFav={setIsFav}
          movieId={movie.id}
        />,
        { url: startRoute },
      );

      expect(screen.getByRole("heading", REMOVE_HEADING)).toBeInTheDocument();
      expect(screen.queryByRole("heading", ADD_HEADING)).toBeNull();
    });
  });

  describe("ADD FAV while logged in", () => {
    it("persists the favourite and marks it as one", async () => {
      // Given: an authenticated visitor on the movie page.
      loginAs();
      const setIsFav = vi.fn();
      renderWithRouter(
        <>
          <AddRemoveFav
            movie={movie}
            isFav={false}
            setIsFav={setIsFav}
            movieId={movie.id}
          />
          <RouteProbe />
        </>,
        { url: startRoute },
      );

      // When: ADD FAV is clicked.
      await userEvent.click(screen.getByRole("heading", ADD_HEADING));

      // Then: the favourite is sent and the parent flag flips to true.
      await waitFor(() =>
        expect(addFavSpy).toHaveBeenCalledWith(
          movie.id,
          movie.title,
          movie.poster_path,
        ),
      );
      await waitFor(() => expect(setIsFav).toHaveBeenCalledWith(true));
      expect(removeFavSpy).not.toHaveBeenCalled();
      // And: no redirect happens and no return route is stashed.
      expect(currentRoute()).toBe(startRoute);
      expect(localStorage.getItem("previousMovie")).toBeNull();
    });

    it("swaps the heading from ADD FAV to REMOVE once the parent state flips", async () => {
      loginAs();
      renderWithRouter(<FavHost movie={movie} initialIsFav={false} />, {
        url: startRoute,
      });

      await userEvent.click(screen.getByRole("heading", ADD_HEADING));

      expect(
        await screen.findByRole("heading", REMOVE_HEADING),
      ).toBeInTheDocument();
      expect(screen.queryByRole("heading", ADD_HEADING)).toBeNull();
    });

    it("sends movie.id and ignores the unused movieId prop", async () => {
      // Note: `movieId` is destructured by the component but never read; the
      // request is built from `movie` alone.
      loginAs();
      renderWithRouter(
        <FavHost movie={movie} initialIsFav={false} movieId={999_999} />,
        { url: startRoute },
      );

      await userEvent.click(screen.getByRole("heading", ADD_HEADING));

      await waitFor(() =>
        expect(addFavSpy).toHaveBeenCalledWith(
          movie.id,
          movie.title,
          movie.poster_path,
        ),
      );
      expect(addFavSpy).not.toHaveBeenCalledWith(
        999_999,
        expect.anything(),
        expect.anything(),
      );
    });
  });

  describe("ADD FAV while logged out", () => {
    it("stashes the return route and redirects to /login", async () => {
      // Given: an anonymous visitor on the movie page.
      logout();
      const setIsFav = vi.fn();
      renderWithRouter(
        <>
          <AddRemoveFav
            movie={movie}
            isFav={false}
            setIsFav={setIsFav}
            movieId={movie.id}
          />
          <RouteProbe />
        </>,
        { url: startRoute },
      );

      // When: ADD FAV is clicked.
      await userEvent.click(screen.getByRole("heading", ADD_HEADING));

      // Then: the movie route is stashed and the visitor is routed to login.
      await waitFor(() => expect(currentRoute()).toBe("/login"));
      expect(localStorage.getItem("previousMovie")).toBe(startRoute);
      // And: nothing is persisted and the fav flag is untouched.
      expect(addFavSpy).not.toHaveBeenCalled();
      expect(setIsFav).not.toHaveBeenCalled();
    });

    it("keeps showing ADD FAV after the redirect", async () => {
      logout();
      renderWithRouter(
        <>
          <FavHost movie={movie} initialIsFav={false} />
          <RouteProbe />
        </>,
        { url: startRoute },
      );

      await userEvent.click(screen.getByRole("heading", ADD_HEADING));

      await waitFor(() => expect(currentRoute()).toBe("/login"));
      expect(screen.getByRole("heading", ADD_HEADING)).toBeInTheDocument();
      expect(screen.queryByRole("heading", REMOVE_HEADING)).toBeNull();
    });
  });

  describe("REMOVE", () => {
    it("deletes the favourite and clears the flag", async () => {
      loginAs();
      const setIsFav = vi.fn();
      renderWithRouter(
        <>
          <AddRemoveFav
            movie={movie}
            isFav={true}
            setIsFav={setIsFav}
            movieId={movie.id}
          />
          <RouteProbe />
        </>,
        { url: startRoute },
      );

      await userEvent.click(screen.getByRole("heading", REMOVE_HEADING));

      await waitFor(() => expect(removeFavSpy).toHaveBeenCalledWith(movie.id));
      await waitFor(() => expect(setIsFav).toHaveBeenCalledWith(false));
      expect(addFavSpy).not.toHaveBeenCalled();
      expect(currentRoute()).toBe(startRoute);
    });

    it("deletes the favourite even when logged out, without redirecting", async () => {
      // The remove path has no auth guard at all.
      logout();
      const setIsFav = vi.fn();
      renderWithRouter(
        <>
          <AddRemoveFav
            movie={movie}
            isFav={true}
            setIsFav={setIsFav}
            movieId={movie.id}
          />
          <RouteProbe />
        </>,
        { url: startRoute },
      );

      await userEvent.click(screen.getByRole("heading", REMOVE_HEADING));

      await waitFor(() => expect(removeFavSpy).toHaveBeenCalledWith(movie.id));
      expect(currentRoute()).toBe(startRoute);
      expect(localStorage.getItem("previousMovie")).toBeNull();
    });

    it("swaps the heading from REMOVE to ADD FAV once the parent state flips", async () => {
      loginAs();
      renderWithRouter(<FavHost movie={movie} initialIsFav={true} />, {
        url: startRoute,
      });

      await userEvent.click(screen.getByRole("heading", REMOVE_HEADING));

      expect(
        await screen.findByRole("heading", ADD_HEADING),
      ).toBeInTheDocument();
      expect(screen.queryByRole("heading", REMOVE_HEADING)).toBeNull();
    });
  });
});
