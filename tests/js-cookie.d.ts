declare module "js-cookie" {
  type CookieAttributes = {
    readonly expires?: Date | number;
    readonly path?: string;
    readonly sameSite?: "Lax" | "None" | "Strict";
    readonly secure?: boolean;
  };

  type CookiesStatic = {
    get(name: string): string | undefined;
    remove(name: string, attributes?: CookieAttributes): void;
    set(name: string, value: string, attributes?: CookieAttributes): string;
  };

  const Cookies: CookiesStatic;
  export default Cookies;
}
