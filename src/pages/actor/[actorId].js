import axios from "axios";
import MovieCard from "../../components/MovieCard/MovieCard";
import Image from "next/image";
import Head from "next/head";
import styles from "./Actor.module.scss";

export default function ActorInfo({ movies, actor }) {
  console.log(actor);
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
          <h4>{actor.biography}</h4>
        </div>
      </div>
      <div className={styles.actorMovieContainer}>
        {movies.map((movie) => (
          <MovieCard key={movie.id} {...movie} />
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
