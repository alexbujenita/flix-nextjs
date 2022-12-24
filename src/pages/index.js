import Head from "next/head";
import Link from "next/link";
import styles from "../styles/Home.module.scss";

export default function Home() {
  return (
    <>
      <Head>
        <title>MyFlix</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <h1>Welcome to My Flix.</h1>
        <h2>
          Start browsing{" "}
          <Link className={styles.homepageLink} href="/movies">
            movies
          </Link>{" "}
          right away.
        </h2>
        <h2>
          Or{" "}
          <Link className={styles.homepageLink} href="/register">
          create
          </Link>{" "}
          a free account to save a personal list of favourites.
        </h2>
        <h2>
          Have an account already?{" "}
          <Link className={styles.homepageLink} href="/login">
            Log in!
          </Link>
        </h2>
      </main>
    </>
  );
}
