import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import { HttpResponse, http } from "msw";
import mockRouter from "next-router-mock";
import { describe, expect, it, onTestFinished, vi } from "vitest";

import UserFavs, { getServerSideProps } from "../../../src/pages/user-favs";
import { makeFavorite } from "../../fixtures/favs";
import { createGsspContext } from "../../helpers/gssp";
import { server } from "../../msw/server";

const favoritesUrl = "http://localhost:3001/api/favs/user-favs";
const pdfUrl = "http://localhost:3001/api/favs/pdf";
const authCookie = "JWT_TOKEN_MY_FLIX=render-test-token";
const waitingMessage = "Please wait for the file to download.";

type FavoritesResponse = {
  readonly page: number;
  readonly rows: readonly {
    readonly UserFavourites: readonly ReturnType<typeof makeFavorite>[];
  }[];
  readonly totalPages: number;
};

function useFavoritesResponse(response: FavoritesResponse): void {
  server.use(http.get(favoritesUrl, () => HttpResponse.json(response)));
}

async function renderFromServerProps({
  query = {},
  url = "/user-favs",
}: {
  readonly query?: Record<string, string>;
  readonly url?: string;
} = {}): Promise<void> {
  mockRouter.setCurrentUrl(url);
  const result = await getServerSideProps(
    createGsspContext({ cookie: authCookie, query }),
  );

  if (!("props" in result)) {
    throw new Error("Expected getServerSideProps to return page props");
  }
  render(<UserFavs {...result.props} />);
}

function populatedFavorites(
  overrides: Partial<FavoritesResponse> = {},
): FavoritesResponse {
  return {
    page: 2,
    rows: [
      {
        UserFavourites: [
          makeFavorite({ movieRefId: 812, movieTitle: "Rendered Favourite" }),
        ],
      },
    ],
    totalPages: 4,
    ...overrides,
  };
}

describe("user favourites page rendered from getServerSideProps", () => {
  it("renders the empty state when the returned rows are empty", async () => {
    useFavoritesResponse({ page: 1, rows: [], totalPages: 0 });

    await renderFromServerProps();

    expect(
      screen.getByRole("heading", { name: "Nothing here..." }),
    ).toBeInTheDocument();
  });

  it("preserves filters in the seen and pagination link hrefs", async () => {
    useFavoritesResponse(populatedFavorites());

    await renderFromServerProps({
      query: { page: "2", searchQuery: "alien", seen: "true" },
      url: "/user-favs?page=2&seen=true&searchQuery=alien",
    });

    expect(screen.getByRole("link", { name: "SEEN" })).toHaveAttribute(
      "href",
      "/user-favs?page=1",
    );
    expect(screen.getByRole("link", { name: "NOT SEEN" })).toHaveAttribute(
      "href",
      "/user-favs?page=1&seen=false",
    );
    expect(screen.getByRole("link", { name: "PREV" })).toHaveAttribute(
      "href",
      "/user-favs?page=1&seen=true&searchQuery=alien",
    );
    expect(screen.getByRole("link", { name: "NEXT" })).toHaveAttribute(
      "href",
      "/user-favs?page=3&seen=true&searchQuery=alien",
    );
  });

  it("submits a favourites search on Enter", async () => {
    const user = userEvent.setup();
    const pushSpy = vi.spyOn(mockRouter, "push");
    useFavoritesResponse(populatedFavorites());
    await renderFromServerProps();
    const searchInput = screen.getByPlaceholderText("Search your favs");

    await user.type(searchInput, "Alien{Enter}");

    expect(pushSpy).toHaveBeenCalledWith("/user-favs?page=1&searchQuery=Alien");
    expect(searchInput).toHaveValue("");
  });

  it("downloads the PDF and shows the deferred in-progress state", async () => {
    const user = userEvent.setup();
    let releaseResponse = () => {};
    const responseGate = new Promise<void>((resolve) => {
      releaseResponse = resolve;
    });
    server.use(
      http.get(pdfUrl, async () => {
        await responseGate;
        return new HttpResponse("fixture pdf", {
          headers: { "Content-Type": "application/pdf" },
        });
      }),
    );
    useFavoritesResponse(populatedFavorites());
    await renderFromServerProps();
    const axiosGetSpy = vi.spyOn(axios, "get");
    const appendChildSpy = vi.spyOn(document.body, "appendChild");
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    await user.click(
      screen.getByRole("heading", {
        name: "Download your favourites as PDF",
      }),
    );

    expect(screen.getByText(waitingMessage)).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(axiosGetSpy).toHaveBeenCalledWith(`${pdfUrl}?includeCast=false`, {
      responseType: "blob",
      withCredentials: true,
    });

    releaseResponse();

    await waitFor(() => expect(URL.createObjectURL).toHaveBeenCalledTimes(1));
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    const appendedNode = appendChildSpy.mock.calls.find(
      ([node]) => node instanceof HTMLAnchorElement,
    )?.[0];
    expect(appendedNode).toBeInstanceOf(HTMLAnchorElement);
    if (!(appendedNode instanceof HTMLAnchorElement)) {
      throw new Error("Expected a temporary download anchor");
    }
    expect(appendedNode).toHaveAttribute("download", "favs.pdf");
    expect(appendedNode).toHaveAttribute("href", "blob:mock");
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
    await waitFor(() =>
      expect(screen.queryByText(waitingMessage)).not.toBeInTheDocument(),
    );
  });

  it("requests a cast-inclusive PDF when the checkbox is selected", async () => {
    const user = userEvent.setup();
    const requestedUrls: string[] = [];
    server.use(
      http.get(pdfUrl, ({ request }) => {
        requestedUrls.push(request.url);
        return new HttpResponse("fixture pdf");
      }),
    );
    useFavoritesResponse(populatedFavorites());
    await renderFromServerProps();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});

    await user.click(screen.getByRole("checkbox"));
    await user.click(
      screen.getByRole("heading", {
        name: "Download your favourites as PDF",
      }),
    );

    await waitFor(() =>
      expect(requestedUrls).toContain(`${pdfUrl}?includeCast=true`),
    );
  });

  it("stays in progress and surfaces an unhandled rejection when PDF download fails", async () => {
    const user = userEvent.setup();
    const rejectionHandler = vi.fn<(reason: unknown) => void>();
    process.on("unhandledRejection", rejectionHandler);
    onTestFinished(() => {
      process.off("unhandledRejection", rejectionHandler);
    });
    server.use(
      http.get(pdfUrl, () =>
        HttpResponse.json({ error: "PDF unavailable" }, { status: 500 }),
      ),
    );
    useFavoritesResponse(populatedFavorites());
    await renderFromServerProps();

    await user.click(
      screen.getByRole("heading", {
        name: "Download your favourites as PDF",
      }),
    );

    await expect
      .poll(() => rejectionHandler.mock.calls.length, { timeout: 2_000 })
      .toBe(1);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByText(waitingMessage)).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", {
        name: "Download your favourites as PDF",
      }),
    ).not.toBeInTheDocument();
    const reason = rejectionHandler.mock.calls.at(0)?.[0];
    expect(axios.isAxiosError(reason)).toBe(true);
    if (!axios.isAxiosError(reason)) {
      throw new Error("Expected the PDF request to reject with an Axios error");
    }
    expect(reason.response?.status).toBe(500);
    expect(reason.config?.url).toBe(`${pdfUrl}?includeCast=false`);
  });
});
