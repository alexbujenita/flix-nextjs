import axios from "axios";
import { getUserFavs, setUserFavs } from "../../utils/userFavs";

/**
 * Adds the movie to the DB as the current user's fav
 * @param {Number} movieId
 * @param {String} movieTitle
 * @param {String} moviePosterPath
 */
export async function addMovieToFavs(movieId, movieTitle, moviePosterPath) {
  try {
    await axios.post(
      "http://localhost:3001/api/favs",
      {
        movieRefId: movieId,
        movieTitle: movieTitle,
        moviePosterPath: moviePosterPath || "",
      },
      { withCredentials: true },
    );
    setUserFavs([...getUserFavs(), movieId]);
  } catch (error) {
    console.log(error);
    alert("Try again later...");
  }
}

/**
 * Removes the movie fav from the DB
 * @param {Number} movieId
 */
export async function removeMovieFromFavs(movieId) {
  try {
    await axios.delete(`http://localhost:3001/api/favs/${movieId}`, {
      withCredentials: true,
    });
    setUserFavs(getUserFavs().filter((id) => id !== movieId));
  } catch (error) {
    console.log(error);
    alert("Try again later...");
  }
}
