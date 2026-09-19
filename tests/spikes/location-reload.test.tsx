import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import AdminUserInfo from "../../src/pages/admin/users/[id]";
import { makeFavorite } from "../fixtures/favs";
import { server } from "../msw/server";

const ADMIN_DELETE_URL =
  "http://localhost:3001/admin/users/:userId/movie/:movieId";

describe("window.location.reload stubbing", () => {
  it("records reload as unobservable when Vitest cannot install a spy", () => {
    // Given: jsdom provides its non-configurable Location implementation.
    const installReloadSpy = () => vi.spyOn(window.location, "reload");

    // When/Then: attempting the primary spy proves the accepted jsdom gap.
    expect(installReloadSpy).toThrow("Cannot redefine property: reload");
  });

  it("reaches the real admin delete request before the unobservable reload", async () => {
    // Given: the real admin detail page renders one favourite and confirms deletion.
    const user = userEvent.setup();
    const favorite = makeFavorite({ id: 701 });
    const deleteRequest = vi.fn();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(
      http.delete(ADMIN_DELETE_URL, ({ params, request }) => {
        deleteRequest({
          credentials: request.credentials,
          movieId: params.movieId,
          userId: params.userId,
        });
        return HttpResponse.json({ deleted: true });
      }),
    );
    render(
      <AdminUserInfo
        count={1}
        rows={[
          {
            UserFavourites: [favorite],
            firstName: "Fixture",
            id: 7,
            lastName: "Viewer",
          },
        ]}
      />,
    );

    // When: the page's per-user DELETE control is clicked.
    await user.click(screen.getByText("DELETE"));

    // Then: execution reaches and completes the credentialed axios.delete call.
    await waitFor(() => {
      expect(deleteRequest).toHaveBeenCalledWith({
        credentials: "include",
        movieId: "701",
        userId: "7",
      });
    });
  });
});
