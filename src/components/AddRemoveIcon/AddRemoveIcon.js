import styles from "./AddRemoveIcon.module.scss";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import isLogged from "../../utils/isLogged";

export default function AddRemoveIcon({ movie }) {
  const [isFav, setIsFav] = useState(false);
  const router = useRouter();
  useEffect(() => {
    const favs = localStorage.getItem("UserFavs");
    if (favs) {
      const favsArray = JSON.parse(favs);
      setIsFav(favsArray.includes(movie.id));
    }
  }, []);

  async function addOrRemoveFav() {
    if (isFav) {
      try {
        await axios.delete(`http://localhost:3001/api/favs/${movie.id}`, {
          withCredentials: true,
        });
        const favs = JSON.parse(localStorage.getItem("UserFavs")).filter(
          (id) => id !== movie.id
        );
        localStorage.setItem("UserFavs", JSON.stringify(favs));
        setIsFav(false);
      } catch (error) {
        console.log(error);
        alert("Try again later...");
      }
    } else {
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
  }

  // console.log(movie);
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
