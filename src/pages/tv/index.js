import axios from "axios";
import Head from "next/head";
import { buildQuery } from "../../lib/buildQuery";
import BottomNav from "../../components/BottomNav/BottomNav";
import Card from "../../components/Card/Card";
import styles from "../../styles/CardContainer.module.scss";
import { CONTENT_TYPE } from "../../utils/constants";

export default function Tv({
  data: { page, results },
  filterOptions: { year, adult },
}) {

  const nextPageNumber = page >= 500 ? 500 : page + 1;
  const prevPageNumber = page <= 1 ? 1 : page - 1;
  const nextPage = buildQuery(
    {
      page: nextPageNumber,
      adult,
    },
    true
  );
  const prevPage = buildQuery(
    {
      page: prevPageNumber,
      adult,
    },
    true
  );
  return (
    <>
      <Head>
        <title>TV | Page {page}</title>
        <meta name="description" content="Tv series sorted by popularity." />
      </Head>
      <div className={styles.cardContainer}>
        {results.map((tvSeries) => {
          return <Card key={tvSeries.id} {...tvSeries} contentType={CONTENT_TYPE.TV_SERIES} />;
        })}
      </div>
      <BottomNav prev={prevPage} next={nextPage} />
    </>
  );
}

export async function getServerSideProps(ctx) {
  const {
    query: { page, adult = false },
  } = ctx;
  const params = {
    page,
    adult,
  };
  const finalQuery = buildQuery(params, true);

  try {
    const { data } = await axios.get(`http://localhost:3001/api${finalQuery}`, {
      withCredentials: true,
    });
    return {
      props: {
        data,
        filterOptions: {
          adult,
        },
      },
    };
  } catch (error) {
    console.error(error);
    return {
      notFound: true,
    };
  }
}
