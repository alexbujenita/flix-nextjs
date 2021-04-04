import PropTypes from "prop-types";
import axios from "axios";
import MovieCard from "../../components/MovieCard/MovieCard";
import styles from "./Search.module.scss";
import Head from "next/head";
import BottomNav from "../../components/BottomNav/BottomNav";
import PersonCard from "../../components/PersonCard/PersonCard";

export default function Search({ data, searchOpt }) {
  const { page, normalizedSearch, includeAdult, entity } = searchOpt;
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
        {entity === "movie"
          ? data.results.map((entry) => <MovieCard key={entry.id} {...entry} />)
          : data.results.map((entry) => (
              <PersonCard key={entry.id} {...entry} fromSearch />
            ))}
      </div>
      {showNav ? (
        <BottomNav
          prev={`/search?searchTerm=${normalizedSearch}&includeAdult=${includeAdult}&entity=${entity}&page=${prevPage}`}
          next={`/search?searchTerm=${normalizedSearch}&includeAdult=${includeAdult}&entity=${entity}&page=${nextPage}`}
        />
      ) : null}
    </>
  ) : (
    <h1 className={styles.searchNotFound}>
      Nothing found, try a different search term
    </h1>
  );
}

Search.propTypes = {
  data: PropTypes.shape({
    page: PropTypes.number.isRequired,
    results: PropTypes.arrayOf(PropTypes.object).isRequired,
    total_pages: PropTypes.number.isRequired,
    total_results: PropTypes.number.isRequired,
  }),
};

export async function getServerSideProps(ctx) {
  const {
    query: { searchTerm, includeAdult, page = 1, entity },
  } = ctx;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  try {
    const { data } = await axios.get(
      `http://localhost:3001/api/search/${entity}?searchTerm=${normalizedSearch}&pageNum=${page}&includeAdult=${includeAdult}`
    );
    return {
      props: {
        data,
        searchOpt: { normalizedSearch, includeAdult, page, entity },
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}
