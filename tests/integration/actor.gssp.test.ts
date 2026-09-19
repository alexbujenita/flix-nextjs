// @vitest-environment node

import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";

import { getServerSideProps } from "../../src/pages/actor/[actorId]";
import { makeMovie } from "../fixtures/movie";
import { makePerson } from "../fixtures/person";
import { createGsspContext } from "../helpers/gssp";
import { server } from "../msw/server";

const actorMoviesUrl = "http://localhost:3001/api/actor-movies/:id";
const actorInfoUrl = "http://localhost:3001/api/actor-info/:id";

describe("actor getServerSideProps", () => {
  it("requests both the actor movies and actor info", async () => {
    const movies = [makeMovie()];
    const actor = makePerson();
    const actorMoviesRequest = vi.fn();
    const actorInfoRequest = vi.fn();
    server.use(
      http.get(actorMoviesUrl, ({ params }) => {
        actorMoviesRequest(params.id);
        return HttpResponse.json(movies);
      }),
      http.get(actorInfoUrl, ({ params }) => {
        actorInfoRequest(params.id);
        return HttpResponse.json(actor);
      }),
    );

    const result = await getServerSideProps(
      createGsspContext({ params: { actorId: "101" } }),
    );

    expect(actorMoviesRequest).toHaveBeenCalledWith("101");
    expect(actorInfoRequest).toHaveBeenCalledWith("101");
    expect(result).toEqual({ props: { movies, actor } });
  });

  it("returns notFound when only the actor movies request fails", async () => {
    server.use(
      http.get(actorMoviesUrl, () =>
        HttpResponse.json(
          { error: "Actor movies unavailable" },
          { status: 500 },
        ),
      ),
    );

    const result = await getServerSideProps(
      createGsspContext({ params: { actorId: "101" } }),
    );

    expect(result).toEqual({ notFound: true });
  });

  it("returns notFound when only the actor info request fails", async () => {
    server.use(
      http.get(actorInfoUrl, () =>
        HttpResponse.json({ error: "Actor info unavailable" }, { status: 500 }),
      ),
    );

    const result = await getServerSideProps(
      createGsspContext({ params: { actorId: "101" } }),
    );

    expect(result).toEqual({ notFound: true });
  });
});
