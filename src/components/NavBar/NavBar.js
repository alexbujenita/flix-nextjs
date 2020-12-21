import Link from "next/link";

export default function NavBar() {
  return (
    <div>
      <Link href="/movies">
        <a>
          <h3>Movies</h3>
        </a>
      </Link>
    </div>
  );
}
