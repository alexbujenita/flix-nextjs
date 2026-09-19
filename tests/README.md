# Component test conventions

These rules are binding for component tests in this suite.

## Query elements by semantics, never by CSS class

Vitest uses its default `css: false` behavior, so CSS-module imports are stubs and
their generated class names are not stable or assertable. Do not query by class
name, use class-name selectors, or make assertions about CSS-module class values.

Prefer accessible Testing Library queries. Use the following component-specific
fallbacks where the current markup does not expose an accessible control:

| Component        | Required query strategy                                                                   |
| ---------------- | ----------------------------------------------------------------------------------------- |
| `AddRemoveIcon`  | Use `getByText("+")` or `getByText("-")` for the bare clickable `<div>`.                  |
| `Rating`         | Use `container.querySelectorAll("svg")` for the 10 unlabeled `FaStar` icons.              |
| `AddRemoveFav`   | Use `getByRole("heading", { name: "ADD FAV" })` or the heading's current accessible name. |
| `MarkSeenUnseen` | Use `getByRole("heading", { name: "..." })` with the expected heading text.               |
| `LogInOut`       | Use `getByRole("heading", { name: "..." })` with the expected heading text.               |
| `Trailers`       | Use `getByRole("heading", { name: "..." })` with the expected heading text.               |
| `SearchBar`      | Use `getByRole` or `getByLabelText` normally.                                             |
| `RegisterPage`   | Use placeholder queries for its four unassociated inputs; use `getByRole` for the button. |
| `Login`          | Use `getByRole` or `getByLabelText` normally.                                             |

## Use fully populated fixture factories

Build component props with the factories in `tests/fixtures/*.ts`, such as
`makeMovie`, `makeTvShow`, `makePerson`, and `makeFavorite`. Override only the
field relevant to the behavior under test. Do not pass partial object literals:
JavaScript components that destructure their parameters can be inferred by
TypeScript as requiring every property.

## TypeScript suppression policy

Blanket `as any` assertions and TypeScript ignore directives are forbidden.
An expect-error directive is permitted only at a render site for these two known
source JSDoc defects:

- `src/components/Card/Card.js:9`
- `src/components/AddRemoveIcon/AddRemoveIcon.js:28`

Use exactly one directive per affected render site. Its comment must name the
defective source file and line.

No other component may use this exception. Every directive must also be listed
in `docs/TEST-BUGS.md` when that ledger is created in todo 28. Never add or alter
production declarations under `src/` to make a test compile.
