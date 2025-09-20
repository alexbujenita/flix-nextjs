import { useState } from "react";
import { useRouter } from "next/router";
import styles from "./SearchBar.module.scss";
import { ENTITIES } from "../../utils/constants";

export default function SearchBar() {
  const [display, setDisplay] = useState(false);
  const [search, setSearch] = useState("");
  const [adult, setAdult] = useState(false);
  const [entity, setEntity] = useState("movie");

  const router = useRouter();

  const searchResults = (event) => {
    if (event.key === "Enter" && search.trim()) {
      setDisplay(false);
      router.push(
        `/search?searchTerm=${encodeURIComponent(search.trim())}&includeAdult=${adult}&entity=${entity}&page=1`
      );
    }
  };

  const setSearchHandler = ({ target: { value } }) => {
    setSearch(value);
  };

  const selectInput = (e) => {
    e.target.select();
  };

  const swapEntity = () => {
    switch (entity) {
      case ENTITIES.MOVIE:
        setEntity(ENTITIES.TV);
        break;
      case ENTITIES.TV:
        setEntity(ENTITIES.PERSON);
        break;
      default:
        setEntity(ENTITIES.MOVIE);
        break;
    }
  };

  const getEntityIcon = () => {
    switch (entity) {
      case ENTITIES.MOVIE: return "🎬";
      case ENTITIES.TV: return "📺";
      case ENTITIES.PERSON: return "👤";
      default: return "🎬";
    }
  };

  return (
    <div
      className={display ? styles.searchContainerOpen : styles.searchContainer}
    >
      <h3 onClick={() => setDisplay(!display)}>
        <span>S</span>earch {entity}
      </h3>
      {display && (
        <div className={styles.inputs}>
          <div className={styles.searchInputContainer}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder={`Search for ${entity}...`}
              onKeyDown={searchResults}
              onChange={setSearchHandler}
              value={search}
              autoFocus
              onFocus={selectInput}
              aria-label={`Search for ${entity}`}
            />
            <button
              type="button"
              className={styles.entityToggle}
              onClick={swapEntity}
              title={`Switch to ${entity === ENTITIES.MOVIE ? 'TV shows' : entity === ENTITIES.TV ? 'people' : 'movies'}`}
              aria-label={`Currently searching ${entity}. Click to switch entity type.`}
            >
              {getEntityIcon()}
            </button>
          </div>
          <div className={styles.options}>
            <label className={styles.adultLabel}>
              <input
                type="checkbox"
                checked={adult}
                onChange={() => setAdult(!adult)}
                aria-describedby="adult-help"
              />
              Include adult content
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
