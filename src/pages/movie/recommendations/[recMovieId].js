import axios from "axios";
import Card from "../../../components/Card/Card";
import styles from "./Recommendations.module.scss";
import Head from "next/head";
import BottomNav from "../../../components/BottomNav/BottomNav";

export default function Recommendations({ data, currentMovieId }) {
  const { page, results, total_pages } = data;
  const showNav = total_pages > 1;
  const nextPage =
    parseInt(page) >= total_pages ? total_pages : parseInt(page) + 1;
  const prevPage = parseInt(page) <= 1 ? 1 : parseInt(page) - 1;
  return (
    <>
      <Head>
        <title>Recommended movies</title>
        <meta name="description" content="Showing recommended results." />
      </Head>
      <div className={styles.moviesContainer}>
        {results.map((m) => (
          <Card key={m.id} {...m} />
        ))}
      </div>
      {showNav ? (
        <BottomNav
          prev={`/movie/recommendations/${currentMovieId}?page=${prevPage}`}
          next={`/movie/recommendations/${currentMovieId}?page=${nextPage}`}
        />
      ) : null}
    </>
  );
}

export async function getServerSideProps(ctx) {
  const {
    query: { page = 1 },
    params: { recMovieId },
  } = ctx;
  try {
    const {
      data,
    } = await axios.get(
      `http://localhost:3001/api/movie/${recMovieId}/recommendations?pageNum=${page}`,
      { withCredentials: true }
    );
    return {
      props: { data, currentMovieId: recMovieId },
    };
  } catch {
    return {
      notFound: true,
    };
  }
}
