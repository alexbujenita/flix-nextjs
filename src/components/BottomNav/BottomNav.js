import Link from "next/link";
import styles from "./BottomNav.module.scss";

export default function BottomNav({ prev, next }) {
  return (
    <div className={styles.moviesNavigation}>
      <Link href={prev}>
        <a>
          <h1>PREV</h1>
        </a>
      </Link>
      <Link href={next}>
        <a>
          <h1>NEXT</h1>
        </a>
      </Link>
    </div>
  );
}
