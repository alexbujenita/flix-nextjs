import axios from "axios";
import Head from "next/head";
import MovieCard from "../../components/MovieCard/MovieCard";
import styles from "./userFavs.module.scss"

export default function UserFavs(props) {
  console.log(props);
  return (<>
        <Head>
        <title>Users favs</title>
        <meta name="description" content="Showing the user's favourites results." />
      </Head>
      <div className={styles.moviesContainer}>
        {props.UserFavourites.map((m) => (
          <MovieCard key={m.id} poster_path={m.moviePosterPath} title={m.movieTitle} id={m.movieRefId} />
        ))}
      </div>
  </>);
}

export async function getServerSideProps(ctx) {
  // console.log(ctx.req.headers);
  if (!ctx.req.headers.cookie) {
    return { props: { error: "User not logged in" } };
  }
  try {
    const { data } = await axios.get(
      'http://localhost:3001/api/favs/user-favs',
      {
        headers: {
          Authorization: `Bearer ${ctx.req.headers.cookie}`,
          cookie: ctx.req.headers.cookie || "",
        },
      },
      { withCredentials: true }
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
