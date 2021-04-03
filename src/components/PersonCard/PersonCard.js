import Image from "next/image";
import Link from "next/link";
import styles from "./PersonCard.module.scss";

export default function PersonCard(props) {
  const width = props.fromSearch ? 342 : parseInt(342 / 3);
  const height = props.fromSearch ? 513 : parseInt(523 / 3);

  return (
    <div
      className={
        props.fromSearch ? styles.personContainerSearch : styles.personContainer
      }
    >
      <Link href={`/actor/${props.id}`}>
        <div className={styles.personImageContainer}>
          <a>
            <Image
              src={
                props.profile_path
                  ? `https://image.tmdb.org/t/p/w342${props.profile_path}`
                  : "/image-placeholder-vertical.jpg"
              }
              alt={props.original_name}
              width={width}
              height={height}
            />
          </a>
        </div>
      </Link>
      <div className={styles.personNames}>
        <p>
          <b>{props.original_name || props.name}</b>
        </p>
        {props.character ? (
          <>
            <p>as</p>{" "}
            <p>
              <i>{props.character}</i>
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
