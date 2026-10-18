import type { DefaultBodyType } from "msw";
import {
  HttpResponse as MswHttpResponse,
  type HttpResponseInit,
} from "msw/http";

function withCors(init?: HttpResponseInit): HttpResponseInit {
  const headers = new Headers({
    "Access-Control-Allow-Origin": "http://localhost:3000",
    "Access-Control-Allow-Credentials": "true",
  });
  new Headers(init?.headers).forEach((value, name) => headers.set(name, value));
  return { ...init, headers };
}

// Model the API's CORS policy for both shared fixtures and per-test overrides.
export class HttpResponse<
  BodyType extends DefaultBodyType,
> extends MswHttpResponse<BodyType> {
  constructor(
    ...[body, init]: ConstructorParameters<typeof MswHttpResponse<BodyType>>
  ) {
    super(body, withCors(init));
  }

  static override json: typeof MswHttpResponse.json = (body, init) =>
    MswHttpResponse.json(body, withCors(init));
}
