import axios from "axios";
import { describe, expect, it } from "vitest";

import { randomMovieFixture } from "./handlers";

type Endpoint = {
  readonly method: "DELETE" | "GET" | "PATCH" | "POST";
  readonly path: string;
};

const endpoints = [
  { method: "GET", path: "/api/movies" },
  { method: "GET", path: "/api/tv" },
  { method: "GET", path: "/api/search/movie" },
  { method: "GET", path: "/api/movie/1/include-all" },
  { method: "GET", path: "/api/movie/1/recommendations" },
  { method: "GET", path: "/api/movie/1/similar" },
  { method: "GET", path: "/api/tv/1" },
  { method: "GET", path: "/api/actor-movies/1" },
  { method: "GET", path: "/api/actor-info/1" },
  { method: "GET", path: "/api/random" },
  { method: "GET", path: "/api/certifications" },
  { method: "GET", path: "/api/favs/user-favs" },
  { method: "GET", path: "/api/favs/user-favs/1" },
  { method: "GET", path: "/api/favs/pdf" },
  { method: "POST", path: "/api/favs" },
  { method: "PATCH", path: "/api/favs/1" },
  { method: "DELETE", path: "/api/favs/1" },
  { method: "POST", path: "/api/auth/login" },
  { method: "POST", path: "/api/auth/register" },
  { method: "DELETE", path: "/api/auth/logout" },
  { method: "GET", path: "/admin/users" },
  { method: "GET", path: "/admin/users/1/movies" },
  { method: "DELETE", path: "/admin/users/1/movie/701" },
] as const satisfies readonly Endpoint[];

describe("MSW endpoint coverage", () => {
  it.each(endpoints)("handles $method $path", async ({ method, path }) => {
    const response = await axios.request({
      data: method === "POST" || method === "PATCH" ? { rating: 8 } : undefined,
      method,
      url: `http://localhost:3001${path}`,
    });

    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(300);
  });

  it("returns the random movie fixture", async () => {
    const response = await axios.get("http://localhost:3001/api/random");

    expect(response.data).toEqual(randomMovieFixture);
  });
});
