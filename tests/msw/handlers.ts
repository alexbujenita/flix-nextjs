import { HttpResponse, http } from "msw";

import { makeFavorite } from "../fixtures/favs";
import { makeMovie } from "../fixtures/movie";
import { makePerson } from "../fixtures/person";
import { makeTvShow } from "../fixtures/tv";

const origin = "http://localhost:3001";
const movie = makeMovie();
const person = makePerson();
const tvShow = makeTvShow();
const favorite = makeFavorite();

export const randomMovieFixture = makeMovie({
  id: 999,
  title: "Random Fixture Movie",
});

const moviePage = {
  page: 1,
  results: [movie],
  total_pages: 1,
  total_results: 1,
};

const tvPage = {
  page: 1,
  results: [tvShow],
  total_pages: 1,
  total_results: 1,
};

const userFavorites = {
  page: 1,
  rows: [
    {
      UserFavourites: [favorite],
      email: "viewer@example.com",
      firstName: "Fixture",
      id: 1,
      lastName: "Viewer",
    },
  ],
  totalPages: 1,
};

export const handlers = [
  http.get(`${origin}/api/movies`, () => HttpResponse.json(moviePage)),
  http.get(`${origin}/api/tv`, () => HttpResponse.json(tvPage)),
  http.get(`${origin}/api/search/:entity`, ({ params }) =>
    HttpResponse.json({
      page: 1,
      results: params.entity === "person" ? [person] : [movie],
      total_pages: 1,
      total_results: 1,
    }),
  ),
  http.get(`${origin}/api/movie/:id/include-all`, () =>
    HttpResponse.json(movie),
  ),
  http.get(`${origin}/api/movie/:id/recommendations`, () =>
    HttpResponse.json(moviePage),
  ),
  http.get(`${origin}/api/movie/:id/similar`, () =>
    HttpResponse.json(moviePage),
  ),
  http.get(`${origin}/api/tv/:id`, () => HttpResponse.json(tvShow)),
  http.get(`${origin}/api/actor-movies/:id`, () => HttpResponse.json([movie])),
  http.get(`${origin}/api/actor-info/:id`, () => HttpResponse.json(person)),
  http.get(`${origin}/api/random`, () => HttpResponse.json(randomMovieFixture)),
  http.get(`${origin}/api/certifications`, () =>
    HttpResponse.json({
      certifications: {
        US: [
          {
            certification: "PG-13",
            meaning:
              "Some material may be inappropriate for children under 13.",
            order: 3,
          },
        ],
      },
    }),
  ),
  http.get(`${origin}/api/favs/user-favs`, () =>
    HttpResponse.json(userFavorites),
  ),
  http.get(`${origin}/api/favs/user-favs/:id`, () =>
    HttpResponse.json(favorite),
  ),
  http.get(`${origin}/api/favs/pdf`, () =>
    HttpResponse.json({ filename: "favs.pdf", url: `${origin}/favs.pdf` }),
  ),
  http.post(`${origin}/api/favs`, () =>
    HttpResponse.json(favorite, { status: 201 }),
  ),
  http.patch(`${origin}/api/favs/:id`, () => HttpResponse.json(favorite)),
  http.delete(`${origin}/api/favs/:id`, () =>
    HttpResponse.json({ deleted: true }),
  ),
  http.post(`${origin}/api/auth/login`, () =>
    HttpResponse.json({
      token: "fixture-jwt-token",
      user: { email: "viewer@example.com", id: 1 },
    }),
  ),
  http.post(`${origin}/api/auth/register`, () =>
    HttpResponse.json(
      {
        token: "fixture-jwt-token",
        user: { email: "viewer@example.com", id: 1 },
      },
      { status: 201 },
    ),
  ),
  http.delete(`${origin}/api/auth/logout`, () =>
    HttpResponse.json({ loggedOut: true }),
  ),
  http.get(`${origin}/admin/users`, () =>
    HttpResponse.json({ count: 1, rows: userFavorites.rows }),
  ),
  http.get(`${origin}/admin/users/:id/movies`, () =>
    HttpResponse.json({ count: 1, rows: userFavorites.rows }),
  ),
  http.delete(`${origin}/admin/users/:userId/movie/:movieId`, () =>
    HttpResponse.json({ deleted: true }),
  ),
];
