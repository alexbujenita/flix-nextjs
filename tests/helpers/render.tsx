import {
  render,
  type RenderOptions,
  type RenderResult,
} from "@testing-library/react";
import { MemoryRouterProvider } from "next-router-mock/MemoryRouterProvider";
import type { ReactElement, ReactNode } from "react";

type RenderWithRouterOptions = Omit<RenderOptions, "wrapper"> & {
  readonly url?: string;
};

export function renderWithRouter(
  ui: ReactElement,
  { url = "/", ...renderOptions }: RenderWithRouterOptions = {},
): RenderResult {
  function RouterWrapper({ children }: { readonly children: ReactNode }) {
    return <MemoryRouterProvider url={url}>{children}</MemoryRouterProvider>;
  }

  return render(ui, { ...renderOptions, wrapper: RouterWrapper });
}
