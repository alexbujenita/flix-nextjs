import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import ActorInfo from "../../../src/pages/actor/[actorId]";
import { makeMovie } from "../../fixtures/movie";
import { makePerson } from "../../fixtures/person";
import { renderWithRouter } from "../../helpers/render";

function cardOrder(): readonly (string | null)[] {
  return screen.queryAllByRole("link").map((link) => link.getAttribute("href"));
}

describe("actor page render body", () => {
  it("renders the portrait, biography, and one card per filmography entry", () => {
    const actor = makePerson({
      biography: "Played every fixture role there is.",
      name: "Fixture Actor",
      profile_path: "/fixture-actor.jpg",
    });
    const movies = [
      makeMovie({ id: 11, title: "First Film" }),
      makeMovie({ id: 22, title: "Second Film" }),
    ];

    renderWithRouter(<ActorInfo movies={movies} actor={actor} />);

    const portrait = screen.getByAltText("Fixture Actor");
    expect(portrait).toBeVisible();
    expect(decodeURIComponent(portrait.getAttribute("src") ?? "")).toContain(
      "https://image.tmdb.org/t/p/w342/fixture-actor.jpg",
    );
    expect(
      screen.getByRole("heading", { name: "Fixture Actor" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Played every fixture role there is.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("First Film")).toBeInTheDocument();
    expect(screen.getByText("Second Film")).toBeInTheDocument();
    expect(cardOrder()).toEqual(["/movie/11", "/movie/22"]);
  });

  it("omits the portrait container when the actor has no profile path", () => {
    const actor = makePerson({ name: "Faceless Fixture", profile_path: "" });

    renderWithRouter(<ActorInfo movies={[]} actor={actor} />);

    expect(screen.queryByAltText("Faceless Fixture")).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Faceless Fixture" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "SORT BY:" })).toBeVisible();
    expect(cardOrder()).toEqual([]);
  });

  it("titles the page with the placeholder when the actor has no name", () => {
    renderWithRouter(
      <ActorInfo
        movies={[]}
        actor={makePerson({ name: "", profile_path: "" })}
      />,
    );

    expect(document.title).toBe("Actor page");
    expect(screen.getByRole("heading", { name: "SORT BY:" })).toBeVisible();
  });

  it("reorders the cards by descending vote average", async () => {
    const user = userEvent.setup();
    const movies = [
      makeMovie({ id: 11, title: "Poorly Rated", vote_average: 3.1 }),
      makeMovie({ id: 22, title: "Highly Rated", vote_average: 9.4 }),
      makeMovie({ id: 33, title: "Middling", vote_average: 6.2 }),
    ];
    renderWithRouter(<ActorInfo movies={movies} actor={makePerson()} />);

    await user.click(screen.getByRole("heading", { name: "VOTE AVERAGE" }));

    expect(cardOrder()).toEqual(["/movie/22", "/movie/33", "/movie/11"]);
    expect(movies.map(({ id }) => id)).toEqual([22, 33, 11]);
  });

  it("reorders by descending release year and back-fills a missing release date", async () => {
    const user = userEvent.setup();
    const undated = makeMovie({
      id: 33,
      release_date: "",
      title: "Undated Film",
    });
    const movies = [
      makeMovie({ id: 11, release_date: "1999-05-01", title: "Old Film" }),
      undated,
      makeMovie({ id: 22, release_date: "2024-01-15", title: "New Film" }),
    ];
    renderWithRouter(<ActorInfo movies={movies} actor={makePerson()} />);

    await user.click(screen.getByRole("heading", { name: "YEAR" }));

    expect(cardOrder()).toEqual(["/movie/22", "/movie/11", "/movie/33"]);
    // The sort comparator mutates the entry in place rather than defaulting a
    // local, so the sentinel survives on the caller's object.
    expect(undated.release_date).toBe("0000-99-99");
  });

  it("back-fills the sentinel when the undated film is the comparator's second argument", async () => {
    const user = userEvent.setup();
    const undated = makeMovie({
      id: 33,
      release_date: "",
      title: "Undated Film",
    });
    const movies = [
      undated,
      makeMovie({ id: 22, release_date: "2024-01-15", title: "New Film" }),
    ];
    renderWithRouter(<ActorInfo movies={movies} actor={makePerson()} />);

    await user.click(screen.getByRole("heading", { name: "YEAR" }));

    expect(cardOrder()).toEqual(["/movie/22", "/movie/33"]);
    expect(undated.release_date).toBe("0000-99-99");
  });

  it("alerts and leaves the order untouched when the click target carries no sort id", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const movies = [
      makeMovie({ id: 11, popularity: 1, title: "First Film" }),
      makeMovie({ id: 22, popularity: 99, title: "Second Film" }),
    ];
    renderWithRouter(<ActorInfo movies={movies} actor={makePerson()} />);
    const popularityHeading = screen.getByRole("heading", {
      name: "POPULARITY",
    });
    // The default arm is unreachable through the shipped markup because every
    // clickable heading carries a sort id; stripping the id is the only way to
    // exercise the guard the source already ships.
    popularityHeading.removeAttribute("id");

    await user.click(popularityHeading);

    expect(alertSpy).toHaveBeenCalledWith("Sneaky");
    expect(cardOrder()).toEqual(["/movie/11", "/movie/22"]);
  });
});
