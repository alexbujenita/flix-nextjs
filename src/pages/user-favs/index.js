import axios from "axios";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import BottomNav from "../../components/BottomNav/BottomNav";
import Card from "../../components/Card/Card";
import styles from "./userFavs.module.scss";
import { CONTENT_TYPE } from "../../utils/constants";

export default function UserFavs(props) {
  const [inProgress, setInProgress] = useState(false);
  const [includeCast, setIncludeCast] = useState(false);
  const [searchFav, setSearchFav] = useState("");
  const { page, totalPages, rows } = props;
  const router = useRouter();
  const { query } = router;

  if (!rows.length) {
    return <h1>Nothing here...</h1>;
  }

  const setSearchHandler = ({ target: { value } }) => {
    setSearchFav(value);
  };

  const searchInFavs = (event) => {
    if (event.key === "Enter" && !!searchFav) {
      setSearchFav("");
      router.push(`/user-favs?page=1&searchQuery=${searchFav}`);
    }
  };

  const nextPage = page >= totalPages ? page : page + 1;
  const prevPage = page <= 1 ? 1 : page - 1;

  async function downloadFavsAsPdf() {
    setInProgress(true);
    const { data } = await axios.get(
      `http://localhost:3001/api/favs/pdf?includeCast=${includeCast}`,
      {
        withCredentials: true,
        responseType: "blob",
      }
    );
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
            <h3>Please wait for the file to download.</h3>
            <h3>Usually a minute for 50 movies.</h3>
          </>
        ) : (
          <div className={styles.downloadText}>
            <div>
              <label>Include cast?</label>
              <input
                type="checkbox"
                checked={includeCast}
                onChange={() => setIncludeCast(!includeCast)}
              />
            </div>
            <h1 onClick={downloadFavsAsPdf}>Download your favourites as PDF</h1>
          </div>
        )}
      </div>
      <div className={styles.watchedFilter}>
        <Link
          passHref
          href={`/user-favs?page=1${query.seen === "true" ? "" : `&seen=true`}`}
          className={query.seen === "true" ? styles.active : ""}
        >
          SEEN
        </Link>
        <input
          className={styles.favSearch}
          type="text"
          placeholder="Search your favs"
          value={searchFav}
          onChange={setSearchHandler}
          onKeyDown={searchInFavs}
        />
        <Link
          passHref
          href={`/user-favs?page=1${
            query.seen === "false" ? "" : `&seen=false`
          }`}
          className={query.seen === "false" ? styles.active : ""}
        >
          NOT SEEN
        </Link>
      </div>
      <div className={styles.moviesContainer}>
        {rows[0].UserFavourites.map((m) => (
          <Card
            key={m.movieRefId}
            poster_path={m.moviePosterPath}
            title={m.movieTitle}
            id={m.movieRefId}
            contentType={CONTENT_TYPE.MOVIE}
          />
        ))}
      </div>
      <BottomNav
        prev={
          `/user-favs?page=${prevPage}${
            query.seen ? `&seen=${query.seen}` : ""
          }` + (query.searchQuery ? `&searchQuery=${query.searchQuery}` : "")
        }
        next={
          `/user-favs?page=${nextPage}${
            query.seen ? `&seen=${query.seen}` : ""
          }` + (query.searchQuery ? `&searchQuery=${query.searchQuery}` : "")
        }
      />
    </>
  );
}

export async function getServerSideProps(ctx) {
  if (!ctx.req.headers.cookie) {
    return {
      notFound: true,
    };
  }
  const {
    query: { page = 1, seen = "", searchQuery },
  } = ctx;
  try {
    const { data } = await axios.get(
      `http://localhost:3001/api/favs/user-favs?page=${page}&seen=${seen}` +
        (searchQuery ? `&searchQuery=${searchQuery}` : ""),
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
