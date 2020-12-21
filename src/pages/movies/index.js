import axios from "axios";

export default function Movies(props) {
  console.log(props);
  return (
    <div>
      <h1>MOVIES!</h1>
    </div>
  );
}

export async function getServerSideProps(ctx) {
  const { query: { page = 1 } } = ctx;
  try {
    const { data } = await axios.get(`http://localhost:3001/api/movies?page=${page}`);
    return {
      props: data,
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}
