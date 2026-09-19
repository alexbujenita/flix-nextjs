export const USER_FAVS_UPDATED_EVENT = "user-favs-updated";

export function parseUserFavs(serializedFavs) {
  if (!serializedFavs) return [];

  try {
    const favs = JSON.parse(serializedFavs);
    return Array.isArray(favs) ? favs : [];
  } catch (error) {
    console.error("Unable to parse stored user favourites.", error);
    return [];
  }
}

export function getUserFavs() {
  return parseUserFavs(localStorage.getItem("UserFavs"));
}

export function setUserFavs(favs) {
  if (!Array.isArray(favs)) {
    throw new TypeError("User favourites must be an array.");
  }

  localStorage.setItem("UserFavs", JSON.stringify(favs));
  window.dispatchEvent(new Event(USER_FAVS_UPDATED_EVENT));
}
