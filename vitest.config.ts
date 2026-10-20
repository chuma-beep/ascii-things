import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Playwright specs under tests/e2e use the same .spec.ts convention.
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
  },
});
