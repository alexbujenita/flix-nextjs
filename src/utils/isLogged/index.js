/**
 * temporary solution to know if a user is logged in
 * and the name
 */
export default function isLogged() {
  return localStorage.getItem("LOGGED");
}