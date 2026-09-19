import { screen } from "@testing-library/react";
import { expect, it } from "vitest";

import Series from "../../src/pages/tv/series/[seriesId]";
import { makeTvShow } from "../fixtures/tv";
import { renderWithRouter } from "../helpers/render";

it("renders the seasons empty state when the series has no seasons", () => {
  renderWithRouter(<Series tvSeries={makeTvShow({ seasons: [] })} />);

  expect(
    screen.getByRole("heading", { name: "Seasons not found" }),
  ).toBeInTheDocument();
});
