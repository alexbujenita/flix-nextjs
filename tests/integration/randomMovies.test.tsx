// @vitest-environment node

import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";

import { getStaticProps } from "../../src/pages/random-movies";
import { makeMovie } from "../fixtures/movie";
import { server } from "../msw/server";

const randomMoviesUrl = "http://localhost:3001/api/random";

describe("random movies getStaticProps", () => {
  it("returns the random movies as props", async () => {
    const data = [makeMovie()];
    server.use(http.get(randomMoviesUrl, () => HttpResponse.json(data)));

    const result = await getStaticProps();

    expect(result).toEqual({ props: { data } });
  });

  it("returns notFound when the request fails", async () => {
    server.use(
      http.get(randomMoviesUrl, () =>
        HttpResponse.json(
          { error: "Random movies unavailable" },
          { status: 500 },
        ),
      ),
    );

    const result = await getStaticProps();

    expect(result).toEqual({ notFound: true });
  });
});
