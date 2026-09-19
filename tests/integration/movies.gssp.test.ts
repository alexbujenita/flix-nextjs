// @vitest-environment node

import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import { buildQuery } from "../../src/lib/buildQuery";
import { getServerSideProps } from "../../src/pages/movies";
import { makeMovie } from "../fixtures/movie";
import { createGsspContext } from "../helpers/gssp";
import { server } from "../msw/server";

const moviesUrl = "http://localhost:3001/api/movies";

describe("movies getServerSideProps", () => {
  it("returns data with defaulted filter options", async () => {
    const data = {
      page: 1,
      results: [makeMovie()],
      total_pages: 1,
      total_results: 1,
    };
    server.use(http.get(moviesUrl, () => HttpResponse.json(data)));

    const result = await getServerSideProps(createGsspContext());

    expect(result).toEqual({
      props: {
        data,
        filterOptions: {
          year: null,
          primaryReleaseDateLTE: null,
          primaryReleaseDateGTE: null,
          certification: null,
          certificationCountry: null,
          adult: false,
        },
      },
    });
  });

  it("requests the URL produced by buildQuery", async () => {
    const requestedUrl = vi.fn();
    server.use(
      http.get(moviesUrl, ({ request }) => {
        requestedUrl(request.url);
        return HttpResponse.json({ page: 7, results: [] });
      }),
    );
    const query = {
      page: "7",
      year: "2024",
      primaryReleaseDateLTE: "2024-12-31",
      primaryReleaseDateGTE: "2024-01-01",
      certification: "PG-13",
      certificationCountry: "US",
      adult: "true",
    };
    const expectedQuery = buildQuery({
      page: 7,
      primaryReleaseDateLTE: "2024-12-31",
      primaryReleaseDateGTE: "2024-01-01",
      certification: "PG-13",
      certificationCountry: "US",
      adult: true,
    });

    await getServerSideProps(createGsspContext({ query }));

    expect(requestedUrl).toHaveBeenCalledWith(
      `http://localhost:3001/api${expectedQuery}`,
    );
  });

  it("returns exactly notFound without logging when the API returns 500", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    server.use(
      http.get(moviesUrl, () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
    );

    const result = await getServerSideProps(createGsspContext());

    expect(result).toEqual({ notFound: true });
    expect(consoleError).not.toHaveBeenCalled();
  });
});
