import axios from "axios";
import styles from "./MarkSeenUnseen.module.scss";

export default function MarkSeenUnseen(props) {
  const { seen, setSeen, movie } = props;
  const errorMessage = "There was an error, try again later.";
  const mark = (unseen) => async () => {
    try {
      await axios.patch(
        `http://localhost:3001/api/favs/${movie.id}`,
        { seen: "change!" },
        { withCredentials: true }
      );
      if (unseen) {
        setSeen(false);
      } else {
        setSeen(true);
      }
    } catch (error) {
      console.log(error);
      alert(errorMessage);
    }
  };
  return seen ? (
    <h2 className={styles.mark} onClick={mark(true)}>
      MARK AS UNSEEN
    </h2>
  ) : (
    <h2 className={styles.mark} onClick={mark(false)}>
      MARK AS SEEN
    </h2>
  );
}
