import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "./AddRemoveFav.module.scss";
import isLogged from "../../utils/isLogged";
import { addMovieToFavs, removeMovieFromFavs } from "../AddRemoveIcon/utils";

export default function AddRemoveFav(props) {
  const { movie } = props;
  const [isFav, setIsFav] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const favs = localStorage.getItem("UserFavs");
    if (favs) {
      const favsArray = JSON.parse(favs);
      setIsFav(favsArray.includes(movie.id));
    }
  }, []);

  function onClickAdd() {
    if (isLogged()) {
      addMovieToFavs(movie.id, movie.title, movie.poster_path);
      setIsFav(true);
    } else {
      localStorage.setItem("previousMovie", `/movie/${movie.id}`)
      router.push("/login");
    }
  }

  async function onClickRemove() {
    removeMovieFromFavs(movie.id);
    setIsFav(false);
  }

  return isFav ? (
    <h2 className={styles.addRemove} onClick={onClickRemove}>
      REMOVE
    </h2>
  ) : (
    <h2 className={styles.addRemove} onClick={onClickAdd}>
      ADD FAV
    </h2>
  );
}
