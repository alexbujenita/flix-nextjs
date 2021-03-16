import axios from "axios";
import MovieCard from "../../../components/MovieCard/MovieCard";
import styles from "./SimilarMovies.module.scss";
import Head from "next/head";
import BottomNav from "../../../components/BottomNav/BottomNav";

export default function SimilarMovies({ data, currentMovieId }) {
  const { page, results, total_pages } = data;
  const showNav = total_pages > 1;
  const nextPage =
    parseInt(page) >= total_pages ? total_pages : parseInt(page) + 1;
  const prevPage = parseInt(page) <= 1 ? 1 : parseInt(page) - 1;
  return (
    <>
      <Head>
        <title>Similar movies</title>
        <meta name="description" content="Showing similar results." />
      </Head>
      <div className={styles.moviesContainer}>
        {results.map((m) => (
          <MovieCard key={m.id} {...m} />
        ))}
      </div>
      {showNav ? (
        <BottomNav
          prev={`/movie/similar-movies/${currentMovieId}?page=${prevPage}`}
          next={`/movie/similar-movies/${currentMovieId}?page=${nextPage}`}
        />
      ) : null}
    </>
  );
}

export async function getServerSideProps(ctx) {
  const {
    query: { page = 1 },
    params: { movieIdSimilar },
  } = ctx;
  try {
    const {
      data,
    } = await axios.get(
      `http://localhost:3001/api/movie/${movieIdSimilar}/similar?pageNum=${page}`,
      { withCredentials: true }
    );
    return {
      props: { data, currentMovieId: movieIdSimilar },
    };
  } catch {
    return {
      notFound: true,
    };
  }
}
