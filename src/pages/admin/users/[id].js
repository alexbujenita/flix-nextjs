import axios from "axios";
import Link from "next/link";
import styles from "../admin.module.scss";

export default function AdminUserInfo({ count, rows: [UserFavourites] }) {
  const favs = UserFavourites.UserFavourites;

  function deleteFav(movieId) {
    return async function () {
      if (!window.confirm("Delete a fav?")) return;
      try {
        await axios.delete(
          `http://localhost:3001/admin/users/${UserFavourites.id}/movie/${movieId}`,
          {
            withCredentials: true,
          }
        );
        window.location.reload(true);
      } catch (e) {
        console.log(e);
      }
    };
  }

  const movieRefIdSet = new Set();

  favs.forEach((fav) => {
    if (movieRefIdSet.has(fav.movieRefId)) {
      fav.isDuplicate = true;
    }
    movieRefIdSet.add(fav.movieRefId);
  });

  movieRefIdSet.clear();

  return (
    <div>
      <h2 className={styles.user}>
        User ID: {UserFavourites.id}. {UserFavourites.firstName}{" "}
        {UserFavourites.lastName} has {count} favs.
      </h2>
      <table>
        <thead>
          <tr>
            <td>DB ID</td>
            <td>TMDB ID</td>
            <td>TITLE</td>
          </tr>
        </thead>
        <tbody>
          {favs.map(({ id, movieRefId, movieTitle, isDuplicate }) => {
            return (
              <tr
                key={id}
                style={{ backgroundColor: isDuplicate ? "red" : "white" }}
              >
                <td>{id}</td>
                <td>
                  <Link href={`/movie/${movieRefId}`} passHref className={styles.userMovieLink}>
                    {movieRefId}
                  </Link>
                </td>
                <td>{movieTitle}</td>
                <td onClick={deleteFav(id)} className={styles.delete}>DELETE</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const {
    params: { id },
  } = ctx;
  try {
    const { data } = await axios.get(
      `http://localhost:3001/admin/users/${parseInt(id)}/movies`,
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
    return {
      notFound: true,
    };
  }
}
