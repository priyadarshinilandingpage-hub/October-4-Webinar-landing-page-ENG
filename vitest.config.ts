import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: root }],
  },
  test: {
    // The Pages Functions use only web-standard APIs (fetch, Request, crypto.subtle), which Node has too.
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
