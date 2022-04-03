import axios from "axios";
import MovieCard from "../../components/MovieCard/MovieCard";
import Head from "next/head";
import styles from "./Movies.module.scss";
import BottomNav from "../../components/BottomNav/BottomNav";
import FilterMovies from "../../components/FilterMovies/FilterMovies";
import { buildQuery } from "./buildQuery";

export default function Movies({
  data: { page, results },
  filterOptions: {
    year,
    primaryReleaseDateLTE,
    primaryReleaseDateGTE,
    certification,
    certificationCountry,
    adult,
  },
}) {
  const nextPageNumber = page >= 500 ? 500 : page + 1;
  const prevPageNumber = page <= 1 ? 1 : page - 1;
  const nextPage = buildQuery({
    page: nextPageNumber,
    year,
    primaryReleaseDateLTE,
    primaryReleaseDateGTE,
    certification,
    certificationCountry,
    adult,
  });
  const prevPage = buildQuery({
    page: prevPageNumber,
    year,
    primaryReleaseDateLTE,
    primaryReleaseDateGTE,
    certification,
    certificationCountry,
    adult,
  });

  return (
    <>
      <Head>
        <title>Movies | Page {page}</title>
        <meta name="description" content="Movies sorted by popularity." />
      </Head>
      <FilterMovies />
      <div className={styles.moviesContainer}>
        {results.map((movie) => {
          return <MovieCard key={movie.id} {...movie} />;
        })}
      </div>
      <BottomNav prev={prevPage} next={nextPage} />
    </>
  );
}

export async function getServerSideProps(ctx) {
  const {
    query: {
      page,
      year = null,
      primaryReleaseDateLTE = null,
      primaryReleaseDateGTE = null,
      certification = null,
      certificationCountry = null,
      adult = false,
    },
  } = ctx;
  const params = {
    page,
    year,
    primaryReleaseDateLTE,
    primaryReleaseDateGTE,
    certification,
    certificationCountry,
    adult,
  };
  const finalQuery = buildQuery(params);
  try {
    const { data } = await axios.get(`http://localhost:3001/api${finalQuery}`, {
      withCredentials: true,
    });
    return {
      props: {
        data,
        filterOptions: {
          year,
          primaryReleaseDateLTE,
          primaryReleaseDateGTE,
          certification,
          certificationCountry,
          adult,
        },
      },
    };
  } catch {
    return {
      notFound: true,
    };
  }
}
