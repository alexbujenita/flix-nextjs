import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import AdminUserInfo from "../../../src/pages/admin/users/[id]";
import { makeFavorite, type Favorite } from "../../fixtures/favs";
import { renderWithRouter } from "../../helpers/render";
import { server } from "../../msw/server";

const deleteUrl = "http://localhost:3001/admin/users/:userId/movie/:movieId";

function renderDetail(favs: readonly Favorite[], count = favs.length): void {
  renderWithRouter(
    <AdminUserInfo
      count={count}
      rows={[
        {
          UserFavourites: favs,
          firstName: "Fixture",
          id: 7,
          lastName: "Viewer",
        },
      ]}
    />,
  );
}

function rowFor(movieTitle: string): HTMLElement {
  const cell = screen.getByText(movieTitle).closest("tr");
  if (!(cell instanceof HTMLTableRowElement)) {
    throw new Error(`Expected a table row for ${movieTitle}`);
  }
  return cell;
}

describe("admin user detail render body", () => {
  it("renders the heading, one row per favourite, and a TMDB link per row", () => {
    renderDetail(
      [
        makeFavorite({ id: 701, movieRefId: 11, movieTitle: "First Fav" }),
        makeFavorite({ id: 702, movieRefId: 22, movieTitle: "Second Fav" }),
      ],
      2,
    );

    expect(
      screen.getByRole("heading", {
        name: "User ID: 7. Fixture Viewer has 2 favs.",
      }),
    ).toBeVisible();
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href")),
    ).toEqual(["/movie/11", "/movie/22"]);
    expect(within(rowFor("First Fav")).getByText("701")).toBeInTheDocument();
    expect(screen.getAllByText("DELETE")).toHaveLength(2);
  });

  it("paints only the repeat of a movieRefId as a duplicate", () => {
    renderDetail(
      [
        makeFavorite({ id: 701, movieRefId: 11, movieTitle: "Original" }),
        makeFavorite({ id: 702, movieRefId: 11, movieTitle: "Repeat" }),
        makeFavorite({ id: 703, movieRefId: 22, movieTitle: "Unique" }),
      ],
      3,
    );

    expect(rowFor("Original").style.backgroundColor).toBe("white");
    expect(rowFor("Repeat").style.backgroundColor).toBe("red");
    expect(rowFor("Unique").style.backgroundColor).toBe("white");
  });

  it("marks a third copy of the same movieRefId as a duplicate too", () => {
    const favs = [
      makeFavorite({ id: 701, movieRefId: 11, movieTitle: "Original" }),
      makeFavorite({ id: 702, movieRefId: 11, movieTitle: "Repeat" }),
      makeFavorite({ id: 703, movieRefId: 11, movieTitle: "Repeat Again" }),
    ];

    renderDetail(favs, 3);

    expect(rowFor("Repeat Again").style.backgroundColor).toBe("red");
    // The flag is written straight onto the caller's favourite objects.
    expect(favs.map(({ isDuplicate }) => isDuplicate)).toEqual([
      false,
      true,
      true,
    ]);
  });

  it("sends no delete request when the confirmation is dismissed", async () => {
    const user = userEvent.setup();
    const deleteRequest = vi.fn();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
    server.use(
      http.delete(deleteUrl, () => {
        deleteRequest();
        return HttpResponse.json({ deleted: true });
      }),
    );
    renderDetail([
      makeFavorite({ id: 701, movieRefId: 11, movieTitle: "Kept Fav" }),
    ]);

    await user.click(screen.getByText("DELETE"));

    expect(confirmSpy).toHaveBeenCalledWith("Delete a fav?");
    expect(deleteRequest).not.toHaveBeenCalled();
    expect(screen.getByText("Kept Fav")).toBeInTheDocument();
  });

  it("logs the failure and keeps the row when the delete request errors", async () => {
    const user = userEvent.setup();
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(window, "confirm").mockReturnValue(true);
    server.use(
      http.delete(deleteUrl, () =>
        HttpResponse.json({ error: "Unavailable" }, { status: 500 }),
      ),
    );
    renderDetail([
      makeFavorite({ id: 701, movieRefId: 11, movieTitle: "Doomed Fav" }),
    ]);

    await user.click(screen.getByText("DELETE"));

    await waitFor(() => expect(consoleLogSpy).toHaveBeenCalledTimes(1));
    const [loggedError] = consoleLogSpy.mock.calls[0];
    expect(loggedError).toBeInstanceOf(Error);
    expect(screen.getByText("Doomed Fav")).toBeInTheDocument();
  });

  it("renders an empty table body when the user has no favourites", () => {
    renderDetail([], 0);

    expect(
      screen.getByRole("heading", {
        name: "User ID: 7. Fixture Viewer has 0 favs.",
      }),
    ).toBeVisible();
    expect(screen.getAllByRole("row")).toHaveLength(1);
    expect(screen.queryByText("DELETE")).not.toBeInTheDocument();
  });
});
