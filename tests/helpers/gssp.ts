type QueryValue = string | readonly string[] | undefined;

type CreateGsspContextOptions = {
  readonly cookie?: string;
  readonly params?: Record<string, QueryValue>;
  readonly query?: Record<string, QueryValue>;
};

export type GsspContext = {
  readonly params: Record<string, QueryValue>;
  readonly query: Record<string, QueryValue>;
  readonly req: { readonly headers: { readonly cookie?: string } };
};

export function createGsspContext({
  cookie,
  params,
  query,
}: CreateGsspContextOptions = {}): GsspContext {
  return {
    req: { headers: { cookie } },
    query: query ?? {},
    params: params ?? {},
  };
}
