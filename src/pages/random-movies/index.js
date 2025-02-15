import axios from "axios";
import Head from "next/head";
import Card from "../../components/Card/Card";
import { useState } from "react";
import styles from "./RandomMovies.module.scss";

export default function RandomMovies({ data }) {
  const [movies, setMovies] = useState(data);
  const [btnDisable, setBtnDisable] = useState(false);

  async function refreshMovies() {
    setBtnDisable(true);
    const { data: newMovies } = await axios.get(
      "http://localhost:3001/api/random"
    );
    setMovies(newMovies);
    setBtnDisable(false);
  }
  return (
    <>
      <Head>
        <title>Random movies</title>
        <meta name="description" content="Random movies." />
      </Head>
      <div className={styles.mainContainer}>
        <button
          className={styles.refresh}
          onClick={refreshMovies}
          disabled={btnDisable}
        >
          Refresh movies
        </button>
        <div className={styles.moviesContainer}>
          {movies.map((movie) => {
            return <Card key={movie.id} {...movie} />;
          })}
        </div>
      </div>
    </>
  );
}

// Trying static page
export async function getStaticProps() {
  try {
    const { data } = await axios.get("http://localhost:3001/api/random");
    return {
      props: { data }, // https://github.com/vercel/next.js/issues/11993#issuecomment-727170741
    };
  } catch {
    return {
      notFound: true,
    };
  }
}
