import Cookies from "js-cookie";

/**
 * Temporary solution to know if a user is logged in
 * @return {boolean}
 */
export default function isLogged() {
  return Boolean(Cookies.get("JWT_TOKEN_MY_FLIX"));
}