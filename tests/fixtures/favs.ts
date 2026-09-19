export type Favorite = {
  readonly createdAt: string;
  readonly id: number;
  readonly isDuplicate: boolean;
  readonly moviePosterPath: string;
  readonly movieRefId: number;
  readonly movieTitle: string;
  readonly rating: number;
  readonly seen: boolean;
  readonly updatedAt: string;
  readonly userId: number;
};

const defaults: Favorite = {
  createdAt: "2024-01-01T00:00:00.000Z",
  id: 701,
  isDuplicate: false,
  moviePosterPath: "/fixture-poster.jpg",
  movieRefId: 1,
  movieTitle: "Fixture Movie",
  rating: 8,
  seen: true,
  updatedAt: "2024-01-02T00:00:00.000Z",
  userId: 1,
};

export function makeFavorite(overrides: Partial<Favorite> = {}): Favorite {
  return { ...defaults, ...overrides };
}
