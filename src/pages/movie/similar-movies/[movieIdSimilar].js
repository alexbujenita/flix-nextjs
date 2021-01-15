import axios from "axios";
import Link from "next/link";
import MovieCard from "../../../components/MovieCard/MovieCard";
import styles from "./SimilarMovies.module.scss";
import Head from "next/head";

export default function SimilarMovies(props) {
  console.log(props)
  const {page, results, total_pages} = props;
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
          <Link
            href={`/`}
          >
            <a>
              <h1>PREV</h1>
            </a>
          </Link>
          <Link
            href={`/`}
          >
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
    params: { movieIdSimilar },
  } = ctx;
  console.log(movieIdSimilar)
  try {
    const { data } = await axios.get(
      `http://localhost:3001/api/movie/${movieIdSimilar}/similar`,
      { withCredentials: true }
    );
    return {
      props: data,
    };
  } catch {
    return {
      notFound: true,
    };
  }
}