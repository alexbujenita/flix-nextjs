import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import mockRouter from "next-router-mock";
import { describe, expect, it } from "vitest";

import SearchBar from "../../src/components/SearchBar/SearchBar";

describe("next-router-mock integration", () => {
  it("updates pathname and query when the real SearchBar submits", async () => {
    // Given: the real app search component consumes the mocked pages router.
    const user = userEvent.setup();
    render(<SearchBar />);

    // When: a viewer opens SearchBar and submits a search with Enter.
    await user.click(screen.getByRole("heading", { level: 3 }));
    await user.type(screen.getByRole("textbox"), "alien{Enter}");

    // Then: next-router-mock exposes SearchBar's parsed navigation state.
    expect(mockRouter.pathname).toBe("/search");
    expect(mockRouter.query).toEqual({
      searchTerm: "alien",
      includeAdult: "false",
      entity: "movie",
      page: "1",
    });
  });
});
