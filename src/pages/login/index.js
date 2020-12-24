import { useState } from "react";
import Head from "next/head";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const handleChange = (event) => {
    console.log(event.target.name);
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
            <b>Username</b>
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

        <div className="container">
          <button type="button">Cancel</button>
          <span>
            Forgot <a href="#">password?</a>
          </span>
        </div>
      </form>
    </>
  );
}
