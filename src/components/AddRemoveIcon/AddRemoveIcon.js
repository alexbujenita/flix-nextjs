import styles from "./AddRemoveIcon.module.scss";
import { useEffect, useState } from "react";
import isLogged from "../../utils/isLogged";
import { addMovieToFavs, removeMovieFromFavs } from "./utils";
import { CONTENT_TYPE } from "../../utils/constants";

/**
 * AddRemoveIcon component is used to add or remove a movie from the user's favorites list.
 * @param {Object} movie - The movie object that will be added or removed from the user's favorites list.
 * @param {boolean} isTvSeries - A boolean value to check if the movie is a tv series. If it is a tv series, the AddRemoveIcon component will not be rendered.
 * @returns {JSX.Element} - Returns the AddRemoveIcon component.
 * @example
 * <AddRemoveIcon movie={movie} />
 */
export default function AddRemoveIcon({ movie, contentType }) {
  const [isFav, setIsFav] = useState(false);
  const [isUserLogged, setIsUserLogged] = useState(false);
  
  useEffect(() => {
    const favs = localStorage.getItem("UserFavs");
    setIsUserLogged(isLogged());
    if (favs) {
      const favsArray = JSON.parse(favs);
      setIsFav(favsArray.includes(movie.id));
    }
  }, [movie.id]);

  if (contentType !== CONTENT_TYPE.MOVIE) return null;

  async function addOrRemoveFav() {
    if (isFav) {
      removeMovieFromFavs(movie.id);
      setIsFav(false);
    } else {
      addMovieToFavs(movie.id, movie.title, movie.poster_path);
      setIsFav(true);
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
