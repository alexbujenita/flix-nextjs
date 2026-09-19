// @vitest-environment node

import axios from "axios";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import { getServerSideProps as getAdminUsersProps } from "../../src/pages/admin/users";
import { getServerSideProps as getAdminUserProps } from "../../src/pages/admin/users/[id]";
import { createGsspContext } from "../helpers/gssp";
import { server } from "../msw/server";

const origin = "http://localhost:3001";
const usersEndpoint = `${origin}/admin/users`;
const userMoviesEndpoint = `${origin}/admin/users/:id/movies`;
const adminResponse = {
  count: 1,
  rows: [{ UserFavourites: [], firstName: "Admin", id: 7 }],
};

describe("admin users getServerSideProps", () => {
  it("returns notFound without making a request when the cookie is missing", async () => {
    const requestSpy = vi.fn();
    server.use(
      http.get(usersEndpoint, () => {
        requestSpy();
        return HttpResponse.json(adminResponse);
      }),
    );

    const result = await getAdminUsersProps(createGsspContext());

    expect(result).toEqual({ notFound: true });
    expect(requestSpy).toHaveBeenCalledTimes(0);
  });

  it("forwards the cookie and returns the response", async () => {
    const cookie = "JWT_TOKEN_MY_FLIX=admin-token; session=secondary";
    const requestSpy = vi.fn();
    const axiosGetSpy = vi.spyOn(axios, "get");
    server.use(
      http.get(usersEndpoint, ({ request }) => {
        requestSpy(request.headers.get("cookie"));
        return HttpResponse.json(adminResponse);
      }),
    );

    const result = await getAdminUsersProps(createGsspContext({ cookie }));

    expect(result).toEqual({ props: adminResponse });
    expect(requestSpy).toHaveBeenCalledWith(cookie);
    expect(axiosGetSpy).toHaveBeenCalledWith(usersEndpoint, {
      headers: { Cookie: cookie },
      withCredentials: true,
    });
  });

  it("logs the request error and returns notFound", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    server.use(
      http.get(usersEndpoint, () =>
        HttpResponse.json({ error: "Unavailable" }, { status: 500 }),
      ),
    );

    const result = await getAdminUsersProps(
      createGsspContext({ cookie: "JWT_TOKEN_MY_FLIX=admin-token" }),
    );

    expect(result).toEqual({ notFound: true });
    expect(consoleSpy).toHaveBeenCalledTimes(1);
  });
});

describe("admin user detail getServerSideProps", () => {
  it("makes one request with an empty Cookie header when the cookie is missing", async () => {
    const requestSpy = vi.fn();
    const axiosGetSpy = vi.spyOn(axios, "get");
    server.use(
      http.get(userMoviesEndpoint, ({ request }) => {
        requestSpy(request.headers.get("cookie"));
        return HttpResponse.json(adminResponse);
      }),
    );

    const result = await getAdminUserProps(
      createGsspContext({ params: { id: "7" } }),
    );

    expect(result).toEqual({ props: adminResponse });
    expect(requestSpy).toHaveBeenCalledTimes(1);
    expect(requestSpy).toHaveBeenCalledWith("");
    expect(axiosGetSpy).toHaveBeenCalledWith(`${usersEndpoint}/7/movies`, {
      headers: { Cookie: "" },
      withCredentials: true,
    });
  });

  it("forwards the cookie and returns the response", async () => {
    const cookie = "JWT_TOKEN_MY_FLIX=admin-token";
    const requestSpy = vi.fn();
    server.use(
      http.get(userMoviesEndpoint, ({ params, request }) => {
        requestSpy({ cookie: request.headers.get("cookie"), id: params.id });
        return HttpResponse.json(adminResponse);
      }),
    );

    const result = await getAdminUserProps(
      createGsspContext({ cookie, params: { id: "42" } }),
    );

    expect(result).toEqual({ props: adminResponse });
    expect(requestSpy).toHaveBeenCalledWith({ cookie, id: "42" });
  });

  it("returns notFound when the request fails", async () => {
    server.use(
      http.get(userMoviesEndpoint, () =>
        HttpResponse.json({ error: "Unavailable" }, { status: 500 }),
      ),
    );

    const result = await getAdminUserProps(
      createGsspContext({
        cookie: "JWT_TOKEN_MY_FLIX=admin-token",
        params: { id: "7" },
      }),
    );

    expect(result).toEqual({ notFound: true });
  });

  it("turns a non-numeric id into NaN in the request URL", async () => {
    const requestSpy = vi.fn();
    server.use(
      http.get(userMoviesEndpoint, ({ params, request }) => {
        requestSpy({ id: params.id, url: request.url });
        return HttpResponse.json(adminResponse);
      }),
    );

    const result = await getAdminUserProps(
      createGsspContext({
        cookie: "JWT_TOKEN_MY_FLIX=admin-token",
        params: { id: "not-a-number" },
      }),
    );

    expect(result).toEqual({ props: adminResponse });
    expect(requestSpy).toHaveBeenCalledWith({
      id: "NaN",
      url: `${usersEndpoint}/NaN/movies`,
    });
  });
});
