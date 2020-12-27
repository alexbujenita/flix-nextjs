import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import styles from "./AddRemoveFav.module.scss";
import isLogged from "../../utils/isLogged";

export default function AddRemoveFav(props) {
  console.log(props);
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

  async function addMovieToFavs() {
    if (isLogged()) {
      try {
        await axios.post(
          "http://localhost:3001/api/favs",
          {
            movieRefId: movie.id,
            movieTitle: movie.title,
            moviePosterPath: movie.poster_path,
          },
          { withCredentials: true }
        );
        const favs = JSON.parse(localStorage.getItem("UserFavs"));
        favs.push(movie.id);
        localStorage.setItem("UserFavs", JSON.stringify(favs));
        setIsFav(true);
      } catch (error) {
        console.log(error);
        alert("Try again later...");
      }
    } else {
      router.push("/login");
    }
  }

  return isFav ? (
    <h2 className={styles.addRemove}>REMOVE</h2>
  ) : (
    <h2 className={styles.addRemove} onClick={addMovieToFavs}>
      ADD FAV
    </h2>
  );
}
