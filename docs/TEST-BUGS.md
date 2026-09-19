# Bugs and coverage gaps found while writing tests

This is a report, not a changelog. The test suite locks the behavior that exists
today, including the wrong behavior. Nothing listed here has been fixed, and no
entry below proposes a fix. If you change any of these, expect a test to fail:
that failure is the signal, not a defect in the test.

Every `file:line` below was verified by opening the file at that line.

## 1. `localStorage.clear("LOGGED")` wipes all of localStorage

`src/components/LogInOut/LogInOut.js:14`

```js
localStorage.clear("LOGGED");
```

`Storage.clear()` takes no arguments. The string is ignored and the whole origin's
localStorage is dropped, not just the `LOGGED` key.

## 2. Search `trim()` runs outside the `try`, so a missing term is a 500 not a 404

`src/pages/search/index.js:60`

```js
const normalizedSearch = searchTerm.trim().toLowerCase();
try {
```

The `try` opens on line 61. A request with no `searchTerm` throws a `TypeError`
out of `getServerSideProps` instead of returning `{ notFound: true }`, so the
visitor gets a 500 where the page clearly intended a 404.

## 3. `prop-types` was an undeclared dependency

`src/pages/search/index.js:1` and `src/components/PersonCard/PersonCard.js:4`

Both import `prop-types`. It was not listed in `package.json`; it resolved only
because it sat in `yarn.lock` as a hoisted transitive dependency
(`yarn.lock:3642`, `prop-types@^15.8.1`). The source depended on a package nobody
had declared, which works right up until the hoisting changes.

Historical note: this is now declared at `package.json:24`. The defect is
recorded because the source relied on it for its whole life until then.

## 4. `Card` JSDoc types props as the bare `Object`, rejecting every prop

`src/components/Card/Card.js:9`

```js
 * @param {Object} props - The movie object that will be displayed.
```

Under `checkJs`/TS consumption, `Object` is the empty object type, so every named
prop the component actually reads is a type error at the call site. This is a
migration blocker for the file. Note the line is **9**, not 8.

## 5. `AddRemoveIcon` JSDoc names the wrong parameter

`src/components/AddRemoveIcon/AddRemoveIcon.js:28`

```js
 * @param {Object} movie - The movie object that will be added or removed ...
```

The first parameter is the props object `{ movie, contentType }`, not `movie`.
Same `Object` typing blocker as #4, and the prose is simply wrong about the
signature.

## 6. Actor page sorts the `movies` prop array in place

`src/pages/actor/[actorId].js:14-27`

```js
movies.sort((m1, m2) => m2.popularity - m1.popularity);
```

All three sort handlers mutate the prop array directly and then bump a counter to
force a rerender. The array reference never changes; only its element order does.
Lines 21-22 go further and write `"0000-99-99"` back onto the movie objects
themselves. Mutating props, with a manual rerender to paper over it.

## 7. `window.location.reload(true)` passes a dead argument

`src/pages/admin/users/[id].js:18`

```js
window.location.reload(true);
```

The forced-reload argument was removed from the spec years ago. Every current
browser ignores it, so the code reads as if it forces a cache-bypassing reload
when it does not.

## 8. `AddRemoveFav` accepts a `movieId` prop it never uses

`src/components/AddRemoveFav/AddRemoveFav.js:7`

```js
const { movie, isFav, setIsFav, movieId } = props;
```

`movieId` is destructured and then never read in the component body; every
request uses `movie.id`. A test passes `movieId={999999}` and asserts the request
still carries `movie.id`, which locks the quirk.

Related asymmetry worth knowing: the add path is guarded by `isLogged()` and
redirects to `/login`, while the remove path has no such guard and deletes while
logged out.

## 9. The TV season route is a dynamic route that renders a literal string

`src/pages/tv/series/[seriesId]/season/[seasonNumber]/index.js:1-3`

```jsx
export default function TVSeason() {
  return <h1>TV Season!</h1>;
}
```

Two route params, no `getServerSideProps`, no `getStaticProps`, no data. The
build treats it as a static page. It is a placeholder wired into the router.

## 10. A successful login is rolled back by a failing favourites fetch

`src/pages/login/index.js:47-51`

```js
} catch (e) {
  console.log(e);
  localStorage.removeItem("LOGGED");
  alert("SOMETHING WRONG");
}
```

The login POST and the follow-up favourites GET share one `try`. `LOGGED` is
written as soon as the POST resolves, so any favourites failure runs this catch
and deletes the flag that was just written. The backend has set the auth cookie
and the visitor _is_ authenticated server-side, but the client now believes they
are signed out, no navigation happens (line 45 never runs), and the only feedback
is `alert("SOMETHING WRONG")`. A non-essential sidecar request costs the visitor
their session.

A narrower version of the same trap sits on line 37: `data.rows?.[0]?.UserFavourites.length`
optional-chains `rows` and `[0]` but then reads `.UserFavourites.length`
unguarded, so a malformed-but-200 response lands in the same catch.

## 11. PDF download sticks in progress forever and leaves an unhandled rejection

`src/pages/user-favs/index.js:37-55`

```js
async function downloadFavsAsPdf() {
  setInProgress(true);
  const { data } = await axios.get(...);
  ...
  setInProgress(false);
}
```

