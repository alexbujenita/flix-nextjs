import { CONTENT_TYPE, ENTITIES } from "../../src/utils/constants";

describe("constants", () => {
  describe("CONTENT_TYPE", () => {
    it("should have exactly 5 keys", () => {
      const keys = Object.keys(CONTENT_TYPE);
      expect(keys).toHaveLength(5);
    });

    it("should have the exact key set", () => {
      const keys = Object.keys(CONTENT_TYPE);
      expect(keys).toEqual(
        expect.arrayContaining([
          "MOVIE",
          "TV_SERIES",
          "PERSON",
          "TV_SERIES_SEASON",
          "TV_SERIES_EPISODE",
        ]),
      );
      expect(keys.sort()).toEqual(
        [
          "MOVIE",
          "PERSON",
          "TV_SERIES",
          "TV_SERIES_EPISODE",
          "TV_SERIES_SEASON",
        ].sort(),
      );
    });

    it("should have correct string values", () => {
      expect(CONTENT_TYPE.MOVIE).toBe("movie");
      expect(CONTENT_TYPE.TV_SERIES).toBe("tv");
      expect(CONTENT_TYPE.PERSON).toBe("person");
      expect(CONTENT_TYPE.TV_SERIES_SEASON).toBe("tv-season");
      expect(CONTENT_TYPE.TV_SERIES_EPISODE).toBe("tv-episode");
    });

    it("should be frozen", () => {
      expect(Object.isFrozen(CONTENT_TYPE)).toBe(true);
    });

    it("should not allow mutations", () => {
      const originalValue = CONTENT_TYPE.MOVIE;
      expect(Reflect.set(CONTENT_TYPE, "MOVIE", "modified")).toBe(false);
      expect(Reflect.get(CONTENT_TYPE, "MOVIE")).toBe(originalValue);
    });

    it("should not allow adding new properties", () => {
      expect(Reflect.set(CONTENT_TYPE, "NEW_TYPE", "new-value")).toBe(false);
      expect(Reflect.get(CONTENT_TYPE, "NEW_TYPE")).toBeUndefined();
    });
  });

  describe("ENTITIES", () => {
    it("should have exactly 3 keys", () => {
      const keys = Object.keys(ENTITIES);
      expect(keys).toHaveLength(3);
    });

    it("should have the exact key set", () => {
      const keys = Object.keys(ENTITIES);
      expect(keys).toEqual(expect.arrayContaining(["MOVIE", "TV", "PERSON"]));
      expect(keys.sort()).toEqual(["MOVIE", "PERSON", "TV"].sort());
    });

    it("should have correct string values", () => {
      expect(ENTITIES.MOVIE).toBe("movie");
      expect(ENTITIES.TV).toBe("tv");
      expect(ENTITIES.PERSON).toBe("person");
    });

    it("should be frozen", () => {
      expect(Object.isFrozen(ENTITIES)).toBe(true);
    });

    it("should not allow mutations", () => {
      const originalValue = ENTITIES.MOVIE;
      expect(Reflect.set(ENTITIES, "MOVIE", "modified")).toBe(false);
      expect(Reflect.get(ENTITIES, "MOVIE")).toBe(originalValue);
    });

    it("should not allow adding new properties", () => {
      expect(Reflect.set(ENTITIES, "NEW_ENTITY", "new-value")).toBe(false);
      expect(Reflect.get(ENTITIES, "NEW_ENTITY")).toBeUndefined();
    });
  });
});
