/**
 * temporary solution to know if a user is logged in
 */
export default function isLogged() {
  return !!localStorage.getItem("LOGGED");
}