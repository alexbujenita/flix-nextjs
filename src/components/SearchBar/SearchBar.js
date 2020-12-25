import { useState } from "react";
import { useRouter } from "next/router";
import styles from "./SearchBar.module.scss";

export default function SearchBar() {
  const [display, setDisplay] = useState(false);
  const [search, setSearch] = useState("");
  const [adult, setAdult] = useState(false);

  const router = useRouter();

  const searchResults = (e) => {
    if (e.key === "Enter" && !!search) {
      router.push(`/search?searchTerm=${search}&includeAdult=${adult}&page=1`)
    }
  }

  return (
    <div className={styles.searchContainer}>
      <h3 onClick={() => setDisplay(!display)}>
        <span>S</span>earch
      </h3>
      {display ? (
        <div className={styles.inputs}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search movies..."
            onKeyDown={(e) => searchResults(e)}
            onChange={(e) => setSearch(e.target.value)}
            value={search}
          />
          <label className="search-adult">Include adult results?</label>
          <input
            type="checkbox"
            checked={adult}
            onChange={() => setAdult(!adult)}
          />
        </div>
      ) : null}
    </div>
  );
}
