// @vitest-environment node

import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import { buildQuery } from "../../src/lib/buildQuery";
import { getServerSideProps } from "../../src/pages/tv";
import { makeTvShow } from "../fixtures/tv";
import { createGsspContext } from "../helpers/gssp";
import { server } from "../msw/server";

const tvUrl = "http://localhost:3001/api/tv";

describe("tv getServerSideProps", () => {
  it("returns data with defaulted filter options", async () => {
    const data = {
      page: 1,
      results: [makeTvShow()],
      total_pages: 1,
      total_results: 1,
    };
    server.use(http.get(tvUrl, () => HttpResponse.json(data)));

    const result = await getServerSideProps(createGsspContext());

    expect(result).toEqual({
      props: {
        data,
        filterOptions: { adult: false },
      },
    });
  });

  it("requests the URL produced by buildQuery in TV mode", async () => {
    const requestedUrl = vi.fn();
    server.use(
      http.get(tvUrl, ({ request }) => {
        requestedUrl(request.url);
        return HttpResponse.json({ page: 12, results: [] });
      }),
    );
    const expectedQuery = buildQuery(
      {
        page: 12,
        certification: "",
        certificationCountry: "",
        primaryReleaseDateGTE: "",
        primaryReleaseDateLTE: "",
        adult: true,
      },
      true,
    );

    await getServerSideProps(
      createGsspContext({ query: { page: "12", adult: "true" } }),
    );

    expect(requestedUrl).toHaveBeenCalledWith(
      `http://localhost:3001/api${expectedQuery}`,
    );
  });

  it("returns exactly notFound and logs when the API returns 500", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    server.use(
      http.get(tvUrl, () =>
        HttpResponse.json({ error: "Server error" }, { status: 500 }),
      ),
    );

    const result = await getServerSideProps(createGsspContext());

    expect(result).toEqual({ notFound: true });
    expect(consoleError).toHaveBeenCalledOnce();
  });
});
