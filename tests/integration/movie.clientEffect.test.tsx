import { screen, waitFor } from "@testing-library/react";
import axios from "axios";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import Movie from "../../src/pages/movie/[movieId]";
import { makeFavorite } from "../fixtures/favs";
import { makeMovie } from "../fixtures/movie";
import { loginAs, logout } from "../helpers/auth";
import { renderWithRouter } from "../helpers/render";
import { server } from "../msw/server";

const favoriteUrl = "http://localhost:3001/api/favs/user-favs/:id";
const movie = makeMovie({
  credits: { cast: [], crew: [] },
  imdb_id: "",
  poster_path: "",
  videos: { results: [] },
});

describe("movie detail client effect", () => {
  it("hydrates favourite, seen, and rating state for a logged-in viewer", async () => {
    loginAs();
    const favorite = makeFavorite({ rating: 6, seen: true });
    const favoriteRequests = vi.fn();
    const getSpy = vi.spyOn(axios, "get");
    server.use(
      http.get(favoriteUrl, ({ params }) => {
        favoriteRequests(params.id);
        return HttpResponse.json(favorite);
      }),
    );

    const { container } = renderWithRouter(<Movie movie={movie} />);

    expect(
      await screen.findByRole("heading", { name: "REMOVE" }),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "MARK AS UNSEEN" }),
    ).toBeVisible();
    await waitFor(() => {
      expect(container.querySelectorAll('svg[color="red"]')).toHaveLength(6);
    });
    expect(favoriteRequests).toHaveBeenCalledOnce();
    expect(favoriteRequests).toHaveBeenCalledWith(String(movie.id));
    expect(getSpy).toHaveBeenCalledWith(
      `http://localhost:3001/api/favs/user-favs/${movie.id}`,
      { withCredentials: true },
    );
  });

  it("does not request favourite state for a logged-out viewer", async () => {
    logout();
    const favoriteRequests = vi.fn();
    server.use(
      http.get(favoriteUrl, () => {
        favoriteRequests();
        return HttpResponse.json(makeFavorite());
      }),
    );

    const { container } = renderWithRouter(<Movie movie={movie} />);
    await Promise.resolve();

    expect(screen.getByRole("heading", { name: "ADD FAV" })).toBeVisible();
    expect(container.querySelectorAll("svg")).toHaveLength(0);
    expect(favoriteRequests).not.toHaveBeenCalled();
  });
});
