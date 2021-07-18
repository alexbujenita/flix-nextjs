import axios from "axios";
import { FaStar } from "react-icons/fa";
import styles from "./Rating.module.scss";

export default function Rating({ isFav, movieRating, movie, setMovieRating }) {

  if (!isFav) return null;
  const STARS = [];
  const rate = async (rating) => {
    if (movieRating === rating) return;
    try {
      await axios.patch(
        `http://localhost:3001/api/favs/${movie.id}`,
        { rating },
        { withCredentials: true }
      );
      setMovieRating(rating);
    } catch (error) {
      console.log(error);
    }
  };
  for (let i = 0; i < 10; i++) {
    STARS.push(
      <FaStar
        key={i}
        color={i < movieRating ? "red" : "grey"}
        cursor={"pointer"}
        size={20}
        onClick={() => {
          rate(i + 1);
        }}
      />
    );
  }
  return <div className={styles.ratingContainer}>{STARS}</div>;
}
