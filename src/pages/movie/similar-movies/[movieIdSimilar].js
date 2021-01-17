import axios from "axios";
import Link from "next/link";
import MovieCard from "../../../components/MovieCard/MovieCard";
import styles from "./SimilarMovies.module.scss";
import Head from "next/head";

export default function SimilarMovies({ data, currentMovieId }) {
  const { page, results, total_pages } = data;
  const showNav = total_pages > 1;
  const nextPage =
    parseInt(page) >= total_pages ? total_pages : parseInt(page) + 1;
  const prevPage = parseInt(page) <= 1 ? 1 : parseInt(page) - 1;
  return (
    <>
      <Head>
        <title>Search results</title>
        <meta name="description" content="Showing the search results." />
      </Head>
      <div className={styles.moviesContainer}>
        {results.map((m) => (
          <MovieCard key={m.id} {...m} />
        ))}
      </div>
      {showNav ? (
        <div className={styles.moviesNavigation}>
          <Link href={`/movie/similar-movies/${currentMovieId}?page=${prevPage}`}>
            <a>
              <h1>PREV</h1>
            </a>
          </Link>
          <Link href={`/movie/similar-movies/${currentMovieId}?page=${nextPage}`}>
            <a>
              <h1>NEXT</h1>
            </a>
          </Link>
        </div>
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
