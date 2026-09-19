import styles from "./AddRemoveIcon.module.scss";
import { useSyncExternalStore } from "react";
import isLogged from "../../utils/isLogged";
import { addMovieToFavs, removeMovieFromFavs } from "./utils";
import { CONTENT_TYPE } from "../../utils/constants";
import { parseUserFavs, USER_FAVS_UPDATED_EVENT } from "../../utils/userFavs";

function subscribeToUserFavs(onStoreChange) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(USER_FAVS_UPDATED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(USER_FAVS_UPDATED_EVENT, onStoreChange);
  };
}

function getUserFavsSnapshot() {
  return localStorage.getItem("UserFavs");
}

function getServerUserFavsSnapshot() {
  return null;
}

function subscribeToLoginState(onStoreChange) {
  window.addEventListener("focus", onStoreChange);

  return () => {
    window.removeEventListener("focus", onStoreChange);
  };
}

function getServerLoginState() {
  return false;
}

/**
 * AddRemoveIcon component is used to add or remove a movie from the user's favorites list.
 * @param {Object} movie - The movie object that will be added or removed from the user's favorites list.
 * @param {boolean} isTvSeries - A boolean value to check if the movie is a tv series. If it is a tv series, the AddRemoveIcon component will not be rendered.
 * @returns {JSX.Element} - Returns the AddRemoveIcon component.
 * @example
 * <AddRemoveIcon movie={movie} />
 */
export default function AddRemoveIcon({ movie, contentType }) {
  const serializedFavs = useSyncExternalStore(
    subscribeToUserFavs,
    getUserFavsSnapshot,
    getServerUserFavsSnapshot,
  );
  const isUserLogged = useSyncExternalStore(
    subscribeToLoginState,
    isLogged,
    getServerLoginState,
  );
  const isFav = parseUserFavs(serializedFavs).includes(movie.id);

  if (contentType !== CONTENT_TYPE.MOVIE) return null;

  async function addOrRemoveFav() {
    if (isFav) {
      await removeMovieFromFavs(movie.id);
    } else {
      await addMovieToFavs(movie.id, movie.title, movie.poster_path);
    }
  }
  if (!isUserLogged) return null;

  return (
    <div className={styles.addIcon} onClick={addOrRemoveFav}>
      {isFav ? (
        <span className={styles.iconMinusSign}>-</span>
      ) : (
        <span className={styles.iconPlusSign}>+</span>
      )}
    </div>
  );
}
