import axios from "axios";
import Link from "next/link";
import styles from "../admin.module.scss";

export default function Admin({ count, rows }) {
  return (
    <div>
      <h1>Found {count} users.</h1>
      <ul className={styles.userList}>
        {rows.map(({ id, firstName, lastName = "Missing Last-Name" }) => (
          <Link href={`/admin/users/${id}`} key={id}>
            <li className={styles.user}>
              ID: {id}. {firstName} {lastName}
            </li>
          </Link>
        ))}
      </ul>
    </div>
  );
}

export async function getServerSideProps(ctx) {
  if (!ctx.req.headers.cookie) {
    return {
      notFound: true,
    };
  }

  try {
    const { data } = await axios.get("http://localhost:3001/admin/users", {
      headers: {
        Cookie: ctx.req.headers.cookie || "",
      },
      withCredentials: true,
    });
    return {
      props: data,
    };
  } catch (error) {
    console.log(error);
    return {
      notFound: true,
    };
  }
}
