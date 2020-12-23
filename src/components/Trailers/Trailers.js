import { useState } from "react";
import Trailer from "./Trailer/Trailer";
import styles from "./Trailers.module.scss";

export default function Trailers({ trailers }) {
  const [showTrailers, setShowTrailers] = useState(false);
  return (
    <>
      {!showTrailers && (
        <h2
          className={styles.showHideTrailers}
          onClick={() => setShowTrailers(true)}
        >
          SHOW TRAILERS
        </h2>
      )}
      {showTrailers && (
        <h2
          className={styles.showHideTrailers}
          onClick={() => setShowTrailers(false)}
        >
          HIDE TRAILERS
        </h2>
      )}
      {showTrailers && (
        <div className={styles.trailersContainer}>
          {trailers.map((trailer) => (
            <Trailer key={trailer.id} trailer={trailer} />
          ))}
        </div>
      )}
    </>
  );
}
