import { defineConfig } from "vitest/config";
import { transformWithOxc, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const SRC_JSX_IN_JS = /\/src\/.*\.js$/;

// Vite derives its JSX parser mode from the file extension, but every component
// under src/ is a plain `.js` file containing JSX. Re-parse those as `jsx`
// before vite:oxc runs; vite:oxc excludes `.js` itself, so there is no re-transform.
function jsxInJsPlugin(): Plugin {
  return {
    name: "flix:jsx-in-js",
    enforce: "pre",
    async transform(code, id) {
      if (!SRC_JSX_IN_JS.test(id)) return null;

      const { code: transformed, map } = await transformWithOxc(code, id, {
        lang: "jsx",
        jsx: { runtime: "automatic" },
      });

      return { code: transformed, map };
    },
  };
}

export default defineConfig({
  plugins: [jsxInJsPlugin(), react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.js"],
      exclude: ["src/**/*.module.scss", "src/styles/**", "src/themes/**"],
    },
  },
});
