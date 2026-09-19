import { render, screen, waitFor } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { HttpResponse, http, type PathParams } from "msw";
import mockRouter, { type Url } from "next-router-mock";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Login from "../../src/pages/login";
import { makeFavorite, type Favorite } from "../fixtures/favs";
import { server } from "../msw/server";

const origin = "http://localhost:3001";
const LOGIN_URL = `${origin}/api/auth/login`;
const FAVS_URL = `${origin}/api/favs/user-favs`;

const EMAIL = "viewer@example.com";
const PASSWORD = "correct horse battery staple";

type LoginBody = {
  readonly email: string;
  readonly password: string;
};

type UserFavsPayload = {
  readonly rows?: readonly { readonly UserFavourites?: readonly Favorite[] }[];
};

type LoginRequestRecord = {
  readonly body: LoginBody;
  readonly credentials: RequestCredentials;
};

type PushCall = {
  readonly url: Url;
  /** `previousMovie` as it stood at the instant `router.push` was invoked. */
  readonly previousMovieAtPushTime: string | null;
};

/**
 * Login.js reads `useRouter()` from the globally mocked `next/router`, which
 * returns the next-router-mock singleton whenever no `MemoryRouterContext` is
 * present. `renderWithRouter` always passes a `url`, and `MemoryRouterProvider`
 * builds an *isolated* `MemoryRouter` in that case — its navigations are
 * invisible to the `mockRouter` singleton. This page renders no `<Link>`, so a
 * plain `render` keeps the singleton in play and makes `router.push` assertable,
 * matching `tests/spikes/next-router-mock.test.tsx`.
 */
function renderLogin(): void {
  render(<Login />);
}

/** Stubs POST /api/auth/login with a 200 and records what the page sent. */
function stubLoginSuccess(firstName = "Ada"): LoginRequestRecord[] {
  const requests: LoginRequestRecord[] = [];

  server.use(
    http.post<PathParams, LoginBody>(LOGIN_URL, async ({ request }) => {
      requests.push({
        body: await request.json(),
        credentials: request.credentials,
      });
      return HttpResponse.json({ firstName });
    }),
  );

  return requests;
}

/** Stubs GET /api/favs/user-favs with `payload` and counts the calls. */
function stubUserFavs(payload: UserFavsPayload): RequestCredentials[] {
  const credentials: RequestCredentials[] = [];

  server.use(
    http.get(FAVS_URL, ({ request }) => {
      credentials.push(request.credentials);
      return HttpResponse.json(payload);
    }),
  );

  return credentials;
}

/** Fails an endpoint with a 500 and counts how often it was reached. */
function stubFailure(
  method: "get" | "post",
  url: string,
): RequestCredentials[] {
  const credentials: RequestCredentials[] = [];

  server.use(
    http[method](url, ({ request }) => {
      credentials.push(request.credentials);
      return HttpResponse.json({ message: "boom" }, { status: 500 });
    }),
  );

  return credentials;
}

/**
 * Wraps the singleton's `push` so each call records the `previousMovie` value
 * that was still in localStorage at call time. That is what proves Login.js
 * navigates *before* it removes the key.
 */
function trackPush(): PushCall[] {
  const calls: PushCall[] = [];
  const originalPush = mockRouter.push;

  vi.spyOn(mockRouter, "push").mockImplementation((url, as, options) => {
    calls.push({
      url,
      previousMovieAtPushTime: localStorage.getItem("previousMovie"),
    });
    return originalPush(url, as, options);
  });

  return calls;
}

/** Silences the `console.log(e)` and `alert` side effects of the catch block. */
function silenceFailureOutput() {
  vi.spyOn(console, "log").mockImplementation(() => {});
  return vi.spyOn(window, "alert").mockImplementation(() => {});
}

async function submitCredentials(
  user: UserEvent,
  email = EMAIL,
  password = PASSWORD,
): Promise<void> {
  await user.type(screen.getByPlaceholderText("Enter Email"), email);
  await user.type(screen.getByPlaceholderText("Enter Password"), password);
  await user.click(screen.getByRole("button", { name: "Login" }));
}

