import Cookies from "js-cookie";

export const AUTH_COOKIE_NAME = "JWT_TOKEN_MY_FLIX";

export function loginAs(token = "fixture-jwt-token"): void {
  Cookies.set(AUTH_COOKIE_NAME, token);
}

export function logout(): void {
  Cookies.remove(AUTH_COOKIE_NAME);
}
