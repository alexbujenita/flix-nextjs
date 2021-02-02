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
          <Link href="/movies">
            <a className={styles.homepageLink}>movies</a>
          </Link>{" "}
          right away.
        </h2>
        <h2>
          Or{" "}
          <Link href="/register">
            <a className={styles.homepageLink}>create</a>
          </Link>{" "}
          a free account to save a personal list of favourites.
        </h2>
        <h2>
          Have an account already?{" "}
          <Link href="/login">
            <a className={styles.homepageLink}>Log in!</a>
          </Link>
        </h2>
      </main>
    </>
  );
}
