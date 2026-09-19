import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { expect, it } from "vitest";

import RandomMovies from "../../src/pages/random-movies";
import { makeMovie } from "../fixtures/movie";
import { renderWithRouter } from "../helpers/render";
import { server } from "../msw/server";

const randomMoviesUrl = "http://localhost:3001/api/random";

it("disables during refresh, replaces the movies, and re-enables", async () => {
  const user = userEvent.setup();
  const initialMovie = makeMovie({ id: 1, title: "Initial Movie" });
  const refreshedMovie = makeMovie({ id: 2, title: "Refreshed Movie" });
  let releaseResponse = () => {};
  const responseGate = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  server.use(
    http.get(randomMoviesUrl, async () => {
      await responseGate;
      return HttpResponse.json([refreshedMovie]);
    }),
  );
  renderWithRouter(<RandomMovies data={[initialMovie]} />);
  const refreshButton = screen.getByRole("button", { name: "Refresh movies" });

  await user.click(refreshButton);

  expect(refreshButton).toBeDisabled();
  expect(screen.getByText("Initial Movie")).toBeInTheDocument();

  releaseResponse();

  await waitFor(() => expect(refreshButton).toBeEnabled());
  expect(screen.getByText("Refreshed Movie")).toBeInTheDocument();
  expect(screen.queryByText("Initial Movie")).not.toBeInTheDocument();
});
