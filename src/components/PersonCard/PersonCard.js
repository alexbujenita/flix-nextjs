import Image from "next/image";
import Link from "next/link";
import styles from "./PersonCard.module.scss";
import PropTypes from "prop-types";

function PersonCard({
  id,
  fromSearch,
  profile_path,
  original_name,
  name,
  character,
}) {
  const width = fromSearch ? 342 : parseInt(342 / 3);
  const height = fromSearch ? 513 : parseInt(523 / 3);

  return (
    <div
      className={
        fromSearch ? styles.personContainerSearch : styles.personContainer
      }
    >
      <div className={styles.personImageContainer}>
        <Link href={`/actor/${id}`} passHref>
            <Image
              src={
                profile_path
                  ? `https://image.tmdb.org/t/p/w342${profile_path}`
                  : "/image-placeholder-vertical.jpg"
              }
              alt={original_name}
              width={width}
              height={height}
            />
        </Link>
      </div>
      <div className={styles.personNames}>
        <p>
          <b>{original_name || name}</b>
        </p>
        {character ? (
          <>
            <p>as</p>{" "}
            <p>
              <i>{character}</i>
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}

PersonCard.propTypes = {
  id: PropTypes.number.isRequired,
  fromSearch: PropTypes.bool,
  profile_path: PropTypes.string,
  original_name: PropTypes.string,
  name: PropTypes.string,
  character: PropTypes.string,
};

export default PersonCard;
