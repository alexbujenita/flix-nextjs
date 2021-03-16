import axios from "axios";
import MovieCard from "../../components/MovieCard/MovieCard";
import styles from "./Search.module.scss";
import Head from "next/head";
import BottomNav from "../../components/BottomNav/BottomNav";

export default function Search({ data, searchOpt }) {
  const { page, normalizedSearch, includeAdult } = searchOpt;
  const showNav = data.total_pages > 1;
  const nextPage =
    parseInt(page) >= data.total_pages ? data.total_pages : parseInt(page) + 1;
  const prevPage = parseInt(page) <= 1 ? 1 : parseInt(page) - 1;

  const searchDataAvailable = !!data.results.length;
  return searchDataAvailable ? (
    <>
      <Head>
        <title>Search results</title>
        <meta name="description" content="Showing the search results." />
      </Head>
      <div className={styles.moviesContainer}>
        {data.results.map((m) => (
          <MovieCard key={m.id} {...m} />
        ))}
      </div>
      {showNav ? (
        <BottomNav
          prev={`/search?searchTerm=${normalizedSearch}&includeAdult=${includeAdult}&page=${prevPage}`}
          next={`/search?searchTerm=${normalizedSearch}&includeAdult=${includeAdult}&page=${nextPage}`}
        />
      ) : null}
    </>
  ) : (
    <h1 className={styles.searchNotFound}>
      Nothing found, try a different search term
    </h1>
  );
}

export async function getServerSideProps(ctx) {
  const {
    query: { searchTerm, includeAdult, page = 1 },
  } = ctx;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  try {
    const { data } = await axios.get(
      `http://localhost:3001/api/search?searchTerm=${normalizedSearch}&pageNum=${page}&includeAdult=${includeAdult}`
    );
    return {
      props: { data, searchOpt: { normalizedSearch, includeAdult, page } },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}
