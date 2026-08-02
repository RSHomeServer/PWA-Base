import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    // Serial transforms avoid intermittent garbled reads on this workspace FS.
    fileParallelism: false,
  },
});
