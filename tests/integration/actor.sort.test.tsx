import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";

import ActorInfo from "../../src/pages/actor/[actorId]";
import { makeMovie } from "../fixtures/movie";
import { makePerson } from "../fixtures/person";
import { renderWithRouter } from "../helpers/render";

it("mutates the passed movies array in place when sorting by popularity", async () => {
  const user = userEvent.setup();
  const movies = [
    makeMovie({ id: 1, popularity: 10, title: "Less Popular" }),
    makeMovie({ id: 2, popularity: 90, title: "More Popular" }),
  ];
  const passedMovies = movies;
  const originalOrder = movies.map(({ id }) => id);
  renderWithRouter(<ActorInfo movies={movies} actor={makePerson()} />);

  await user.click(screen.getByRole("heading", { name: "POPULARITY" }));

  expect(movies).toBe(passedMovies);
  expect(movies.map(({ id }) => id)).not.toEqual(originalOrder);
  expect(movies.map(({ id }) => id)).toEqual([2, 1]);
});
