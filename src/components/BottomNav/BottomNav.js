import Link from "next/link";
import styles from "./BottomNav.module.scss";

export default function BottomNav({ prev, next }) {
  return (
    <div className={styles.moviesNavigation}>
      <Link href={prev}>
          <h1>PREV</h1>
      </Link>
      <Link href={next}>
          <h1>NEXT</h1>
      </Link>
    </div>
  );
}
