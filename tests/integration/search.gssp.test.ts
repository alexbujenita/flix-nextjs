// @vitest-environment node

import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import { getServerSideProps } from "../../src/pages/search";
import { makeMovie } from "../fixtures/movie";
import { createGsspContext } from "../helpers/gssp";
import { server } from "../msw/server";

const searchUrl = "http://localhost:3001/api/search/:entity";

describe("search getServerSideProps", () => {
  it("normalizes the search term and returns data with search options", async () => {
    const data = {
      page: 3,
      results: [makeMovie({ title: "The Matrix" })],
      total_pages: 4,
      total_results: 1,
    };
    const requestQuery = vi.fn();
    server.use(
      http.get(searchUrl, ({ request }) => {
        requestQuery(new URL(request.url).searchParams);
        return HttpResponse.json(data);
      }),
    );
    const ctx = createGsspContext({
      query: {
        entity: "movie",
        includeAdult: "false",
        page: "3",
        searchTerm: "  ThE MaTrIx  ",
      },
    });

    const result = await getServerSideProps(ctx);

    expect(requestQuery).toHaveBeenCalledOnce();
    const searchParams = requestQuery.mock.calls[0]?.[0];
    expect(searchParams).toBeInstanceOf(URLSearchParams);
    expect(searchParams?.get("searchTerm")).toBe("the matrix");
    expect(searchParams?.get("pageNum")).toBe("3");
    expect(searchParams?.get("includeAdult")).toBe("false");
    expect(result).toEqual({
      props: {
        data,
        searchOpt: {
          entity: "movie",
          includeAdult: "false",
          normalizedSearch: "the matrix",
          page: "3",
        },
      },
    });
  });

  it("defaults the page to one", async () => {
    const requestQuery = vi.fn();
    server.use(
      http.get(searchUrl, ({ request }) => {
        requestQuery(new URL(request.url).searchParams);
        return HttpResponse.json({
          page: 1,
          results: [],
          total_pages: 0,
          total_results: 0,
        });
      }),
    );
    const ctx = createGsspContext({
      query: {
        entity: "person",
        includeAdult: "true",
        searchTerm: "Carrie-Anne Moss",
      },
    });

    const result = await getServerSideProps(ctx);

    const searchParams = requestQuery.mock.calls[0]?.[0];
    expect(searchParams?.get("pageNum")).toBe("1");
    expect(result).toMatchObject({ props: { searchOpt: { page: 1 } } });
  });

  it("returns notFound when the search request fails", async () => {
    server.use(
      http.get(searchUrl, () =>
        HttpResponse.json({ error: "Search unavailable" }, { status: 500 }),
      ),
    );
    const ctx = createGsspContext({
      query: {
        entity: "movie",
        includeAdult: "false",
        searchTerm: "The Matrix",
      },
    });

    const result = await getServerSideProps(ctx);

    expect(result).toEqual({ notFound: true });
  });

  it("throws TypeError when searchTerm is missing", async () => {
    const ctx = createGsspContext({
      query: { entity: "movie", includeAdult: "false" },
    });

    await expect(getServerSideProps(ctx)).rejects.toThrow(TypeError);
  });
});
