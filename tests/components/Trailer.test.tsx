import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Trailer from "../../src/components/Trailers/Trailer/Trailer";
import { makeMovie, type MovieVideo } from "../fixtures/movie";
import { renderWithRouter } from "../helpers/render";

function makeTrailer(overrides: Partial<MovieVideo> = {}): MovieVideo {
  const [firstVideo] = makeMovie().videos.results;

  return { ...firstVideo, ...overrides };
}

describe("<Trailer />", () => {
  it("renders an iframe titled video for the fixture trailer", () => {
    // Given: a fully populated trailer fixture.
    const trailer = makeTrailer();

    // When: the trailer is rendered.
    renderWithRouter(<Trailer trailer={trailer} />);

    // Then: the embed is exposed as an iframe queryable by its title.
    const embed = screen.getByTitle("video");
    expect(embed.tagName).toBe("IFRAME");
    expect(embed).toHaveAttribute(
      "src",
      `https://www.youtube.com/embed/${trailer.key}`,
    );
  });

  it("builds the embed src from the trailer key prop", () => {
    // Given: a trailer whose key differs from the fixture default.
    const trailer = makeTrailer({ key: "dQw4w9WgXcQ" });

    // When: the trailer is rendered.
    renderWithRouter(<Trailer trailer={trailer} />);

    // Then: the src is the YouTube embed URL for that exact key.
    expect(screen.getByTitle("video")).toHaveAttribute(
      "src",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    );
  });

  it("renders exactly one embed per trailer", () => {
    // Given: a single trailer.
    const trailer = makeTrailer();

    // When: the trailer is rendered.
    renderWithRouter(<Trailer trailer={trailer} />);

    // Then: only one embed exists.
    expect(screen.getAllByTitle("video")).toHaveLength(1);
  });
});
