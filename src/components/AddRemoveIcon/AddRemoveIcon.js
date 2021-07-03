import styles from "./AddRemoveIcon.module.scss";
import { useEffect, useState } from "react";
import isLogged from "../../utils/isLogged";
import { addMovieToFavs, removeMovieFromFavs } from "./utils";

export default function AddRemoveIcon({ movie }) {
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
