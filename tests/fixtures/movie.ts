export type Genre = {
  readonly id: number;
  readonly name: string;
};

export type MovieCastMember = {
  readonly adult: boolean;
  readonly cast_id: number;
  readonly character: string;
  readonly credit_id: string;
  readonly gender: number;
  readonly id: number;
  readonly known_for_department: string;
  readonly name: string;
  readonly order: number;
  readonly original_name: string;
  readonly popularity: number;
  readonly profile_path: string;
};

export type MovieCrewMember = {
  readonly adult: boolean;
  readonly credit_id: string;
  readonly department: string;
  readonly gender: number;
  readonly id: number;
  readonly job: string;
  readonly known_for_department: string;
  readonly name: string;
  readonly original_name: string;
  readonly popularity: number;
  readonly profile_path: string;
};

export type MovieVideo = {
  readonly id: string;
  readonly iso_3166_1: string;
  readonly iso_639_1: string;
  readonly key: string;
  readonly name: string;
  readonly official: boolean;
  readonly published_at: string;
  readonly site: string;
  readonly size: number;
  readonly type: string;
};

export type Movie = {
  readonly adult: boolean;
  readonly backdrop_path: string;
  readonly belongs_to_collection: null;
  readonly budget: number;
  readonly contentType: string;
  readonly credits: {
    readonly cast: readonly MovieCastMember[];
    readonly crew: readonly MovieCrewMember[];
  };
  readonly genre_ids: readonly number[];
  readonly genres: readonly Genre[];
  readonly homepage: string;
  readonly id: number;
  readonly imdb_id: string;
  readonly original_language: string;
  readonly original_title: string;
  readonly overview: string;
  readonly popularity: number;
  readonly poster_path: string;
  readonly production_companies: readonly {
    readonly id: number;
    readonly logo_path: string;
    readonly name: string;
    readonly origin_country: string;
  }[];
  readonly production_countries: readonly {
    readonly iso_3166_1: string;
    readonly name: string;
  }[];
  readonly release_date: string;
  readonly revenue: number;
  readonly runtime: number;
  readonly spoken_languages: readonly {
    readonly english_name: string;
    readonly iso_639_1: string;
    readonly name: string;
  }[];
  readonly status: string;
  readonly tagline: string;
  readonly title: string;
  readonly video: boolean;
  readonly videos: { readonly results: readonly MovieVideo[] };
  readonly vote_average: number;
  readonly vote_count: number;
};

const defaults: Movie = {
  adult: false,
  backdrop_path: "/fixture-backdrop.jpg",
  belongs_to_collection: null,
  budget: 50_000_000,
  contentType: "movie",
  credits: {
    cast: [
      {
        adult: false,
        cast_id: 1,
        character: "Alex Hero",
        credit_id: "cast-credit-1",
        gender: 2,
        id: 101,
        known_for_department: "Acting",
        name: "Fixture Actor",
        order: 0,
        original_name: "Fixture Actor",
        popularity: 12.5,
        profile_path: "/fixture-actor.jpg",
      },
    ],
    crew: [
      {
        adult: false,
        credit_id: "crew-credit-1",
        department: "Directing",
        gender: 1,
        id: 201,
        job: "Director",
        known_for_department: "Directing",
        name: "Fixture Director",
        original_name: "Fixture Director",
        popularity: 8.5,
        profile_path: "/fixture-director.jpg",
      },
    ],
  },
  genre_ids: [18],
  genres: [{ id: 18, name: "Drama" }],
  homepage: "https://example.com/fixture-movie",
  id: 1,
  imdb_id: "tt0000001",
  original_language: "en",
  original_title: "Fixture Movie",
  overview: "A fully populated movie fixture.",
  popularity: 42.5,
  poster_path: "/fixture-poster.jpg",
  production_companies: [
    {
      id: 1,
      logo_path: "/fixture-studio.png",
      name: "Fixture Studio",
      origin_country: "US",
    },
  ],
  production_countries: [{ iso_3166_1: "US", name: "United States" }],
  release_date: "2024-01-15",
  revenue: 125_000_000,
  runtime: 123,
  spoken_languages: [
    { english_name: "English", iso_639_1: "en", name: "English" },
  ],
  status: "Released",
  tagline: "Every test needs a hero.",
  title: "Fixture Movie",
  video: false,
  videos: {
    results: [
      {
        id: "video-1",
        iso_3166_1: "US",
        iso_639_1: "en",
        key: "fixture-trailer",
        name: "Official Trailer",
        official: true,
        published_at: "2024-01-01T00:00:00.000Z",
        site: "YouTube",
        size: 1080,
        type: "Trailer",
      },
    ],
  },
  vote_average: 8.2,
  vote_count: 1_234,
};

export function makeMovie(overrides: Partial<Movie> = {}): Movie {
  return { ...defaults, ...overrides };
}
