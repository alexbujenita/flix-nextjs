import { useRouter } from "next/router";
import Link from "next/link";
import axios from "axios";
import styles from "./LogInOut.module.scss";

export default function LogInOut({ name }) {
  const router = useRouter();
  async function logoutUser() {
    try {
      await axios.delete("http://localhost:3001/api/auth/logout", {
        withCredentials: true,
      });
      localStorage.clear("LOGGED");
      localStorage.clear("UserFavs");
      router.push("/movies");
    } catch (error) {
      console.log(error);
      alert("Retry.");
    }
  }

  return name ? (
    <h3 className={styles.elements} onClick={logoutUser}>
      LOGOUT
    </h3>
  ) : (
    <div className={styles.logOrRegister}>
      <Link href="/login" passHref>
        <h3 className={styles.elements}>LOGIN</h3>
      </Link>
      <h2>&nbsp; / &nbsp;</h2>
      <Link href="/register" passHref>
        <h3 className={styles.elements}>REGISTER</h3>
      </Link>
    </div>
  );
}
