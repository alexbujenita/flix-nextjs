import { screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import Movie from "../../src/pages/movie/[movieId]";
import { makeFavorite } from "../fixtures/favs";
import { makeMovie } from "../fixtures/movie";
import { loginAs } from "../helpers/auth";
import { renderWithRouter } from "../helpers/render";
import { server } from "../msw/server";

describe("credentialed cross-origin requests through MSW", () => {
  it("proves a credentialed cross-origin GET succeeds with Movie component", async () => {
    // Given: a logged-in user viewing the Movie detail page.
    // The Movie component's useEffect makes a credentialed GET to
    // http://localhost:3001/api/favs/user-favs/:id on mount (if isLogged()).
    loginAs();
    const movie = makeMovie({
      credits: { cast: [], crew: [] },
      imdb_id: "",
      poster_path: "",
      videos: { results: [] },
    });
    const favorite = makeFavorite({ rating: 7, seen: true });
    const credentials: RequestCredentials[] = [];

    server.use(
      http.get(
        "http://localhost:3001/api/favs/user-favs/:id",
        ({ request }) => {
          // Capture the request.credentials to prove withCredentials:true was honored.
          credentials.push(request.credentials);
          return HttpResponse.json(favorite);
        },
      ),
    );

    // When: the Movie component is rendered with a fully-populated fixture.
    const { container } = renderWithRouter(<Movie movie={movie} />);

    // Then: (a) the request.credentials was "include" (proving withCredentials:true),
    // and (b) the successful payload hydrated the UI state.
    // The favourite response sets seen=true and rating=7, which makes:
    // - MarkSeenUnseen render "MARK AS UNSEEN" (because seen=true)
    // - Rating render 7 filled stars (isFav=true from the response, rating=7)
    await waitFor(() => {
      expect(credentials).toHaveLength(1);
      expect(credentials[0]).toBe("include");
    });
    expect(
      screen.getByRole("heading", { name: "MARK AS UNSEEN" }),
    ).toBeVisible();
    await waitFor(() => {
      expect(container.querySelectorAll('svg[color="red"]')).toHaveLength(7);
    });
  });
});
