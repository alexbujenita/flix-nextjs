import { describe, it, expect, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import useLoginState from "../../src/utils/useLoginState";
import { loginAs, logout } from "../helpers/auth";

describe("useLoginState() - subscription-driven update (no focus event)", () => {
  beforeEach(() => {
    logout();
  });

  it("does NOT update when cookie is set without dispatching focus", async () => {
    const { result } = renderHook(() => useLoginState());

    // Initial state: no cookie, hook returns false
    expect(result.current).toBe(false);

    // Set cookie WITHOUT dispatching focus event
    loginAs("test-jwt-token");

    // Wait a tick to ensure any pending updates would run
    await new Promise((resolve) => setTimeout(resolve, 10));

    // CRITICAL: value must still be false because focus event was never dispatched
    // This proves the hook is subscription-driven, not an incidental re-render
    expect(result.current).toBe(false);
  });
});
