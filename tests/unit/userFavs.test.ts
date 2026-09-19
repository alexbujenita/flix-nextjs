import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  parseUserFavs,
  getUserFavs,
  setUserFavs,
  USER_FAVS_UPDATED_EVENT,
} from "../../src/utils/userFavs";

describe("userFavs", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("parseUserFavs", () => {
    it("returns empty array for falsy input", () => {
      expect(parseUserFavs(null)).toEqual([]);
      expect(parseUserFavs(undefined)).toEqual([]);
      expect(parseUserFavs("")).toEqual([]);
      expect(parseUserFavs(0)).toEqual([]);
      expect(parseUserFavs(false)).toEqual([]);
    });

    it("returns valid JSON array as-is", () => {
      const testArray = [1, 2, 3];
      const result = parseUserFavs(JSON.stringify(testArray));
      expect(result).toEqual(testArray);

      const objectArray = [{ id: 1, name: "test" }];
      const result2 = parseUserFavs(JSON.stringify(objectArray));
      expect(result2).toEqual(objectArray);
    });

    it("returns empty array for valid JSON non-array (e.g., object)", () => {
      const jsonObject = '{"a":1}';
      expect(parseUserFavs(jsonObject)).toEqual([]);

      const jsonString = '"hello"';
      expect(parseUserFavs(jsonString)).toEqual([]);

      const jsonNumber = "42";
      expect(parseUserFavs(jsonNumber)).toEqual([]);

      const jsonNull = "null";
      expect(parseUserFavs(jsonNull)).toEqual([]);
    });

    it("logs via console.error and returns empty array for malformed JSON", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const malformedJson = '{"invalid": json}';
      const result = parseUserFavs(malformedJson);

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledOnce();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Unable to parse stored user favourites.",
        expect.any(SyntaxError),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("getUserFavs", () => {
    it("reads localStorage.getItem('UserFavs')", () => {
      const testArray = [42];
      localStorage.setItem("UserFavs", JSON.stringify(testArray));

      const result = getUserFavs();

      expect(result).toEqual(testArray);
    });

    it("returns empty array when localStorage has no UserFavs key", () => {
      const result = getUserFavs();

      expect(result).toEqual([]);
    });

    it("handles malformed JSON in localStorage", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      localStorage.setItem("UserFavs", "{invalid}");

      const result = getUserFavs();

      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe("setUserFavs", () => {
    it("throws TypeError for non-array argument", () => {
      expect(() => setUserFavs("nope" as never)).toThrow(TypeError);
      expect(() => setUserFavs("nope" as never)).toThrow(
        "User favourites must be an array.",
      );
    });

    it("throws TypeError for object argument", () => {
      expect(() => setUserFavs({ id: 1 } as never)).toThrow(TypeError);
      expect(() => setUserFavs({ id: 1 } as never)).toThrow(
        "User favourites must be an array.",
      );
    });

    it("throws TypeError for number argument", () => {
      expect(() => setUserFavs(42 as never)).toThrow(TypeError);
      expect(() => setUserFavs(42 as never)).toThrow(
        "User favourites must be an array.",
      );
    });

    it("writes JSON to localStorage key 'UserFavs'", () => {
      const testArray = [1, 2, 3];

      setUserFavs(testArray);

      const stored = localStorage.getItem("UserFavs");
      expect(stored).toBe(JSON.stringify(testArray));
    });

    it("writes empty array to localStorage", () => {
      setUserFavs([]);

      const stored = localStorage.getItem("UserFavs");
      expect(stored).toBe(JSON.stringify([]));
    });

    it("writes complex objects to localStorage", () => {
      const complexArray = [
        { id: 1, name: "Movie A", rating: 8.5 },
        { id: 2, name: "Movie B", rating: 7.2 },
      ];

      setUserFavs(complexArray);

      const stored = localStorage.getItem("UserFavs");
      expect(stored).toBe(JSON.stringify(complexArray));
    });

    it("dispatches a window event named 'user-favs-updated'", () => {
      const eventListenerSpy = vi.fn();
      window.addEventListener(USER_FAVS_UPDATED_EVENT, eventListenerSpy);

      setUserFavs([1, 2, 3]);

      expect(eventListenerSpy).toHaveBeenCalledOnce();
      expect(eventListenerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: USER_FAVS_UPDATED_EVENT,
        }),
      );

      window.removeEventListener(USER_FAVS_UPDATED_EVENT, eventListenerSpy);
    });

    it("dispatches event even when writing empty array", () => {
      const eventListenerSpy = vi.fn();
      window.addEventListener(USER_FAVS_UPDATED_EVENT, eventListenerSpy);

      setUserFavs([]);

      expect(eventListenerSpy).toHaveBeenCalledOnce();

      window.removeEventListener(USER_FAVS_UPDATED_EVENT, eventListenerSpy);
    });
  });
});
