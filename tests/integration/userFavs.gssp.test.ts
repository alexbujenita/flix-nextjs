// @vitest-environment node

import axios from "axios";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import { getServerSideProps } from "../../src/pages/user-favs";
import { createGsspContext } from "../helpers/gssp";
import { server } from "../msw/server";

const endpoint = "http://localhost:3001/api/favs/user-favs";
const favorites = {
  page: 3,
  rows: [{ UserFavourites: [] }],
  totalPages: 4,
};

describe("user-favs getServerSideProps", () => {
  it("returns notFound without making a request when the cookie is missing", async () => {
    const requestSpy = vi.fn();
    server.use(
      http.get(endpoint, () => {
        requestSpy();
        return HttpResponse.json(favorites);
      }),
    );

    const result = await getServerSideProps(createGsspContext());

    expect(result).toEqual({ notFound: true });
    expect(requestSpy).toHaveBeenCalledTimes(0);
  });

  it("forwards the cookie and returns the response for a filtered request", async () => {
    const cookie = "JWT_TOKEN_MY_FLIX=signed-token; theme=dark";
    const requestSpy = vi.fn();
    const axiosGetSpy = vi.spyOn(axios, "get");
    server.use(
      http.get(endpoint, ({ request }) => {
        requestSpy({
          cookie: request.headers.get("cookie"),
          url: request.url,
        });
        return HttpResponse.json(favorites);
      }),
    );

    const result = await getServerSideProps(
      createGsspContext({
        cookie,
        query: { page: "3", searchQuery: "alien", seen: "true" },
      }),
    );

    expect(result).toEqual({ props: favorites });
    expect(requestSpy).toHaveBeenCalledWith({
      cookie,
      url: `${endpoint}?page=3&seen=true&searchQuery=alien`,
    });
    expect(axiosGetSpy).toHaveBeenCalledWith(
      `${endpoint}?page=3&seen=true&searchQuery=alien`,
      {
        headers: { Cookie: cookie },
        withCredentials: true,
      },
    );
  });

  it("uses the default query values without a search fragment", async () => {
    const requestSpy = vi.fn();
    server.use(
      http.get(endpoint, ({ request }) => {
        requestSpy(request.url);
        return HttpResponse.json(favorites);
      }),
    );

    const result = await getServerSideProps(
      createGsspContext({ cookie: "JWT_TOKEN_MY_FLIX=token" }),
    );

    expect(result).toEqual({ props: favorites });
    expect(requestSpy).toHaveBeenCalledWith(`${endpoint}?page=1&seen=`);
  });

  it("logs the request error and returns notFound", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    server.use(
      http.get(endpoint, () =>
        HttpResponse.json({ error: "Unavailable" }, { status: 500 }),
      ),
    );

    const result = await getServerSideProps(
      createGsspContext({ cookie: "JWT_TOKEN_MY_FLIX=token" }),
    );

    expect(result).toEqual({ notFound: true });
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });
});
