import { describe, expect, it } from "vitest";

import { buildQuery } from "../../src/lib/buildQuery";

// Helper to allow partial parameter objects in tests
// TypeScript infers all props as required from buildQuery.js JSDoc,
// so we use a type assertion to satisfy the checker while passing partial objects
type SearchParams = {
  page?: number;
  year?: string;
  primaryReleaseDateLTE?: string;
  primaryReleaseDateGTE?: string;
  adult?: boolean;
  certification?: string;
  certificationCountry?: string;
};

function call(params: SearchParams, isTv?: boolean): string {
  return buildQuery(params as Parameters<typeof buildQuery>[0], isTv);
}

describe("buildQuery", () => {
  describe("base path", () => {
    it("uses /movies when isTv is false (default)", () => {
      const query = call({ page: 1 });
      expect(query).toMatch(/^\/movies/);
    });

    it("uses /tv when isTv is true", () => {
      const query = call({ page: 1 }, true);
      expect(query).toMatch(/^\/tv/);
    });
  });

  describe("page parameter", () => {
    it("uses default page=1 when not provided", () => {
      const query = call({});
      expect(query).toContain("page=1");
    });

    it("uses provided page when valid (1-500)", () => {
      const query = call({ page: 5 });
      expect(query).toContain("page=5");
    });

    it("clamps page to 1 when page < 1", () => {
      const query = call({ page: 0 });
      expect(query).toContain("page=1");
    });

    it("clamps page to 1 when page is negative", () => {
      const query = call({ page: -10 });
      expect(query).toContain("page=1");
    });

    it("allows page=1 (lower boundary)", () => {
      const query = call({ page: 1 });
      expect(query).toContain("page=1");
    });

    it("allows page=500 (upper boundary)", () => {
      const query = call({ page: 500 });
      expect(query).toContain("page=500");
    });

    it("clamps page to 1 when page > 500", () => {
      const query = call({ page: 501 });
      expect(query).toContain("page=1");
    });

    it("clamps page to 1 when page is very large", () => {
      const query = call({ page: 9999 });
      expect(query).toContain("page=1");
    });
  });

  describe("primaryReleaseDateLTE", () => {
    it("appends primaryReleaseDateLTE when provided", () => {
      const query = call({ page: 1, primaryReleaseDateLTE: "2023-12-31" });
      expect(query).toContain("primaryReleaseDateLTE=2023-12-31");
    });

    it("does not append primaryReleaseDateLTE when not provided", () => {
      const query = call({ page: 1 });
      expect(query).not.toContain("primaryReleaseDateLTE");
    });

    it("does not append primaryReleaseDateLTE when empty string", () => {
      const query = call({ page: 1, primaryReleaseDateLTE: "" });
      expect(query).not.toContain("primaryReleaseDateLTE");
    });
  });

  describe("primaryReleaseDateGTE", () => {
    it("appends primaryReleaseDateGTE when provided", () => {
      const query = call({ page: 1, primaryReleaseDateGTE: "2020-01-01" });
      expect(query).toContain("primaryReleaseDateGTE=2020-01-01");
    });

    it("does not append primaryReleaseDateGTE when not provided", () => {
      const query = call({ page: 1 });
      expect(query).not.toContain("primaryReleaseDateGTE");
    });

    it("does not append primaryReleaseDateGTE when empty string", () => {
      const query = call({ page: 1, primaryReleaseDateGTE: "" });
      expect(query).not.toContain("primaryReleaseDateGTE");
    });
  });

  describe("year parameter (appended only when NOT both date bounds set)", () => {
    it("appends year when neither date bound is set", () => {
      const query = call({ page: 1, year: "2023" });
      expect(query).toContain("year=2023");
    });

    it("appends year when only primaryReleaseDateLTE is set", () => {
      const query = call({
        page: 1,
        year: "2023",
        primaryReleaseDateLTE: "2023-12-31",
      });
      expect(query).toContain("year=2023");
    });

    it("appends year when only primaryReleaseDateGTE is set", () => {
      const query = call({
        page: 1,
        year: "2023",
        primaryReleaseDateGTE: "2020-01-01",
      });
      expect(query).toContain("year=2023");
    });

    it("does NOT append year when both date bounds are set", () => {
      const query = call({
        page: 1,
        year: "2023",
        primaryReleaseDateLTE: "2023-12-31",
        primaryReleaseDateGTE: "2020-01-01",
      });
      expect(query).not.toContain("year=2023");
    });

    it("does not append year when year is not provided", () => {
      const query = call({ page: 1 });
      expect(query).not.toContain("year");
    });

    it("does not append year when year is empty string", () => {
      const query = call({ page: 1, year: "" });
      expect(query).not.toContain("year");
    });
  });

  describe("certification and certificationCountry (appended only together)", () => {
    it("appends both when both are provided", () => {
      const query = call({
        page: 1,
        certification: "PG",
        certificationCountry: "US",
      });
      expect(query).toContain("certificationCountry=US");
      expect(query).toContain("certification=PG");
    });

    it("does not append either when only certification is provided", () => {
      const query = call({
        page: 1,
        certification: "PG",
      });
      expect(query).not.toContain("certification");
      expect(query).not.toContain("certificationCountry");
    });

    it("does not append either when only certificationCountry is provided", () => {
      const query = call({
        page: 1,
        certificationCountry: "US",
      });
      expect(query).not.toContain("certification");
      expect(query).not.toContain("certificationCountry");
    });

    it("does not append either when neither is provided", () => {
      const query = call({ page: 1 });
      expect(query).not.toContain("certification");
      expect(query).not.toContain("certificationCountry");
    });

    it("does not append either when certification is empty", () => {
      const query = call({
        page: 1,
        certification: "",
        certificationCountry: "US",
      });
      expect(query).not.toContain("certification");
      expect(query).not.toContain("certificationCountry");
    });

    it("does not append either when certificationCountry is empty", () => {
      const query = call({
        page: 1,
        certification: "PG",
        certificationCountry: "",
      });
      expect(query).not.toContain("certification");
      expect(query).not.toContain("certificationCountry");
    });
  });

  describe("adult parameter", () => {
    it("appends adult when true", () => {
      const query = call({ page: 1, adult: true });
      expect(query).toContain("adult=true");
    });

    it("does not append adult when false", () => {
      const query = call({ page: 1, adult: false });
      expect(query).not.toContain("adult");
    });

    it("does not append adult when not provided", () => {
      const query = call({ page: 1 });
      expect(query).not.toContain("adult");
    });
  });

  describe("complete integration scenarios", () => {
    it("builds full query with all parameters", () => {
      const query = call(
        {
          page: 5,
          adult: true,
          primaryReleaseDateGTE: "2020-01-01",
          primaryReleaseDateLTE: "2023-12-31",
          certification: "PG-13",
          certificationCountry: "US",
        },
        true,
      );

      expect(query).toMatch(/^\/tv\?page=5/);
      expect(query).toContain("primaryReleaseDateGTE=2020-01-01");
      expect(query).toContain("primaryReleaseDateLTE=2023-12-31");
      expect(query).toContain("certification=PG-13");
      expect(query).toContain("certificationCountry=US");
      expect(query).toContain("adult=true");
      // year should NOT be in the query when both date bounds are set
      expect(query).not.toContain("year");
    });

    it("builds query with minimal parameters", () => {
      const query = call({});
      expect(query).toBe("/movies?page=1");
    });

    it("builds movies query with year", () => {
      const query = call({
        page: 1,
        year: "2022",
      });
      expect(query).toContain("/movies?page=1");
      expect(query).toContain("year=2022");
    });
  });
});
