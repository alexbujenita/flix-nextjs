import Image from "next/image";
import Link from "next/link";
import styles from "./MovieCard.module.scss";

export default function MovieCard(props) {
  const { title, poster_path, id } = props;
  return (
    <div className={styles.movieCard}>
      <Link href={`/movie/${id}`}>
        <div className={styles.movieCardImage}>
          <Image
            src={
              poster_path
                ? `https://image.tmdb.org/t/p/w342${poster_path}`
                : "/image-placeholder-vertical.jpg"
            }
            alt={title}
            width={342}
            height={513}
          />
        </div>
      </Link>
      <p className={styles.movieTitle}>{title}</p>
    </div>
  );
}
