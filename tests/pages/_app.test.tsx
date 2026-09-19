import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import MyApp from "../../src/pages/_app";
import { loginAs, logout } from "../helpers/auth";
import { renderWithRouter } from "../helpers/render";

/**
 * `_app.js` is the Next.js custom App: it renders the persistent `NavBar` and
 * then the routed page. Standing in a local component for `Component` keeps
 * this a test of the shell rather than a second copy of a page test.
 *
 * `NavBar` renders `<Link>`, so the router context from `renderWithRouter` is
 * required even though `_app.js` itself never touches the router.
 */

type StubPageProps = {
  readonly body: string;
  readonly heading: string;
};

function StubPage({ body, heading }: StubPageProps) {
  return (
    <main>
      <h2>{heading}</h2>
      <p>{body}</p>
    </main>
  );
}

function OtherStubPage() {
  return <h2>Second route</h2>;
}

const NAV_HEADINGS = ["Movies", "TV", "RaNDom"] as const;

function expectNavBarRendered(): void {
  for (const name of NAV_HEADINGS) {
    expect(screen.getByRole("heading", { name })).toBeInTheDocument();
  }
}

describe("MyApp (custom App shell)", () => {
  beforeEach(() => {
    logout();
  });

  it("renders the NavBar alongside the routed page component", () => {
    // Given / When: the shell renders a page component.
    renderWithRouter(
      <MyApp
        Component={StubPage}
        pageProps={{ body: "Routed body", heading: "Routed heading" }}
      />,
    );

    // Then: the persistent nav and the routed page are both mounted.
    expectNavBarRendered();
    expect(
      screen.getByRole("heading", { name: "Routed heading" }),
    ).toBeInTheDocument();
  });

  it("spreads every pageProps entry onto the routed component", () => {
    // Given / When: the shell is handed two page props.
    renderWithRouter(
      <MyApp
        Component={StubPage}
        pageProps={{ body: "Props reached the page", heading: "Title prop" }}
      />,
    );

    // Then: both props arrived, so `{...pageProps}` is a full spread.
    expect(
      screen.getByRole("heading", { name: "Title prop" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Props reached the page")).toBeInTheDocument();
  });

  it("renders the NavBar before the page in document order", () => {
    // Given / When: the fragment puts NavBar first and the page second.
    renderWithRouter(
      <MyApp
        Component={StubPage}
        pageProps={{ body: "Below the nav", heading: "Page heading" }}
      />,
    );

    // Then: the nav precedes the routed page in the DOM, so it reads first.
    const firstNavHeading = screen.getByRole("heading", { name: "Movies" });
    const pageHeading = screen.getByRole("heading", { name: "Page heading" });
    const position = firstNavHeading.compareDocumentPosition(pageHeading);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders a page component that takes no props when pageProps is empty", () => {
    // Given / When: a page with no props and an empty pageProps object.
    renderWithRouter(<MyApp Component={OtherStubPage} pageProps={{}} />);

    // Then: the shell still mounts both halves.
    expectNavBarRendered();
    expect(
      screen.getByRole("heading", { name: "Second route" }),
    ).toBeInTheDocument();
  });

  it("keeps the NavBar mounted when the routed page is swapped", () => {
    // Given: the shell rendering the first page.
    const { rerender } = renderWithRouter(
      <MyApp
        Component={StubPage}
        pageProps={{ body: "First body", heading: "First route" }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "First route" }),
    ).toBeInTheDocument();

    // When: a navigation swaps in a different page component.
    rerender(<MyApp Component={OtherStubPage} pageProps={{}} />);

    // Then: the nav survives the swap and only the page content changes.
    expectNavBarRendered();
    expect(
      screen.getByRole("heading", { name: "Second route" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "First route" }),
    ).not.toBeInTheDocument();
  });

  it("passes the logged-in state through to the NavBar it owns", () => {
    // Given: an auth cookie set before the shell mounts.
    loginAs();

    // When: the shell renders.
    renderWithRouter(<MyApp Component={OtherStubPage} pageProps={{}} />);

    // Then: the nav's logged-only link is visible inside the shell.
    expect(screen.getByRole("heading", { name: "FAVS" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "LOGOUT" })).toBeInTheDocument();
  });
});
