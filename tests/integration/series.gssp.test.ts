// @vitest-environment node

import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import { getServerSideProps } from "../../src/pages/tv/series/[seriesId]";
import { makeTvShow } from "../fixtures/tv";
import { createGsspContext } from "../helpers/gssp";
import { server } from "../msw/server";

const seriesUrl = "http://localhost:3001/api/tv/:id";

describe("TV series getServerSideProps", () => {
  it("requests the parsed series id and returns the series", async () => {
    const tvSeries = makeTvShow();
    const requestedId = vi.fn();
    server.use(
      http.get(seriesUrl, ({ params }) => {
        requestedId(params.id);
        return HttpResponse.json(tvSeries);
      }),
    );

    const result = await getServerSideProps(
      createGsspContext({ params: { seriesId: "501" } }),
    );

    expect(requestedId).toHaveBeenCalledWith("501");
    expect(result).toEqual({ props: { tvSeries } });
  });

  it("logs the error and returns notFound when the request fails", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    server.use(
      http.get(seriesUrl, () =>
        HttpResponse.json({ error: "Series unavailable" }, { status: 500 }),
      ),
    );

    const result = await getServerSideProps(
      createGsspContext({ params: { seriesId: "501" } }),
    );

    expect(result).toEqual({ notFound: true });
    expect(consoleError).toHaveBeenCalledOnce();
  });
});
