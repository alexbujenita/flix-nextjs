import Image from "next/image";
import styles from "./MovieCard.module.scss";
export default function MovieCard(props) {
  const { title, poster_path } = props;
  return (
    <div className={styles.movieCard}>
      <div className={styles.movieCardImage}>
        <Image
          src={
            poster_path
              ? `https://image.tmdb.org/t/p/w342${poster_path}`
              : "/image-placeholder-vertical.jpg"
          }
          width={342}
          height={513}
        />
      </div>
      <p className={styles.movieTitle}>{title}</p>
    </div>
  );
}
