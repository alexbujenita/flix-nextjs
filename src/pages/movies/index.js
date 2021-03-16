import axios from "axios";
import MovieCard from "../../components/MovieCard/MovieCard";
import Head from "next/head";
import styles from "./Movies.module.scss";
import BottomNav from "../../components/BottomNav/BottomNav";

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
      <BottomNav
        prev={`/movies?page=${prevPage}`}
        next={`/movies?page=${nextPage}`}
      />
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
      }`,
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
