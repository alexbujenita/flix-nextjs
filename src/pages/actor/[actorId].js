import axios from "axios";
import MovieCard from "../../components/MovieCard/MovieCard";
import styles from "./Actor.module.scss";

export default function ActorInfo({ movies }) {
  console.log("BBBBBBBB");
  console.log(movies);
  return (
    <div className={styles.actorMovieContainer}>
      {movies.map((movie) => (
        <MovieCard key={movie.id} {...movie} />
      ))}
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const {
    params: { actorId },
  } = ctx;
  try {
    const [movies] = await Promise.all([
      axios.get(`http://localhost:3001/api/actor-movies/${parseInt(actorId)}`),
    ]);
    return {
      props: {
        movies: movies.data,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}
