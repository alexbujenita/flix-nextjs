import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { HttpResponse, http } from "msw";
import {
  addMovieToFavs,
  removeMovieFromFavs,
} from "../../src/components/AddRemoveIcon/utils";
import { getUserFavs, setUserFavs } from "../../src/utils/userFavs";
import { server } from "../msw/server";

const origin = "http://localhost:3001";

describe("AddRemoveIcon utils", () => {
  beforeEach(() => {
    localStorage.clear();
    setUserFavs([]);
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    server.resetHandlers();
  });

  describe("addMovieToFavs", () => {
    it("POSTs to /api/favs with correct body and withCredentials: true", async () => {
      const requestBody = vi.fn();
      const requestCredentials = vi.fn();
      server.use(
        http.post(`${origin}/api/favs`, async ({ request }) => {
          const body = await request.json();
          requestBody(body);
          requestCredentials(request.credentials);
          return HttpResponse.json({ id: 1 }, { status: 201 });
        }),
      );

      await addMovieToFavs(123, "Test Movie", "/poster.jpg");

      expect(requestBody).toHaveBeenCalledWith({
        movieRefId: 123,
        movieTitle: "Test Movie",
        moviePosterPath: "/poster.jpg",
      });
      expect(requestCredentials).toHaveBeenCalledWith("include");
    });

    it("falls back moviePosterPath to empty string when falsy", async () => {
      const requestBody = vi.fn();
      server.use(
        http.post(`${origin}/api/favs`, async ({ request }) => {
          const body = await request.json();
          requestBody(body);
          return HttpResponse.json({ id: 1 }, { status: 201 });
        }),
      );

      await addMovieToFavs(123, "Test Movie", null as never);

      expect(requestBody).toHaveBeenCalledWith({
        movieRefId: 123,
        movieTitle: "Test Movie",
        moviePosterPath: "",
      });
    });

    it("falls back moviePosterPath to empty string when undefined", async () => {
      const requestBody = vi.fn();
      server.use(
        http.post(`${origin}/api/favs`, async ({ request }) => {
          const body = await request.json();
          requestBody(body);
          return HttpResponse.json({ id: 1 }, { status: 201 });
        }),
      );

      await addMovieToFavs(123, "Test Movie", undefined as never);

      expect(requestBody).toHaveBeenCalledWith({
        movieRefId: 123,
        movieTitle: "Test Movie",
        moviePosterPath: "",
      });
    });

    it("appends id to localStorage favs on success", async () => {
      setUserFavs([10, 20]);

      server.use(
        http.post(`${origin}/api/favs`, () =>
          HttpResponse.json({ id: 1 }, { status: 201 }),
        ),
      );

      await addMovieToFavs(123, "Test Movie", "/poster.jpg");

      expect(getUserFavs()).toEqual([10, 20, 123]);
    });

    it("calls console.log and alert on 500 error, does not throw", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      server.use(
        http.post(`${origin}/api/favs`, () =>
          HttpResponse.json({ error: "Server error" }, { status: 500 }),
        ),
      );

      // Should not throw
      await expect(
        addMovieToFavs(123, "Test Movie", "/poster.jpg"),
      ).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith("Try again later...");

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it("promise resolves even when MSW returns 500", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      server.use(
        http.post(`${origin}/api/favs`, () =>
          HttpResponse.json({ error: "Server error" }, { status: 500 }),
        ),
      );

      const result = await addMovieToFavs(123, "Test Movie", "/poster.jpg");

      expect(result).toBeUndefined();
      expect(alertSpy).toHaveBeenCalledWith("Try again later...");

      alertSpy.mockRestore();
    });

    it("does not update localStorage when request fails", async () => {
      setUserFavs([10, 20]);

      server.use(
        http.post(`${origin}/api/favs`, () =>
          HttpResponse.json({ error: "Server error" }, { status: 500 }),
        ),
      );

      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      await addMovieToFavs(123, "Test Movie", "/poster.jpg");

      expect(getUserFavs()).toEqual([10, 20]);

      alertSpy.mockRestore();
    });
  });

  describe("removeMovieFromFavs", () => {
    it("DELETEs /api/favs/:id with withCredentials: true", async () => {
      const requestPath = vi.fn();
      const requestCredentials = vi.fn();
      server.use(
        http.delete(`${origin}/api/favs/:id`, ({ params, request }) => {
          requestPath(params.id);
          requestCredentials(request.credentials);
          return HttpResponse.json({ deleted: true });
        }),
      );

      await removeMovieFromFavs(123);

      expect(requestPath).toHaveBeenCalledWith("123");
      expect(requestCredentials).toHaveBeenCalledWith("include");
    });

    it("filters id out from localStorage favs on success", async () => {
      setUserFavs([10, 123, 20]);

      server.use(
        http.delete(`${origin}/api/favs/:id`, () =>
          HttpResponse.json({ deleted: true }),
        ),
      );

      await removeMovieFromFavs(123);

      expect(getUserFavs()).toEqual([10, 20]);
    });

    it("calls console.log and alert on 500 error, does not throw", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      server.use(
        http.delete(`${origin}/api/favs/:id`, () =>
          HttpResponse.json({ error: "Server error" }, { status: 500 }),
        ),
      );

      // Should not throw
      await expect(removeMovieFromFavs(123)).resolves.toBeUndefined();

      expect(consoleSpy).toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith("Try again later...");

      consoleSpy.mockRestore();
      alertSpy.mockRestore();
    });

    it("promise resolves even when MSW returns 500", async () => {
      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      server.use(
        http.delete(`${origin}/api/favs/:id`, () =>
          HttpResponse.json({ error: "Server error" }, { status: 500 }),
        ),
      );

      const result = await removeMovieFromFavs(123);

      expect(result).toBeUndefined();
      expect(alertSpy).toHaveBeenCalledWith("Try again later...");

      alertSpy.mockRestore();
    });

    it("does not update localStorage when request fails", async () => {
      setUserFavs([10, 123, 20]);

      server.use(
        http.delete(`${origin}/api/favs/:id`, () =>
          HttpResponse.json({ error: "Server error" }, { status: 500 }),
        ),
      );

      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});

      await removeMovieFromFavs(123);

      expect(getUserFavs()).toEqual([10, 123, 20]);

      alertSpy.mockRestore();
    });
  });
});
