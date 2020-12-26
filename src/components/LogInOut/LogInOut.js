import { useEffect, useState } from "react";
import isLogged from "../../utils/isLogged";
import { useRouter } from "next/router";
import Link from "next/link";
import styles from "./LogInOut.module.scss";

export default function LogInOut() {
  const [logged, setLogged] = useState(false);
  useEffect(() => {
    setLogged(isLogged());
  });
  const router = useRouter();
  function clearLocalStorage() {
    localStorage.clear("LOGGED");
    router.push("/movies");
  }

  return logged ? (
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
