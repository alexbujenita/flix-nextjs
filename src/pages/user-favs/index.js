import axios from "axios";
import Head from "next/head";
import { useState } from "react";
import MovieCard from "../../components/MovieCard/MovieCard";
import styles from "./userFavs.module.scss";

export default function UserFavs(props) {
  const [inProgress, setInProgress] = useState(false);

  async function downloadFavsAsPdf() {
    setInProgress(true);
    const { data } = await axios.get("http://localhost:3001/api/favs/pdf", {
      withCredentials: true,
      responseType: "blob",
    });
    const url = URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "favs.pdf");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setInProgress(false);
  }
  return (
    <>
      <Head>
        <title>Users favs</title>
        <meta
          name="description"
          content="Showing the user's favourites results."
        />
      </Head>
      <div className={styles.downloadContainer}>
        {inProgress ? (
          <>
            <h3>Please wait while for the file to download.</h3>
            <h3>Usually a minute for 50 movies.</h3>
          </>
        ) : (
          <h1 onClick={downloadFavsAsPdf} className={styles.downloadText}>
            Download your favourites as PDF
          </h1>
        )}
      </div>
      <div className={styles.moviesContainer}>
        {props.UserFavourites.map((m) => (
          <MovieCard
            key={m.id}
            poster_path={m.moviePosterPath}
            title={m.movieTitle}
            id={m.movieRefId}
          />
        ))}
      </div>
    </>
  );
}

export async function getServerSideProps(ctx) {
  if (!ctx.req.headers.cookie) {
    return { props: { error: "User not logged in" } };
  }
  try {
    const { data } = await axios.get(
      "http://localhost:3001/api/favs/user-favs",
      {
        headers: {
          Cookie: ctx.req.headers.cookie || "",
        },
        withCredentials: true,
      }
    );
    return {
      props: data,
    };
  } catch (error) {
    console.log(error);
    return {
      notFound: true,
    };
  }
}
