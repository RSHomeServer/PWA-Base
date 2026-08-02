import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    {
      name: "stub-css",
      load(id) {
        if (id.endsWith(".css")) {
          return "";
        }
      },
    },
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
