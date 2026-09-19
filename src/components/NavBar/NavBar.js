import Link from "next/link";
import LogInOut from "../LogInOut/LogInOut";
import SearchBar from "../SearchBar/SearchBar";
import styles from "./NavBar.module.scss";
import useLoginState from "../../utils/useLoginState";

export default function NavBar() {
  const logged = useLoginState();

  return (
    <div className={styles.navBarContainer}>
      <Link href="/movies">
        <h3>Movies</h3>
      </Link>
      <Link href="/tv">
        <h3>TV</h3>
      </Link>
      <Link href="/random-movies">
        <h3>RaNDom</h3>
      </Link>
      {logged && (
        <Link href="/user-favs">
          <h3>FAVS</h3>
        </Link>
      )}
      <SearchBar />
      <LogInOut name={logged} />
    </div>
  );
}
