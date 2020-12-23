import axios from "axios";
import MovieCard from "../../components/MovieCard/MovieCard";
import Link from "next/link";
import Head from "next/head";
import styles from "./Movies.module.scss";

export default function Movies({ page, results }) {
  const nextPage = page >= 500 ? 500 : page + 1;
  const prevPage = page <= 1 ? 1 : page - 1;
  return (
    <>
      <Head>
        <title>Movies | Page {page}</title>
        <meta name="description" content="Movies sorted by popularity." />
      </Head>
      <div className={styles.moviesContainer}>
        {results.map((movie) => {
          return <MovieCard key={movie.id} {...movie} />;
        })}
      </div>
      <div className={styles.moviesNavigation}>
        <Link href={`/movies?page=${prevPage}`}>
          <a>
            <h1>PREV</h1>
          </a>
        </Link>
        <Link href={`/movies?page=${nextPage}`}>
          <a>
            <h1>NEXT</h1>
          </a>
        </Link>
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
      `http://localhost:3001/api/movies?page=${
        page < 1 || page > 500 ? 1 : page
      }`
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
