import Image from "next/image";
import Link from "next/link";
import AddRemoveIcon from "../AddRemoveIcon/AddRemoveIcon";
import styles from "../../styles/Card.module.scss";
import { CONTENT_TYPE } from "../../utils/constants";

/**
 * MovieCard component is used to display a movie card.
 * @param {Object} props - The movie object that will be displayed.
 * @param {boolean} isTvSeries - A boolean value to check if the movie is a tv series. If it is a tv series, the AddRemoveIcon component will not be rendered.
 * @returns {JSX.Element} - Returns the MovieCard component.
 * @example
 * <MovieCard movie={movie} />
 * @returns
 */
export default function Card(props) {
  const { poster_path, release_date, contentType } = props;

  console.log({ props, inCard: true });

  const link = getCardLink(props);
  const title = getTitle(props);

  return (
    <div className={styles.movieCard}>
      <AddRemoveIcon movie={props} contentType={contentType} />
      <Link href={link}>
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
      {release_date && (
        <span className={styles.releaseYear}>
          {" "}
          ({release_date.substring(0, 4)})
        </span>
      )}
    </div>
  );
}

function getTitle(movieOrTvSeries) {
  return movieOrTvSeries.title || movieOrTvSeries.original_name || movieOrTvSeries.name;
}

function getCardLink(props) {
  const { id, contentType } = props
  switch (contentType) {
    case CONTENT_TYPE.MOVIE:
      return `/movie/${id}`;
    case CONTENT_TYPE.TV_SERIES:
      return `/tv/series/${id}`;
    case CONTENT_TYPE.TV_SERIES_SEASON:
      const {season_number, seriesId} = props;
      return `/tv/series/${seriesId}/season/${season_number}`;
    default:
      return `/movie/${id}`;
  }
}
