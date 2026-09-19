// @vitest-environment node

import axios from "axios";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import { getServerSideProps as getMovie } from "../../src/pages/movie/[movieId]";
import { getServerSideProps as getRecommendations } from "../../src/pages/movie/recommendations/[recMovieId]";
import { getServerSideProps as getSimilarMovies } from "../../src/pages/movie/similar-movies/[movieIdSimilar]";
import { makeMovie } from "../fixtures/movie";
import { createGsspContext } from "../helpers/gssp";
import { server } from "../msw/server";

const origin = "http://localhost:3001";

describe("movie detail getServerSideProps", () => {
  it("coerces the movie id with parseInt and returns the movie", async () => {
    const movie = makeMovie({ id: 42 });
    const requestedId = vi.fn();
    server.use(
      http.get(`${origin}/api/movie/:id/include-all`, ({ params }) => {
        requestedId(params.id);
        return HttpResponse.json(movie);
      }),
    );

    const result = await getMovie(
      createGsspContext({ params: { movieId: "42-trailing-text" } }),
    );

    expect(requestedId).toHaveBeenCalledWith("42");
    expect(result).toEqual({ props: { movie } });
  });

  it("returns notFound when the movie request fails", async () => {
    server.use(
      http.get(`${origin}/api/movie/:id/include-all`, () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
    );

    const result = await getMovie(
      createGsspContext({ params: { movieId: "42" } }),
    );

    expect(result).toEqual({ notFound: true });
  });
});

describe("recommendations getServerSideProps", () => {
  it("defaults page to one, sends credentials, and returns the current movie id", async () => {
    const data = {
      page: 1,
      results: [makeMovie()],
      total_pages: 1,
      total_results: 1,
    };
    const getSpy = vi.spyOn(axios, "get");

    const result = await getRecommendations(
      createGsspContext({ params: { recMovieId: "17" } }),
    );

    expect(getSpy).toHaveBeenCalledWith(
      `${origin}/api/movie/17/recommendations?pageNum=1`,
      { withCredentials: true },
    );
    expect(result).toEqual({ props: { data, currentMovieId: "17" } });
  });

  it("returns notFound when the recommendations request fails", async () => {
    server.use(
      http.get(`${origin}/api/movie/:id/recommendations`, () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
    );

    const result = await getRecommendations(
      createGsspContext({
        params: { recMovieId: "17" },
        query: { page: "3" },
      }),
    );

    expect(result).toEqual({ notFound: true });
  });
});

describe("similar movies getServerSideProps", () => {
  it("defaults page to one, sends credentials, and returns the current movie id", async () => {
    const data = {
      page: 1,
      results: [makeMovie()],
      total_pages: 1,
      total_results: 1,
    };
    const getSpy = vi.spyOn(axios, "get");

    const result = await getSimilarMovies(
      createGsspContext({ params: { movieIdSimilar: "23" } }),
    );

    expect(getSpy).toHaveBeenCalledWith(
      `${origin}/api/movie/23/similar?pageNum=1`,
      { withCredentials: true },
    );
    expect(result).toEqual({ props: { data, currentMovieId: "23" } });
  });

  it("returns notFound when the similar-movies request fails", async () => {
    server.use(
      http.get(`${origin}/api/movie/:id/similar`, () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
    );

    const result = await getSimilarMovies(
      createGsspContext({
        params: { movieIdSimilar: "23" },
        query: { page: "4" },
      }),
    );

    expect(result).toEqual({ notFound: true });
  });
});
