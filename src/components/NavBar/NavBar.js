import Link from "next/link";
import SearchBar from "../SearchBar/SearchBar";
import styles from "./NavBar.module.scss";

export default function NavBar() {
  return (
    <div className={styles.navBarContainer}>
      <Link href="/movies">
        <a>
          <h3>Movies</h3>
        </a>
      </Link>
      <SearchBar />
    </div>
  );
}
