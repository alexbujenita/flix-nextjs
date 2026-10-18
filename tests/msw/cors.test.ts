import axios from "axios";
import { http } from "msw/http";
import { describe, expect, it } from "vitest";

import { HttpResponse } from "./response";
import { server } from "./server";

const url = "http://localhost:3001/api/favs/42";

describe("credentialed cross-origin mocks", () => {
  it("allows a JSON PATCH override after its OPTIONS preflight", async () => {
    const methods: string[] = [];
    const recordRequest = ({ request }: { request: Request }) => {
      if (request.url === url) methods.push(request.method);
    };
    server.events.on("request:start", recordRequest);
    server.use(http.patch(url, () => HttpResponse.json({ seen: true })));

    try {
      const response = await axios.patch(
        url,
        { seen: true },
        {
          withCredentials: true,
        },
      );

      expect(response.data).toEqual({ seen: true });
      expect(methods).toEqual(["OPTIONS", "PATCH"]);
    } finally {
      server.events.removeListener("request:start", recordRequest);
    }
  });

  it("preserves HTTP failures instead of turning them into CORS network errors", async () => {
    server.use(
      http.get(url, () =>
        HttpResponse.json({ message: "Forbidden" }, { status: 403 }),
      ),
    );

    await expect(
      axios.get(url, { withCredentials: true }),
    ).rejects.toMatchObject({
      response: { status: 403, data: { message: "Forbidden" } },
    });
  });

  it("still rejects a response that explicitly denies the document origin", async () => {
    server.use(
      http.get(
        url,
        () =>
          new HttpResponse(null, {
            headers: {
              "Access-Control-Allow-Origin": "http://another-origin.test",
            },
          }),
      ),
    );

    await expect(
      axios.get(url, { withCredentials: true }),
    ).rejects.toMatchObject({
      code: "ERR_NETWORK",
    });
  });
});
