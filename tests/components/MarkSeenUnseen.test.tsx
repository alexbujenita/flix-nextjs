import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MarkSeenUnseen from "../../src/components/MarkSeenUnseen/MarkSeenUnseen";
import { makeMovie } from "../fixtures/movie";
import { renderWithRouter } from "../helpers/render";
import { server } from "../msw/server";

const origin = "http://localhost:3001";
const MOVIE_ID = 42;
const ERROR_MESSAGE = "There was an error, try again later.";

type PatchCall = {
  readonly body: unknown;
  readonly credentials: RequestCredentials;
  readonly id: string;
};

function capturePatch(status = 200): readonly PatchCall[] {
  const calls: PatchCall[] = [];

  server.use(
    http.patch(`${origin}/api/favs/:id`, async ({ params, request }) => {
      calls.push({
        body: await request.json(),
        credentials: request.credentials,
        id: String(params.id),
      });

      return status === 200
        ? HttpResponse.json({ updated: true })
        : new HttpResponse(null, { status });
    }),
  );

  return calls;
}

function renderMark(props: {
  readonly isFav: unknown;
  readonly seen: unknown;
  readonly setSeen: (seen: boolean) => void;
}) {
  return renderWithRouter(
    <MarkSeenUnseen
      isFav={props.isFav}
      movie={makeMovie({ id: MOVIE_ID })}
      seen={props.seen}
      setSeen={props.setSeen}
    />,
  );
}

describe("MarkSeenUnseen", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  describe("favourite guard", () => {
    it("renders nothing when isFav is false and the movie is unseen", () => {
      // Given: the movie is not among the user's favourites.
      const setSeen = vi.fn();

      // When: the toggle is rendered.
      const { container } = renderMark({ isFav: false, seen: false, setSeen });

      // Then: the component renders null.
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole("heading")).toBeNull();
    });

    it("renders nothing when isFav is false and the movie is seen", () => {
      // Given: a non-favourite movie that the seen flag claims was watched.
      const setSeen = vi.fn();

      // When: the toggle is rendered.
      const { container } = renderMark({ isFav: false, seen: true, setSeen });

      // Then: the guard wins over the seen branch and nothing renders.
      expect(container.firstChild).toBeNull();
    });

    it("renders nothing when isFav is undefined", () => {
      // Given: the favourite flag has not resolved yet.
      const setSeen = vi.fn();

      // When: the toggle is rendered.
      const { container } = renderMark({
        isFav: undefined,
        seen: false,
        setSeen,
      });

      // Then: the component renders null.
      expect(container.firstChild).toBeNull();
    });
  });

  describe("label", () => {
    it("offers MARK AS SEEN while the movie is unseen", () => {
      // Given: a favourite the user has not watched.
      const setSeen = vi.fn();

      // When: the toggle is rendered.
      renderMark({ isFav: true, seen: false, setSeen });

      // Then: the forward action is offered.
      expect(
        screen.getByRole("heading", { name: "MARK AS SEEN" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "MARK AS UNSEEN" }),
      ).toBeNull();
    });

    it("offers MARK AS UNSEEN once the movie is seen", () => {
      // Given: a favourite the user has already watched.
      const setSeen = vi.fn();

      // When: the toggle is rendered.
      renderMark({ isFav: true, seen: true, setSeen });

      // Then: the reverse action is offered.
      expect(
        screen.getByRole("heading", { name: "MARK AS UNSEEN" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("heading", { name: "MARK AS SEEN" }),
      ).toBeNull();
    });
  });

  describe("toggling", () => {
    it('PATCHes the movie with the literal body { seen: "change!" }', async () => {
      // Given: an unseen favourite and a captured PATCH endpoint.
      const setSeen = vi.fn();
      const calls = capturePatch();
      renderMark({ isFav: true, seen: false, setSeen });

      // When: the toggle is clicked.
      await userEvent.click(
        screen.getByRole("heading", { name: "MARK AS SEEN" }),
      );

      // Then: the backend receives the sentinel string, not a boolean.
      await waitFor(() => expect(calls).toHaveLength(1));
      expect(calls[0].id).toBe(String(MOVIE_ID));
      expect(calls[0].body).toStrictEqual({ seen: "change!" });
      expect(calls[0].body).not.toStrictEqual({ seen: true });
      expect(calls[0].credentials).toBe("include");
    });

    it("sends the same literal body when marking a seen movie unseen", async () => {
      // Given: a seen favourite and a captured PATCH endpoint.
      const setSeen = vi.fn();
      const calls = capturePatch();
      renderMark({ isFav: true, seen: true, setSeen });

      // When: the toggle is clicked.
      await userEvent.click(
        screen.getByRole("heading", { name: "MARK AS UNSEEN" }),
      );

      // Then: the body is direction-independent — the server flips the flag.
      await waitFor(() => expect(calls).toHaveLength(1));
      expect(calls[0].body).toStrictEqual({ seen: "change!" });
      expect(calls[0].body).not.toStrictEqual({ seen: false });
    });

    it("sets seen to true after marking an unseen movie", async () => {
      // Given: an unseen favourite.
      const setSeen = vi.fn();
      capturePatch();
      renderMark({ isFav: true, seen: false, setSeen });

      // When: the toggle is clicked.
      await userEvent.click(
        screen.getByRole("heading", { name: "MARK AS SEEN" }),
      );

      // Then: local state flips to seen.
      await waitFor(() => expect(setSeen).toHaveBeenCalledWith(true));
      expect(setSeen).toHaveBeenCalledTimes(1);
    });

    it("sets seen to false after marking a seen movie unseen", async () => {
      // Given: a seen favourite.
      const setSeen = vi.fn();
      capturePatch();
      renderMark({ isFav: true, seen: true, setSeen });

      // When: the toggle is clicked.
      await userEvent.click(
        screen.getByRole("heading", { name: "MARK AS UNSEEN" }),
      );

      // Then: local state flips to unseen.
      await waitFor(() => expect(setSeen).toHaveBeenCalledWith(false));
      expect(setSeen).toHaveBeenCalledTimes(1);
    });
  });

  describe("failure path", () => {
    it("logs and alerts without changing state when the PATCH fails", async () => {
      // Given: the favourites API rejects the toggle.
      const setSeen = vi.fn();
      const calls = capturePatch(500);
      renderMark({ isFav: true, seen: false, setSeen });

      // When: the toggle is clicked.
      await userEvent.click(
        screen.getByRole("heading", { name: "MARK AS SEEN" }),
      );

      // Then: the error surfaces to the user and state is untouched.
      await waitFor(() => expect(window.alert).toHaveBeenCalledTimes(1));
      expect(window.alert).toHaveBeenCalledWith(ERROR_MESSAGE);
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(calls).toHaveLength(1);
      expect(setSeen).not.toHaveBeenCalled();
    });

    it("keeps the MARK AS SEEN label after a failed toggle", async () => {
      // Given: the favourites API rejects the toggle.
      const setSeen = vi.fn();
      capturePatch(500);
      renderMark({ isFav: true, seen: false, setSeen });

      // When: the toggle is clicked.
      await userEvent.click(
        screen.getByRole("heading", { name: "MARK AS SEEN" }),
      );

      // Then: the label never optimistically flipped.
      await waitFor(() => expect(window.alert).toHaveBeenCalledTimes(1));
      expect(
        screen.getByRole("heading", { name: "MARK AS SEEN" }),
      ).toBeInTheDocument();
    });
  });
});
