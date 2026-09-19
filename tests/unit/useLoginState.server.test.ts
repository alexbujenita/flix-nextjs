// @vitest-environment node
import { describe, it, expect, beforeEach } from "vitest";
import { renderToString } from "react-dom/server";
import React from "react";
import useLoginState from "../../src/utils/useLoginState";
import { loginAs, logout } from "../helpers/auth";

// Tiny probe component that calls useLoginState
function ProbeComponent() {
  const isLoggedIn = useLoginState();
  return React.createElement(
    "div",
    null,
    isLoggedIn ? "logged-in" : "logged-out",
  );
}

describe("useLoginState() - server snapshot (node environment)", () => {
  beforeEach(() => {
    logout();
  });

  it("server snapshot returns false even when JWT_TOKEN_MY_FLIX cookie would be present", () => {
    // Set cookie before rendering (it won't be read in Node environment)
    loginAs("test-jwt-token");

    // Render on the server
    const html = renderToString(React.createElement(ProbeComponent));

    // Should always render false (logged-out) even though cookie is set
    expect(html).toContain("logged-out");
    expect(html).not.toContain("logged-in");
  });

  it("server snapshot returns false when no cookie is present", () => {
    const html = renderToString(React.createElement(ProbeComponent));
    expect(html).toContain("logged-out");
  });
});
