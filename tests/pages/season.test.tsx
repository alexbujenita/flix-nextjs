import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import * as seasonRoute from "../../src/pages/tv/series/[seriesId]/season/[seasonNumber]/index";
import { renderWithRouter } from "../helpers/render";

/**
 * `/tv/series/[seriesId]/season/[seasonNumber]` is a placeholder: two route
 * params, no data fetching, and a hard-coded heading. See docs/TEST-BUGS.md
 * entry 9. These tests lock that behavior rather than fixing it, so they will
 * fail the moment the route starts doing real work — which is the signal.
 */

const TVSeason = seasonRoute.default;

const SEASON_URL = "/tv/series/1399/season/2";

describe("TV season route", () => {
  it("renders the hard-coded placeholder heading", () => {
    // Given / When: the route renders.
    renderWithRouter(<TVSeason />);

    // Then: the literal string is the whole page.
    expect(
      screen.getByRole("heading", { level: 1, name: "TV Season!" }),
    ).toBeInTheDocument();
  });

  it("renders nothing but that heading", () => {
    // Given / When: the route renders.
    const { container } = renderWithRouter(<TVSeason />);

    // Then: there is no series name, no episode list, and no links.
    expect(container.textContent).toBe("TV Season!");
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });

  it("ignores both route params (docs/TEST-BUGS.md #9)", () => {
    // Given / When: the route renders under a fully populated URL.
    renderWithRouter(<TVSeason />, { url: SEASON_URL });

    // Then: neither the series id nor the season number reaches the output.
    expect(
      screen.getByRole("heading", { level: 1, name: "TV Season!" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("1399")).not.toBeInTheDocument();
    expect(screen.queryByText("2")).not.toBeInTheDocument();
  });

  it("exports no data-fetching hook, so Next.js treats it as static", () => {
    // Given / When: the route module is inspected.
    // Then: none of the Next.js data hooks are exported.
    expect(seasonRoute).not.toHaveProperty("getServerSideProps");
    expect(seasonRoute).not.toHaveProperty("getStaticProps");
    expect(seasonRoute).not.toHaveProperty("getStaticPaths");
  });
});
