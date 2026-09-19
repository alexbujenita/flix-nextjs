import { screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { expect, it } from "vitest";

import RandomMovies, { getStaticProps } from "../../../src/pages/random-movies";
import { makeMovie } from "../../fixtures/movie";
import { renderWithRouter } from "../../helpers/render";
import { server } from "../../msw/server";

const randomMoviesUrl = "http://localhost:3001/api/random";

it("renders random movies from the props returned by getStaticProps", async () => {
  const movie = makeMovie({ id: 812, title: "Rendered Random Movie" });
  server.use(http.get(randomMoviesUrl, () => HttpResponse.json([movie])));

  const result = await getStaticProps();
  const data = "props" in result ? result.props?.data : undefined;

  if (!Array.isArray(data)) {
    throw new Error("Expected getStaticProps to return page props");
  }
  renderWithRouter(<RandomMovies data={data} />);

  expect(screen.getByText("Rendered Random Movie")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Refresh movies" })).toBeEnabled();
  expect(screen.getByRole("link")).toHaveAttribute("href", "/movie/812");
});
