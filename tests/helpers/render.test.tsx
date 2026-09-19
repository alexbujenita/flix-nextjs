import { screen } from "@testing-library/react";
import { useRouter } from "next/router";
import { describe, expect, it } from "vitest";

import { renderWithRouter } from "./render";

function RouterConsumer() {
  const router = useRouter();

  return <h1>{router.asPath}</h1>;
}

describe("renderWithRouter", () => {
  it("provides the configured route to components using next/router", () => {
    // Given: a component reads from the Next.js pages router.
    const route = "/movies?page=2";

    // When: the component is rendered at a configured route.
    renderWithRouter(<RouterConsumer />, { url: route });

    // Then: the component receives that route from next-router-mock.
    expect(screen.getByRole("heading", { name: route })).toBeInTheDocument();
  });
});
