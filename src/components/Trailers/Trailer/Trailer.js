import styles from "./Trailer.module.scss";

export default function Trailer({ trailer }) {
  return (
    <div className={styles.youtubeVideo}>
      <iframe
        src={`https://www.youtube.com/embed/${trailer.key}`}
        frameBorder="0"
        width="320"
        height="180"
        allow="autoplay; encrypted-media"
        allowFullScreen
        title="video"
      />
    </div>
  );
}
