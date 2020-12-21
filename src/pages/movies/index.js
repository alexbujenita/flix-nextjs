import axios from "axios";
import MovieCard from "../components/NavBar/MovieCard/MovieCard";
import styles from './Movies.module.scss'
export default function Movies(props) {
  // console.log(props);
  return (
    <>
      <h1>MOVIES!</h1>
      <div className={styles.moviesContainer}>
        {props.results.map((movie) => {
          return <MovieCard key={movie.id} {...movie} />;
        })}
      </div>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const {
    query: { page = 1 },
  } = ctx;
  try {
    const { data } = await axios.get(
      `http://localhost:3001/api/movies?page=${page}`
    );
    return {
      props: data,
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}
