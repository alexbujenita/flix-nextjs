import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import Trailers from "../../src/components/Trailers/Trailers";
import { makeMovie, type MovieVideo } from "../fixtures/movie";
import { renderWithRouter } from "../helpers/render";

function makeTrailers(keys: readonly string[]): readonly MovieVideo[] {
  const [firstVideo] = makeMovie().videos.results;

  return keys.map((key, index) => ({
    ...firstVideo,
    id: `video-${index + 1}`,
    key,
  }));
}

describe("<Trailers />", () => {
  it("hides the trailer list until SHOW TRAILERS is clicked", () => {
    // Given: two trailers are available.
    renderWithRouter(<Trailers trailers={makeTrailers(["one", "two"])} />);

    // Then: only the opening control is visible and nothing is embedded.
    expect(
      screen.getByRole("heading", { name: "SHOW TRAILERS" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "HIDE TRAILERS" }),
    ).not.toBeInTheDocument();
    expect(screen.queryAllByTitle("video")).toHaveLength(0);
  });

  it("toggles SHOW TRAILERS to HIDE TRAILERS and back again", async () => {
    // Given: a rendered, collapsed trailer list.
    const user = userEvent.setup();
    renderWithRouter(<Trailers trailers={makeTrailers(["one", "two"])} />);

    // When: the list is opened.
    await user.click(screen.getByRole("heading", { name: "SHOW TRAILERS" }));

    // Then: the control flips to HIDE TRAILERS and the embeds appear.
    expect(
      screen.getByRole("heading", { name: "HIDE TRAILERS" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "SHOW TRAILERS" }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByTitle("video")).toHaveLength(2);

    // When: the list is closed again.
    await user.click(screen.getByRole("heading", { name: "HIDE TRAILERS" }));

    // Then: the control flips back and the embeds are unmounted.
    expect(
      screen.getByRole("heading", { name: "SHOW TRAILERS" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "HIDE TRAILERS" }),
    ).not.toBeInTheDocument();
    expect(screen.queryAllByTitle("video")).toHaveLength(0);
  });

  it("renders one trailer embed per entry once opened", async () => {
    // Given: three trailers with distinct YouTube keys.
    const user = userEvent.setup();
    const keys = ["key-one", "key-two", "key-three"];
    renderWithRouter(<Trailers trailers={makeTrailers(keys)} />);

    // When: the list is opened.
    await user.click(screen.getByRole("heading", { name: "SHOW TRAILERS" }));

    // Then: each entry produces its own embed, in order.
    const embeds = screen.getAllByTitle("video");
    expect(embeds).toHaveLength(keys.length);
    expect(embeds.map((embed) => embed.getAttribute("src"))).toEqual(
      keys.map((key) => `https://www.youtube.com/embed/${key}`),
    );
  });

  it("renders no embeds when the trailer array is empty", async () => {
    // Given: a movie with no trailers.
    const user = userEvent.setup();
    renderWithRouter(<Trailers trailers={makeTrailers([])} />);

    // When: the list is opened.
    await user.click(screen.getByRole("heading", { name: "SHOW TRAILERS" }));

    // Then: the control still toggles but no iframe is rendered.
    expect(
      screen.getByRole("heading", { name: "HIDE TRAILERS" }),
    ).toBeInTheDocument();
    expect(screen.queryAllByTitle("video")).toHaveLength(0);
  });
});