No `try`, no `catch`, no `finally`. `setInProgress(false)` at line 54 is reached
only on success, so a failed request leaves the UI showing progress permanently
with no way back short of a reload. The same missing catch means the async
`onClick` returns a rejected promise that React never awaits, producing an
unhandled promise rejection.

## 12. Admin user detail page has no cookie guard, unlike its siblings

`src/pages/admin/users/[id].js:80-102`

```js
headers: {
  Cookie: ctx.req.headers.cookie || "",
},
```

`src/pages/user-favs/index.js:139-143` and `src/pages/admin/users/index.js:23-27`
both bail with `{ notFound: true }` when `ctx.req.headers.cookie` is missing.
This page does not. An unauthenticated request still fires at an admin endpoint
with an explicitly empty `Cookie` header and relies entirely on the backend to
reject it. An inconsistency at minimum.

## 13. Error handling is inconsistent across the codebase

Four different strategies, no rule about which applies where. Every location
below was verified.

**`console.error`**

- `src/pages/tv/index.js:74`
- `src/pages/tv/series/[seriesId]/index.js:99`
- `src/utils/userFavs.js:10`

**`console.log` used for errors**

- `src/pages/user-favs/index.js:162`
- `src/pages/admin/users/index.js:40`
- `src/pages/login/index.js:48`
- `src/pages/admin/users/[id].js:20`
- `src/components/Rating/Rating.js:18`
- `src/components/LogInOut/LogInOut.js:18`
- `src/components/AddRemoveIcon/utils.js:23` and `:39`
- `src/components/MarkSeenUnseen/MarkSeenUnseen.js:20`
- `src/components/FilterMovies/FilterMovies.js:22`

**`alert()` as the user-facing error channel**

- `src/components/LogInOut/LogInOut.js:19` — `"Retry."`
- `src/components/AddRemoveIcon/utils.js:24` and `:40` — `"Try again later..."`
- `src/components/MarkSeenUnseen/MarkSeenUnseen.js:21`
- `src/components/RegisterPage/RegisterPage.js:40` — `"SOMETHING WRONG"`
- `src/pages/login/index.js:50` — `"SOMETHING WRONG"`
- `src/pages/actor/[actorId].js:30` — `"Sneaky"`

**Silent swallow, no logging at all**

`getServerSideProps`:

- `src/pages/movies/index.js:100`
- `src/pages/search/index.js:71`
- `src/pages/actor/[actorId].js:94`
- `src/pages/movie/[movieId].js:154`
- `src/pages/movie/recommendations/[recMovieId].js:47`
- `src/pages/movie/similar-movies/[movieIdSimilar].js:47`
- `src/pages/admin/users/[id].js:97`

`getStaticProps`:

- `src/pages/random-movies/index.js:50`

Several of these catch a bound `error` variable and never reference it; the rest
use a bare `catch {}`. Either way, a server-side failure becomes a 404 with no
trace anywhere.

## 14. Register form labels are not associated with their inputs

`src/components/RegisterPage/RegisterPage.js:52-102`

```jsx
<label>
  <b>Password</b>
</label>
<input type="password" placeholder="Enter Password" name="psw" required />
```

All four labels are siblings of their inputs rather than wrappers, and none has
an `htmlFor` paired with an input `id`. The inputs therefore have no accessible
name derived from the visible label. This is especially apparent for the
password input, which has no implicit ARIA textbox role; tests must use the
placeholder as the closest available semantic query.

---

# Accepted coverage gaps

Behavior the suite deliberately does not assert, with the reason.

## `window.location.reload()` is not observable in jsdom

Affects `src/pages/admin/users/[id].js:18`.

`vi.spyOn(window.location, "reload")` throws `TypeError: Cannot redefine property: reload`
under jsdom, and calling it only logs `Not implemented: navigation to another Document`
without throwing. There is no seam to assert on. Tests for the admin favourite
deletion therefore assert through the preceding `axios.delete` call instead, and
treat the reload as unverified. This is the fallback recorded by the spike gate.

## Nothing else needed a gap

The unhandled promise rejection from #11 was expected to need one. It did not:
the `process.on("unhandledRejection")` pattern works under Vitest 4 as long as
the cleanup is registered immediately with `onTestFinished` and the wait is a
bounded `expect.poll`. The rejection is asserted for real.

---

# `@ts-expect-error` justifications

The suppression policy lives in `tests/README.md:34-45`: no blanket `as any`, no
`@ts-ignore`, and `@ts-expect-error` only at a render site for the two known
source JSDoc defects, one directive per site, with a comment naming the defective
file and line.

## Under the policy (2 sites)

**`tests/components/Card.test.tsx:28`**

> the defective `@param {Object} props` JSDoc at `src/components/Card/Card.js:9`
> types Card's props as the bare `Object` type, which rejects every named prop
> the component actually reads.

Covers bug #4. It sits on a single `renderCard()` helper so the whole file needs
one directive rather than one per test.

**`tests/components/AddRemoveIcon.test.tsx:46`**

> defective `@param {Object}` in `AddRemoveIcon.js:28` rejects valid props.

Covers bug #5, on the same single-helper pattern. Both directives are
load-bearing: a scoped `tsc -p` over these files exits 0 with no "unused
'@ts-expect-error' directive" error, so neither is masking anything. Frozen
constant mutation tests use `Reflect.set` and `Reflect.get`, so they require no
additional TypeScript suppression.
