import { useRouter } from "next/router";
import Link from "next/link";
import styles from "./LogInOut.module.scss";

export default function LogInOut({ name }) {

  const router = useRouter();
  function clearLocalStorage() {
    localStorage.clear("LOGGED");
    router.push("/movies");
  }

  return name ? (
    <h3 onClick={clearLocalStorage}>LOGOUT</h3>
  ) : (
    <div className={styles.logOrRegister}>
      <Link href="/login">
        <h3>LOGIN</h3>
      </Link>
      <h2>&nbsp; / &nbsp;</h2>
      <Link href="/register">
        <h3>REGISTER</h3>
      </Link>
    </div>
  );
}
