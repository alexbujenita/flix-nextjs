import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import mockRouter from "next-router-mock";
import type { ReactNode } from "react";

import { server } from "./msw/server";

vi.mock("next/router", async () => vi.importActual("next-router-mock"));
vi.mock("next/head", () => ({
  default: ({ children }: { children: ReactNode }) => children,
}));

const isDom = typeof window !== "undefined";

if (isDom) {
  URL.createObjectURL = vi.fn(() => "blob:mock");
  URL.revokeObjectURL = vi.fn();
}

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterEach(() => {
  if (isDom) {
    cleanup();
    localStorage.clear();
    document.cookie
      .split(";")
      .map((c) => c.split("=")[0].trim())
      .filter(Boolean)
      .forEach((name) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
      });
  }
  server.resetHandlers();
  mockRouter.reset();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

afterAll(() => server.close());