describe("Login page", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("the login request", () => {
    it("POSTs the typed credentials as { email, password }", async () => {
      // Given: a login endpoint that records the request body.
      const user = userEvent.setup();
      const loginRequests = stubLoginSuccess();
      stubUserFavs({ rows: [] });
      renderLogin();

      // When: the viewer types both fields and submits the form.
      await submitCredentials(user);

      // Then: exactly the two controlled values are sent, nothing else.
      await waitFor(() => {
        expect(loginRequests).toHaveLength(1);
      });
      expect(loginRequests[0].body).toEqual({
        email: EMAIL,
        password: PASSWORD,
      });
    });

    it("sends both requests with credentials included", async () => {
      // Given: recorders on the login and favourites endpoints.
      const user = userEvent.setup();
      const loginRequests = stubLoginSuccess();
      const favsCredentials = stubUserFavs({ rows: [] });
      renderLogin();

      // When: the login flow runs end to end.
      await submitCredentials(user);

      // Then: `withCredentials: true` reaches the wire as credentials=include.
      await waitFor(() => {
        expect(favsCredentials).toEqual(["include"]);
      });
      expect(loginRequests[0].credentials).toBe("include");
    });

    it("stores the returned firstName under the LOGGED key", async () => {
      // Given: a backend that greets the viewer as "Ada".
      const user = userEvent.setup();
      stubLoginSuccess("Ada");
      stubUserFavs({ rows: [] });
      renderLogin();

      // When: the viewer signs in.
      await submitCredentials(user);

      // Then: LOGGED holds the first name, not the whole payload.
      await waitFor(() => {
        expect(localStorage.getItem("LOGGED")).toBe("Ada");
      });
    });
  });

  describe("favourites synchronisation", () => {
    it("maps every UserFavourites entry down to its movieRefId", async () => {
      // Given: an account holding two favourites.
      const user = userEvent.setup();
      stubLoginSuccess();
      stubUserFavs({
        rows: [
          {
            UserFavourites: [
              makeFavorite({ id: 701, movieRefId: 603 }),
              makeFavorite({ id: 702, movieRefId: 27205 }),
            ],
          },
        ],
      });
      renderLogin();

      // When: the viewer signs in.
      await submitCredentials(user);

      // Then: only the movie ids are persisted, in payload order.
      await waitFor(() => {
        expect(localStorage.getItem("UserFavs")).toBe(
          JSON.stringify([603, 27205]),
        );
      });
    });

    it("writes an empty list when UserFavourites is empty", async () => {
      // Given: an account row that carries no favourites.
      const user = userEvent.setup();
      stubLoginSuccess();
      stubUserFavs({ rows: [{ UserFavourites: [] }] });
      renderLogin();

      // When: the viewer signs in.
      await submitCredentials(user);

      // Then: the else branch rewrites the key as an empty array.
      await waitFor(() => {
        expect(localStorage.getItem("UserFavs")).toBe("[]");
      });
    });

    it("writes an empty list when rows is empty", async () => {
      // Given: a payload whose rows array has no first element.
      const user = userEvent.setup();
      stubLoginSuccess();
      stubUserFavs({ rows: [] });
      renderLogin();

      // When: the viewer signs in.
      await submitCredentials(user);

      // Then: `rows?.[0]?.` short-circuits into the else branch.
      await waitFor(() => {
        expect(localStorage.getItem("UserFavs")).toBe("[]");
      });
    });

    it("writes an empty list when rows is absent entirely", async () => {
      // Given: a payload with no rows key at all.
      const user = userEvent.setup();
      stubLoginSuccess();
      stubUserFavs({});
      renderLogin();

      // When: the viewer signs in.
      await submitCredentials(user);

      // Then: `rows?.` short-circuits into the else branch.
      await waitFor(() => {
        expect(localStorage.getItem("UserFavs")).toBe("[]");
      });
    });

    it("does not reach the favourites endpoint when the login fails", async () => {
      // Given: a login endpoint that rejects and a favourites recorder.
      const user = userEvent.setup();
      const alertSpy = silenceFailureOutput();
      stubFailure("post", LOGIN_URL);
      const favsCredentials = stubUserFavs({ rows: [] });
      renderLogin();

      // When: the viewer submits invalid credentials.
      await submitCredentials(user);

      // Then: the flow aborted before the second request.
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("SOMETHING WRONG");
      });
      expect(favsCredentials).toEqual([]);
      expect(localStorage.getItem("UserFavs")).toBeNull();
    });
  });

  describe("navigation after a successful sign in", () => {
    it("pushes /movies when no previousMovie is stored", async () => {
      // Given: storage with no previousMovie entry.
      const user = userEvent.setup();
      const pushCalls = trackPush();
      stubLoginSuccess();
      stubUserFavs({ rows: [] });
      renderLogin();

      // When: the viewer signs in.
      await submitCredentials(user);

      // Then: the `?? "/movies"` fallback drives the navigation.
      await waitFor(() => {
        expect(pushCalls).toHaveLength(1);
      });
      expect(pushCalls[0].url).toBe("/movies");
      expect(mockRouter.asPath).toBe("/movies");
    });

    it("pushes the stored previousMovie when one is present", async () => {
      // Given: a deep link the viewer was bounced off of.
      const user = userEvent.setup();
      localStorage.setItem("previousMovie", "/movie/603");
      const pushCalls = trackPush();
      stubLoginSuccess();
      stubUserFavs({ rows: [] });
      renderLogin();

      // When: the viewer signs in.
      await submitCredentials(user);

      // Then: the viewer lands back on the remembered route.
      await waitFor(() => {
        expect(pushCalls).toHaveLength(1);
      });
      expect(pushCalls[0].url).toBe("/movie/603");
      expect(mockRouter.asPath).toBe("/movie/603");
    });

    it("removes previousMovie only after the push has been issued", async () => {
      // Given: a stored previousMovie and a push recorder.
      const user = userEvent.setup();
      localStorage.setItem("previousMovie", "/movie/603");
      const pushCalls = trackPush();
      stubLoginSuccess();
      stubUserFavs({ rows: [] });
      renderLogin();

      // When: the viewer signs in.
      await submitCredentials(user);

      // Then: the key was still readable during push, and is gone afterwards.
      await waitFor(() => {
        expect(pushCalls).toHaveLength(1);
      });
      expect(pushCalls[0].previousMovieAtPushTime).toBe("/movie/603");
      expect(localStorage.getItem("previousMovie")).toBeNull();
    });
  });

  describe("failure rollback", () => {
    it("clears LOGGED and alerts when the login request fails", async () => {
      // Given: a login endpoint returning 500 and a stale LOGGED flag.
      const user = userEvent.setup();
      const alertSpy = silenceFailureOutput();
      const pushCalls = trackPush();
      localStorage.setItem("LOGGED", "stale");
      stubFailure("post", LOGIN_URL);
      renderLogin();

      // When: the viewer submits.
      await submitCredentials(user);

      // Then: the viewer is alerted, signed out, and kept on the login route.
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("SOMETHING WRONG");
      });
      expect(alertSpy).toHaveBeenCalledOnce();
      expect(localStorage.getItem("LOGGED")).toBeNull();
      expect(pushCalls).toEqual([]);
      expect(mockRouter.asPath).toBe("/");
    });

    it("logs the caught error to the console", async () => {
      // Given: a failing login endpoint and a console spy.
      const user = userEvent.setup();
      vi.spyOn(window, "alert").mockImplementation(() => {});
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      stubFailure("post", LOGIN_URL);
      renderLogin();

      // When: the viewer submits.
      await submitCredentials(user);

      // Then: the catch block reported the rejection.
      await waitFor(() => {
        expect(logSpy).toHaveBeenCalled();
      });
    });

    /**
     * BUG CANDIDATE for docs/TEST-BUGS.md (todo 28): the catch block at
     * Login.js:47-51 covers BOTH requests, so a favourites fetch that fails
     * after a successful login deletes the LOGGED key that line 30 just wrote.
     * The session cookie the backend set survives, so the viewer is
     * authenticated server-side but signed out client-side, with no way back
     * other than logging in again. These tests lock the real behavior — do not
     * "fix" them into a passing sign in.
     */
    it("signs the viewer out again when the favourites fetch fails after a successful login", async () => {
      // Given: login succeeds but the favourites endpoint returns 500.
      const user = userEvent.setup();
      const alertSpy = silenceFailureOutput();
      stubLoginSuccess("Ada");
      const favsCredentials = stubFailure("get", FAVS_URL);
      renderLogin();

      // When: the viewer signs in.
      await submitCredentials(user);

      // Then: LOGGED is wiped even though line 30 had already written "Ada".
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("SOMETHING WRONG");
      });
      expect(favsCredentials).toEqual(["include"]);
      expect(localStorage.getItem("LOGGED")).toBeNull();
      expect(localStorage.getItem("UserFavs")).toBeNull();
    });

    it("leaves the viewer on the login route with previousMovie intact when the favourites fetch fails", async () => {
      // Given: a remembered deep link plus a failing favourites endpoint.
      const user = userEvent.setup();
      const alertSpy = silenceFailureOutput();
      const pushCalls = trackPush();
      localStorage.setItem("previousMovie", "/movie/603");
      stubLoginSuccess("Ada");
      stubFailure("get", FAVS_URL);
      renderLogin();

      // When: the viewer signs in.
      await submitCredentials(user);

      // Then: neither the push nor the cleanup on lines 45-46 ever ran.
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("SOMETHING WRONG");
      });
      expect(pushCalls).toEqual([]);
      expect(mockRouter.asPath).toBe("/");
      expect(localStorage.getItem("previousMovie")).toBe("/movie/603");
    });

    /**
     * BUG CANDIDATE for docs/TEST-BUGS.md (todo 28): line 37 optional-chains
     * `rows?.[0]?.` but then reads `.UserFavourites.length` unguarded, so a row
     * without that association throws a TypeError inside the try block and
     * lands the viewer in the same signed-out state as a network failure.
     */
    it("signs the viewer out when a row arrives without a UserFavourites array", async () => {
      // Given: a favourites payload whose row omits the association.
      const user = userEvent.setup();
      const alertSpy = silenceFailureOutput();
      stubLoginSuccess("Ada");
      stubUserFavs({ rows: [{}] });
      renderLogin();

      // When: the viewer signs in.
      await submitCredentials(user);

      // Then: the unguarded property read is caught as a generic failure.
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith("SOMETHING WRONG");
      });
      expect(localStorage.getItem("LOGGED")).toBeNull();
      expect(localStorage.getItem("UserFavs")).toBeNull();
    });
  });
});
