import axios from "axios";
import Head from "next/head";
import { useState } from "react";
import AddRemoveFav from "../../components/AddRemoveFav/AddRemoveFav";
import PersonCard from "../../components/PersonCard/PersonCard";
import Trailers from "../../components/Trailers/Trailers";
import styles from "./Movie.module.scss";

export default function Movie(props) {
  const { credits, movie, trailers } = props;

  const [displayCast, setDisplayCast] = useState(false);


  return (
    <>
      <Head>
        <title>{movie.title || movie.original_title}</title>
        <meta
          name="description"
          content={`Overall information for the movie ${
            movie.title || movie.original_title
          }`}
        />
      </Head>
      <div className={styles.movieIntroContainer}>
        <div className={styles.movieIntro}>
          <h1>{movie.title || movie.original_title}</h1>
          {movie.tagline ? (
            <h2>
              <i>{movie.tagline}</i>
            </h2>
          ) : null}
          {movie.overview ? <h3>{movie.overview}</h3> : null}
        </div>
      </div>
      <AddRemoveFav movie={movie} />
      {trailers?.results?.length ? (
        <Trailers trailers={trailers.results} />
      ) : null}
      {credits?.cast?.length && !displayCast && (
        <h2
          className={styles.showHideCast}
          onClick={() => setDisplayCast(true)}
        >
          SHOW CAST
        </h2>
      )}
      {displayCast && (
        <h2
          className={styles.showHideCast}
          onClick={() => setDisplayCast(false)}
        >
          HIDE CAST
        </h2>
      )}
      {displayCast ? (
        <div className={styles.movieCastContainer}>
          {credits.cast.map((person) => (
            <PersonCard key={person.id} {...person} />
          ))}
        </div>
      ) : null}
    </>
  );
}

export async function getServerSideProps(ctx) {
  const {
    params: { movieId },
  } = ctx;
  try {
    const [movie, credits, trailers] = await Promise.all([
      axios.get(`http://localhost:3001/api/movie/${parseInt(movieId)}`),
      axios.get(`http://localhost:3001/api/credits/${parseInt(movieId)}`),
      axios.get(`http://localhost:3001/api/trailers/${parseInt(movieId)}`),
    ]);
    return {
      props: {
        movie: movie.data,
        credits: credits.data,
        trailers: trailers.data,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}
