import axios from "axios";
import Head from "next/head";
import Image from "next/image";
import styles from "../../TV.module.scss";
import Card from "../../../../components/Card/Card";
import { CONTENT_TYPE } from "../../../../utils/constants";

export default function Series({ tvSeries }) {
  const {
    poster_path,
    first_air_date,
    genres,
    name,
    original_name,
    number_of_episodes,
    number_of_seasons,
    seasons,
    overview,
    id,
  } = tvSeries;

  const hasSeasons = seasons && seasons.length > 0;
  if (!hasSeasons) {
    return <h1>Seasons not found</h1>;
  }

  const title = name ?? original_name;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Overview of a series." />
      </Head>
      <div>
        <div className={styles.intro}>
          <div>
            {poster_path ? (
              <Image
                src={`https://image.tmdb.org/t/p/w342${poster_path}`}
                alt={title}
                width={342}
                height={513}
              />
            ) : null}
          </div>
          <div className={styles.introInfo}>
            <h1>
              {title}
              {first_air_date
                ? ` (first aired in ${first_air_date.substring(0, 4)})`
                : null}
            </h1>
            {overview ? <p>{overview}</p> : null}
            {genres && genres.length > 0 ? (
              <p>
                Genres:{" "}
                {genres.map((genre) => (
                  <span key={genre.id}>{genre.name} </span>
                ))}
              </p>
            ) : null}
            {number_of_seasons ? (
              <p>
                Seasons: {number_of_seasons} | Episodes: {number_of_episodes}
              </p>
            ) : null}
          </div>
        </div>
        <div className={styles.seasonContainer}>
          {seasons.map((season) => (
            <Card
              key={season.id}
              {...season}
              contentType={CONTENT_TYPE.TV_SERIES_SEASON}
              seriesId={id}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const {
    params: { seriesId },
  } = ctx;
  try {
    const { data } = await axios.get(
      `http://localhost:3001/api/tv/${parseInt(seriesId)}`
    );
    return {
      props: {
        tvSeries: data,
      },
    };
  } catch (error) {
    console.error(error);
    return {
      notFound: true,
    };
  }
}
