import { makeMovie, type Movie } from "./movie";

export type Person = {
  readonly adult: boolean;
  readonly also_known_as: readonly string[];
  readonly biography: string;
  readonly birthday: string;
  readonly character: string;
  readonly deathday: string | null;
  readonly fromSearch: boolean;
  readonly gender: number;
  readonly homepage: string;
  readonly id: number;
  readonly imdb_id: string;
  readonly known_for: readonly Movie[];
  readonly known_for_department: string;
  readonly name: string;
  readonly original_name: string;
  readonly place_of_birth: string;
  readonly popularity: number;
  readonly profile_path: string;
};

const defaults: Person = {
  adult: false,
  also_known_as: ["Test Performer"],
  biography: "A fully populated person fixture.",
  birthday: "1985-04-12",
  character: "Alex Hero",
  deathday: null,
  fromSearch: false,
  gender: 1,
  homepage: "https://example.com/fixture-actor",
  id: 101,
  imdb_id: "nm0000101",
  known_for: [makeMovie()],
  known_for_department: "Acting",
  name: "Fixture Actor",
  original_name: "Fixture Actor",
  place_of_birth: "Los Angeles, California, USA",
  popularity: 12.5,
  profile_path: "/fixture-actor.jpg",
};

export function makePerson(overrides: Partial<Person> = {}): Person {
  return { ...defaults, ...overrides };
}
