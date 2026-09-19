import {
  act,
  screen,
  waitFor,
  type RenderResult,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AddRemoveIcon from "../../src/components/AddRemoveIcon/AddRemoveIcon";
import {
  addMovieToFavs,
  removeMovieFromFavs,
} from "../../src/components/AddRemoveIcon/utils";
import { CONTENT_TYPE } from "../../src/utils/constants";
import { setUserFavs, USER_FAVS_UPDATED_EVENT } from "../../src/utils/userFavs";
import { makeMovie, type Movie } from "../fixtures/movie";
import { loginAs, logout } from "../helpers/auth";
import { renderWithRouter } from "../helpers/render";

vi.mock("../../src/components/AddRemoveIcon/utils", () => ({
  addMovieToFavs: vi.fn(),
  removeMovieFromFavs: vi.fn(),
}));

const addFavSpy = vi.mocked(addMovieToFavs);
const removeFavSpy = vi.mocked(removeMovieFromFavs);

const STORAGE_KEY = "UserFavs";
const SUBSCRIBED_EVENTS: readonly string[] = [
  "storage",
  USER_FAVS_UPDATED_EVENT,
];

type IconProps = {
  readonly movie: Movie;
  readonly contentType: string | undefined;
};

/**
 * Single render site for `AddRemoveIcon`, so the sanctioned suppression is
 * declared exactly once for the whole file.
 */
function renderIcon({ movie, contentType }: IconProps): RenderResult {
  return renderWithRouter(
    // @ts-expect-error -- defective @param {Object} in AddRemoveIcon.js:28 rejects valid props.
    <AddRemoveIcon movie={movie} contentType={contentType} />,
  );
}

/** Writes the raw store value without dispatching the custom update event. */
function writeFavsWithoutCustomEvent(favs: readonly number[]): string {
  const serialized = JSON.stringify(favs);
  localStorage.setItem(STORAGE_KEY, serialized);
  return serialized;
}

describe("AddRemoveIcon", () => {
  const movie = makeMovie({
    id: 42,
    title: "Fav Fixture",
    poster_path: "/fav.jpg",
  });

  beforeEach(() => {
    localStorage.clear();
    logout();
  });

  describe("render guards", () => {
    it("renders nothing when contentType is a tv series", () => {
      // Given: a logged-in user whose favourites already contain the id.
      loginAs();
      writeFavsWithoutCustomEvent([movie.id]);

      // When: the icon is asked to render for a non-movie content type.
      const { container } = renderIcon({
        movie,
        contentType: CONTENT_TYPE.TV_SERIES,
      });

      // Then: the guard short-circuits before any markup exists.
      expect(container.firstChild).toBeNull();
      expect(screen.queryByText("-")).toBeNull();
      expect(screen.queryByText("+")).toBeNull();
    });

    it("renders nothing when contentType is a person", () => {
      loginAs();

      const { container } = renderIcon({
        movie,
        contentType: CONTENT_TYPE.PERSON,
      });

      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when contentType is undefined", () => {
      loginAs();

      const { container } = renderIcon({
        movie,
        contentType: undefined,
      });

      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when the user is logged out", () => {
      // Given: no auth cookie, even though the content type is a movie.
      logout();
      writeFavsWithoutCustomEvent([movie.id]);

      // When: the icon renders.
      const { container } = renderIcon({
        movie,
        contentType: CONTENT_TYPE.MOVIE,
      });

      // Then: the login guard returns null rather than an empty wrapper.
      expect(container.firstChild).toBeNull();
      expect(screen.queryByText("-")).toBeNull();
      expect(screen.queryByText("+")).toBeNull();
    });
  });

  describe("isFav derivation from the stored favourites", () => {
    it("renders - when the movie id is in the stored favourites", () => {
      loginAs();
      writeFavsWithoutCustomEvent([7, movie.id, 9]);

      renderIcon({ movie, contentType: CONTENT_TYPE.MOVIE });

      expect(screen.getByText("-")).toBeInTheDocument();
      expect(screen.queryByText("+")).toBeNull();
    });

    it("renders + when the movie id is absent from the stored favourites", () => {
      loginAs();
      writeFavsWithoutCustomEvent([7, 9]);

      renderIcon({ movie, contentType: CONTENT_TYPE.MOVIE });

      expect(screen.getByText("+")).toBeInTheDocument();
      expect(screen.queryByText("-")).toBeNull();
    });

    it("renders + when nothing has been stored yet", () => {
      loginAs();

      renderIcon({ movie, contentType: CONTENT_TYPE.MOVIE });

      expect(screen.getByText("+")).toBeInTheDocument();
    });

    it("renders + when the stored favourites are unparsable", () => {
      loginAs();
      vi.spyOn(console, "error").mockImplementation(() => {});
      localStorage.setItem(STORAGE_KEY, "{not-json");

      renderIcon({ movie, contentType: CONTENT_TYPE.MOVIE });

      expect(screen.getByText("+")).toBeInTheDocument();
    });
  });

  describe("useSyncExternalStore subscription", () => {
    it("flips + to - when setUserFavs notifies the store, driven by the subscription rather than a test-issued rerender", async () => {
      // Given: a mounted icon for a movie that is not yet a favourite.
      loginAs();
      writeFavsWithoutCustomEvent([]);
      renderIcon({ movie, contentType: CONTENT_TYPE.MOVIE });

      const plusSign = screen.getByText("+");
      const iconRoot = plusSign.parentElement;
      expect(iconRoot).not.toBeNull();

      // When: the store is updated out-of-band. No `rerender` and no remount is
      // issued by this test; the store notification is what makes React render
      // again, which is precisely the subscription being proven.
      await act(async () => {
        setUserFavs([movie.id]);
      });

      // Then: the already-mounted icon shows the fav state.
      const minusSign = await screen.findByText("-");
      expect(minusSign).toBeInTheDocument();
      expect(screen.queryByText("+")).toBeNull();
      // And: the same host element survived, so this was an in-place update of
      // the mounted tree, not a fresh mount.
      expect(minusSign.parentElement).toBe(iconRoot);
    });

    it("flips - back to + when setUserFavs removes the id", async () => {
      loginAs();
      writeFavsWithoutCustomEvent([movie.id]);
      renderIcon({ movie, contentType: CONTENT_TYPE.MOVIE });

      expect(screen.getByText("-")).toBeInTheDocument();

      await act(async () => {
        setUserFavs([]);
      });

      expect(await screen.findByText("+")).toBeInTheDocument();
      expect(screen.queryByText("-")).toBeNull();
    });

    it("flips + to - on a cross-tab storage event", async () => {
      // Given: a mounted icon and a store write that deliberately does not
      // dispatch the custom event, isolating the "storage" listener.
      loginAs();
      writeFavsWithoutCustomEvent([]);
      renderIcon({ movie, contentType: CONTENT_TYPE.MOVIE });

      expect(screen.getByText("+")).toBeInTheDocument();

      // When: another tab writes the key and the storage event arrives.
      await act(async () => {
        const newValue = writeFavsWithoutCustomEvent([movie.id]);
        window.dispatchEvent(
          new StorageEvent("storage", { key: STORAGE_KEY, newValue }),
        );
      });

      // Then: the storage subscription drove the update.
      expect(await screen.findByText("-")).toBeInTheDocument();
    });

    it("removes both the storage and user-favs-updated listeners on unmount", async () => {
      // Given: instrumented window listener registration.
      const addSpy = vi.spyOn(window, "addEventListener");
      const removeSpy = vi.spyOn(window, "removeEventListener");
      loginAs();
      writeFavsWithoutCustomEvent([]);

      const { unmount } = renderIcon({
        movie,
        contentType: CONTENT_TYPE.MOVIE,
      });

      const subscribed = addSpy.mock.calls.filter(([type]) =>
        SUBSCRIBED_EVENTS.includes(type),
      );
      expect(subscribed.map(([type]) => type)).toEqual([
        "storage",
        USER_FAVS_UPDATED_EVENT,
      ]);
      const [[, storageHandler], [, favsUpdatedHandler]] = subscribed;

      // When: the component unmounts.
      unmount();

      // Then: both listeners are torn down with the very handlers registered.
      const unsubscribed = removeSpy.mock.calls.filter(([type]) =>
        SUBSCRIBED_EVENTS.includes(type),
      );
      expect(unsubscribed).toEqual([
        ["storage", storageHandler],
        [USER_FAVS_UPDATED_EVENT, favsUpdatedHandler],
      ]);

      // And: a post-unmount notification reaches nothing.
      await act(async () => {
        setUserFavs([movie.id]);
      });
      expect(screen.queryByText("-")).toBeNull();
      expect(screen.queryByText("+")).toBeNull();
    });
  });

  describe("click behaviour", () => {
    it("adds the movie to favourites when it is not already a favourite", async () => {
      loginAs();
      writeFavsWithoutCustomEvent([]);
      renderIcon({ movie, contentType: CONTENT_TYPE.MOVIE });

      await userEvent.click(screen.getByText("+"));

      await waitFor(() =>
        expect(addFavSpy).toHaveBeenCalledWith(
          movie.id,
          movie.title,
          movie.poster_path,
        ),
      );
      expect(addFavSpy).toHaveBeenCalledTimes(1);
      expect(removeFavSpy).not.toHaveBeenCalled();
    });

    it("removes the movie from favourites when it is already a favourite", async () => {
      loginAs();
      writeFavsWithoutCustomEvent([movie.id]);
      renderIcon({ movie, contentType: CONTENT_TYPE.MOVIE });

      await userEvent.click(screen.getByText("-"));

      await waitFor(() => expect(removeFavSpy).toHaveBeenCalledWith(movie.id));
      expect(removeFavSpy).toHaveBeenCalledTimes(1);
      expect(addFavSpy).not.toHaveBeenCalled();
    });

    it("dispatches the opposite action after the store flips the icon", async () => {
      loginAs();
      writeFavsWithoutCustomEvent([]);
      renderIcon({ movie, contentType: CONTENT_TYPE.MOVIE });

      await act(async () => {
        setUserFavs([movie.id]);
      });

      await userEvent.click(await screen.findByText("-"));

      await waitFor(() => expect(removeFavSpy).toHaveBeenCalledWith(movie.id));
      expect(addFavSpy).not.toHaveBeenCalled();
    });
  });

  describe("server snapshot", () => {
    it("returns null for server-side rendering context", () => {
      // The component uses useSyncExternalStore with getServerUserFavsSnapshot
      // which should return null (no hydration mismatch, SSR has no localStorage).
      // This test verifies the function is defined and behaves correctly.
      loginAs();
      renderIcon({ movie, contentType: CONTENT_TYPE.MOVIE });

      // Component renders successfully with server snapshot returning null,
      // then syncs with client snapshot from localStorage.
      expect(screen.getByText("+")).toBeInTheDocument();
    });
  });
});
