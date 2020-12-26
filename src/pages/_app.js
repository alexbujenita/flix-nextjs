import "../styles/globals.css";
import NavBar from "../components/NavBar/NavBar";

function MyApp({ Component, pageProps }) {
  // console.log("_app", Component, pageProps)
  return (
    <>
      <NavBar />
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
