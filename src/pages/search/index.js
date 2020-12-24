import axios from "axios";
import MovieCard from "../../components/MovieCard/MovieCard";
export default function Search({ data, searchOpt }) {
  // console.log(props);
  return (
    <div>
      <h1>SEARCH</h1>
      {data.results.map(m => <MovieCard key={m.id} {...m} />)}
    </div>
  );
}

export async function getServerSideProps(ctx) {
  console.log(ctx);
  const {
    query: { searchTerm, includeAdult, page = 1 },
  } = ctx;
  const normalizedSearch = searchTerm.trim().toLowerCase();
  try {
    const { data } = await axios.get(
      `http://localhost:3001/api/search?searchTerm=${normalizedSearch}&pageNum=${page}&includeAdult=${includeAdult}`
    );
    return {
      props: { data, searchOpt: { normalizedSearch, includeAdult, page } },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
}
