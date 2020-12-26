import { useState } from "react";
import Head from "next/head";
import axios from "axios";
import { useRouter } from "next/router";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const handleChange = (event) => {
    if (event.target.name === "email") {
      setEmail(event.target.value);
    } else {
      setPassword(event.target.value);
    }
  };
  const formSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post(
        "http://localhost:3001/api/auth/login",
        { email, password },
        { withCredentials: true }
      );
      localStorage.setItem("LOGGED", "IN");
      router.push("/movies");
    } catch {
      localStorage.removeItem("LOGGED");
      alert("SOMETHIGN WRONG");
    }
  };
  return (
    <>
      <Head>
        <title>LOGIN</title>
        <meta name="description" content="A login page" />
      </Head>
      <form onSubmit={formSubmit}>
        <div className="container">
          <label>
            <b>Email</b>
          </label>
          <input
            value={email}
            type="text"
            onChange={handleChange}
            placeholder="Enter Email"
            name="email"
            required
          />

          <label>
            <b>Password</b>
          </label>
          <input
            type="text"
            placeholder="Enter Password"
            value={password}
            onChange={handleChange}
            name="psw"
            required
          />

          <button type="submit">Login</button>
        </div>
      </form>
    </>
  );
}
