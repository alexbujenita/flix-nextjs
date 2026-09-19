import type { Genre } from "./movie";

export type TvSeason = {
  readonly air_date: string;
  readonly episode_count: number;
  readonly id: number;
  readonly name: string;
  readonly overview: string;
  readonly poster_path: string;
  readonly season_number: number;
};

export type TvShow = {
  readonly adult: boolean;
  readonly backdrop_path: string;
  readonly contentType: string;
  readonly created_by: readonly {
    readonly credit_id: string;
    readonly gender: number;
    readonly id: number;
    readonly name: string;
    readonly profile_path: string;
  }[];
  readonly episode_run_time: readonly number[];
  readonly first_air_date: string;
  readonly genre_ids: readonly number[];
  readonly genres: readonly Genre[];
  readonly homepage: string;
  readonly id: number;
  readonly in_production: boolean;
  readonly languages: readonly string[];
  readonly last_air_date: string;
  readonly name: string;
  readonly networks: readonly {
    readonly id: number;
    readonly logo_path: string;
    readonly name: string;
    readonly origin_country: string;
  }[];
  readonly next_episode_to_air: null;
  readonly number_of_episodes: number;
  readonly number_of_seasons: number;
  readonly origin_country: readonly string[];
  readonly original_language: string;
  readonly original_name: string;
  readonly overview: string;
  readonly popularity: number;
  readonly poster_path: string;
  readonly production_companies: readonly {
    readonly id: number;
    readonly logo_path: string;
    readonly name: string;
    readonly origin_country: string;
  }[];
  readonly seasons: readonly TvSeason[];
  readonly status: string;
  readonly tagline: string;
  readonly type: string;
  readonly vote_average: number;
  readonly vote_count: number;
};

const defaults: TvShow = {
  adult: false,
  backdrop_path: "/fixture-tv-backdrop.jpg",
  contentType: "tvSeries",
  created_by: [
    {
      credit_id: "creator-credit-1",
      gender: 2,
      id: 301,
      name: "Fixture Creator",
      profile_path: "/fixture-creator.jpg",
    },
  ],
  episode_run_time: [52],
  first_air_date: "2023-09-10",
  genre_ids: [18],
  genres: [{ id: 18, name: "Drama" }],
  homepage: "https://example.com/fixture-tv",
  id: 501,
  in_production: true,
  languages: ["en"],
  last_air_date: "2024-09-10",
  name: "Fixture TV Show",
  networks: [
    {
      id: 401,
      logo_path: "/fixture-network.png",
      name: "Fixture Network",
      origin_country: "US",
    },
  ],
  next_episode_to_air: null,
  number_of_episodes: 10,
  number_of_seasons: 1,
  origin_country: ["US"],
  original_language: "en",
  original_name: "Fixture TV Show",
  overview: "A fully populated television fixture.",
  popularity: 38.7,
  poster_path: "/fixture-tv-poster.jpg",
  production_companies: [
    {
      id: 1,
      logo_path: "/fixture-studio.png",
      name: "Fixture Studio",
      origin_country: "US",
    },
  ],
  seasons: [
    {
      air_date: "2023-09-10",
      episode_count: 10,
      id: 601,
      name: "Season 1",
      overview: "The first fixture season.",
      poster_path: "/fixture-season.jpg",
      season_number: 1,
    },
  ],
  status: "Returning Series",
  tagline: "Testing is only the beginning.",
  type: "Scripted",
  vote_average: 8.5,
  vote_count: 876,
};

export function makeTvShow(overrides: Partial<TvShow> = {}): TvShow {
  return { ...defaults, ...overrides };
}
