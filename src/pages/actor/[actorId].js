import axios from "axios";
import Card from "../../components/Card/Card";
import Image from "next/image";
import Head from "next/head";
import styles from "./Actor.module.scss";
import { useState } from "react";
import { CONTENT_TYPE } from "../../utils/constants";

export default function ActorInfo({ movies, actor }) {
  const [sorting, setSorting] = useState(0);
  function sortBy(e) {
    switch (e.target.id) {
      case "sort-popularity":
        movies.sort((m1, m2) => m2.popularity - m1.popularity);
        break;
      case "sort-vote-avg":
        movies.sort((m1, m2) => m2.vote_average - m1.vote_average);
        break;
      case "sort-year":
        movies.sort((m1, m2) => {
          if (!m1.release_date) m1.release_date = "0000-99-99";
          if (!m2.release_date) m2.release_date = "0000-99-99";
          return (
            parseInt(m2.release_date.split("-")[0]) -
            parseInt(m1.release_date.split("-")[0])
          );
        });
        break;
      default:
        alert("Sneaky");
        break;
    }

    setSorting(sorting + 1);
  }
  return (
    <>
      <Head>
        <title>{actor.name || "Actor page"}</title>
        <meta name="description" content="Info and movies for the actor" />
      </Head>
      <div className={styles.infoContainer}>
        {actor.profile_path ? (
          <div className={styles.imageContainer}>
            <Image
              src={`https://image.tmdb.org/t/p/w342${actor.profile_path}`}
              alt={actor.name}
              width={parseInt(342 / 1.4)}
              height={parseInt(513 / 1.4)}
            />
          </div>
        ) : null}
        <div className={styles.actorInfo}>
          <h3>{actor.name}</h3>
          <h4>{actor.biography}</h4>
        </div>
      </div>
      <div className={styles.sortOptions}>
        <h1>SORT BY:</h1>
        <h1 onClick={sortBy} id="sort-popularity">
          POPULARITY
        </h1>
        <h1 onClick={sortBy} id="sort-vote-avg">
          VOTE AVERAGE
        </h1>
        <h1 onClick={sortBy} id="sort-year">
          YEAR
        </h1>
      </div>
      <div className={styles.actorMovieContainer}>
        {movies.map((movie) => (
          <Card key={movie.id} {...movie} contentType={CONTENT_TYPE.MOVIE} />
        ))}
      </div>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const {
    params: { actorId },
  } = ctx;
  try {
    const [movies, actor] = await Promise.all([
      axios.get(`http://localhost:3001/api/actor-movies/${parseInt(actorId)}`),
      axios.get(`http://localhost:3001/api/actor-info/${parseInt(actorId)}`),
    ]);
    return {
      props: {
        movies: movies.data,
        actor: actor.data,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}
