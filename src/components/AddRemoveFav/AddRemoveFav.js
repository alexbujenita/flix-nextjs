import { useRouter } from "next/router";
import styles from "./AddRemoveFav.module.scss";
import isLogged from "../../utils/isLogged";
import { addMovieToFavs, removeMovieFromFavs } from "../AddRemoveIcon/utils";

export default function AddRemoveFav(props) {
  const { movie, isFav, setIsFav, movieId } = props;
  const router = useRouter();

  async function onClickAdd() {
    if (isLogged()) {
      await addMovieToFavs(movie.id, movie.title, movie.poster_path);
      setIsFav(true);
    } else {
      localStorage.setItem("previousMovie", `/movie/${movie.id}`)
      router.push("/login");
    }
  }

  async function onClickRemove() {
    await removeMovieFromFavs(movie.id);
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
