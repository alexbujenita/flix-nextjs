import Image from "next/image";
import Link from "next/link";
import styles from "./MovieCard.module.scss";

export default function TvSeriesCard(props) {
  const { original_name, poster_path, id, first_air_date } = props;

  return (
    <div className={styles.movieCard}>
      {/* <AddRemoveIcon movie={props} /> */}
      <Link href={`/movie/${id}`}>
          <div className={styles.movieCardImage}>
            <Image
              src={
                poster_path
                  ? `https://image.tmdb.org/t/p/w342${poster_path}`
                  : "/image-placeholder-vertical.jpg"
              }
              alt={original_name}
              width={342}
              height={513}
            />
          </div>
      </Link>
      <p className={styles.movieTitle}>{original_name}</p>
      {first_air_date && (
        <span className={styles.releaseYear}>
          {" "}
          ({first_air_date.substring(0, 4)})
        </span>
      )}
    </div>
  );
}
