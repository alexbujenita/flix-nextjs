import { useState } from "react";
import Head from "next/head";
import axios from "axios";
import { useRouter } from "next/router";
import styles from './Register.module.scss';

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [surname, setSurname] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const handleChange = (event) => {
    switch (event.target.name) {
      case "firstname":
        setFirstName(event.target.value);
        break;
      case "surname":
        setSurname(event.target.value);
        break;
      case "email":
        setEmail(event.target.value);
        break;

      default:
        setPassword(event.target.value);
        break;
    }
  };
  const formSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post(
        "http://localhost:3001/api/auth/register",
        { firstName, lastName: surname, email, password },
        { withCredentials: true }
      );
      router.push("/login");
    } catch {
      alert("SOMETHING WRONG");
    }
  };
  return (
    <>
      <Head>
        <title>Register</title>
        <meta name="description" content="A register page." />
      </Head>
      <form onSubmit={formSubmit}>
        <section className={styles.registerContainer}>
        <div className={styles.registerDetails}>
          <label>
            <b>First Name</b>
          </label>
          <input
            value={firstName}
            type="text"
            onChange={handleChange}
            placeholder="Enter Name"
            name="firstname"
            required
          />
        </div>

        <div className={styles.registerDetails}>
          <label>
            <b>Last Name</b>
          </label>
          <input
            type="text"
            placeholder="Enter Surname"
            value={surname}
            onChange={handleChange}
            name="surname"
            required
          />
        </div>
        <div className={styles.registerDetails}>
          <label>
            <b>Email</b>
          </label>
          <input
            value={email}
            type="email"
            onChange={handleChange}
            placeholder="Enter Email"
            name="email"
            required
          />
        </div>
        <div className={styles.registerDetails}>
          <label>
            <b>Password</b>
          </label>
          <input
            type="password"
            placeholder="Enter Password"
            value={password}
            onChange={handleChange}
            name="psw"
            required
          />
        </div>
          <button type="submit" className={styles.registerButton}>Register</button>
        </section>
      </form>
    </>
  );
}
