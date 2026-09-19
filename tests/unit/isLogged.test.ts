import { describe, it, expect, beforeEach } from "vitest";
import isLogged from "../../src/utils/isLogged";
import { loginAs, logout } from "../helpers/auth";

describe("isLogged()", () => {
  beforeEach(() => {
    logout();
  });

  it("returns false when JWT_TOKEN_MY_FLIX cookie is not present", () => {
    expect(isLogged()).toBe(false);
  });

  it("returns true when JWT_TOKEN_MY_FLIX cookie is present", () => {
    loginAs("test-jwt-token");
    expect(isLogged()).toBe(true);
  });

  it("returns false again after logout", () => {
    loginAs("test-jwt-token");
    expect(isLogged()).toBe(true);
    logout();
    expect(isLogged()).toBe(false);
  });
});
