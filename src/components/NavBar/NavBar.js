import Link from "next/link";
import { useEffect, useState } from "react";
import LogInOut from "../LogInOut/LogInOut";
import isLogged from "../../utils/isLogged";
import SearchBar from "../SearchBar/SearchBar";
import styles from "./NavBar.module.scss";

export default function NavBar() {
  const [logged, setLogged] = useState(false);
  useEffect(() => {
    const isLoggedIn = isLogged();
    if (logged !== isLoggedIn) {
      setLogged(isLoggedIn);
    }
  });
  return (
    <div className={styles.navBarContainer}>
      <Link href="/movies">
          <h3>Movies</h3>
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
