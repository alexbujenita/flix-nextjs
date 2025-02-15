import axios from "axios";
import Card from "../../components/Card/Card";
import Head from "next/head";
import styles from "../../styles/CardContainer.module.scss";
import BottomNav from "../../components/BottomNav/BottomNav";
import FilterMovies from "../../components/FilterMovies/FilterMovies";
import { buildQuery } from "../../lib/buildQuery";
import { CONTENT_TYPE } from "../../utils/constants";

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
      <div className={styles.cardContainer}>
        {results.map((movie) => {
          return <Card key={movie.id} {...movie} contentType={CONTENT_TYPE.MOVIE} />;
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
