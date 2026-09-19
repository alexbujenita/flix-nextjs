import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import useLoginState from "../../src/utils/useLoginState";
import { loginAs, logout } from "../helpers/auth";

describe("useLoginState()", () => {
  beforeEach(() => {
    logout();
    vi.clearAllMocks();
  });

  it("returns false initially when no cookie is present", () => {
    const { result } = renderHook(() => useLoginState());
    expect(result.current).toBe(false);
  });

  it("returns true initially when JWT_TOKEN_MY_FLIX cookie is present", () => {
    loginAs("test-jwt-token");
    const { result } = renderHook(() => useLoginState());
    expect(result.current).toBe(true);
  });

  it("updates to true when cookie is set and focus event fires", async () => {
    const { result } = renderHook(() => useLoginState());
    expect(result.current).toBe(false);

    act(() => {
      loginAs("test-jwt-token");
      window.dispatchEvent(new Event("focus"));
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current).toBe(true);
  });

  it("does not update when cookie is set without focus event", async () => {
    const { result } = renderHook(() => useLoginState());
    expect(result.current).toBe(false);

    // Set cookie WITHOUT dispatching focus
    loginAs("test-jwt-token");
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Value should still be false (subscription not triggered)
    expect(result.current).toBe(false);
  });

  it("removes focus listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

    const { unmount } = renderHook(() => useLoginState());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "focus",
      expect.any(Function),
    );
    removeEventListenerSpy.mockRestore();
  });

  it("updates to false when cookie is removed and focus event fires", async () => {
    loginAs("test-jwt-token");
    const { result } = renderHook(() => useLoginState());
    expect(result.current).toBe(true);

    act(() => {
      logout();
      window.dispatchEvent(new Event("focus"));
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(result.current).toBe(false);
  });
});
