import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: root },
      // "server-only" throws when imported outside Next's server bundles; tests run server code directly.
      { find: /^server-only$/, replacement: `${root}test/stubs/server-only.ts` },
    ],
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
    // Fake, test-only configuration. Never put real keys here.
    env: {
      CASHFREE_CLIENT_ID: "TEST_fake_client_id",
      CASHFREE_CLIENT_SECRET: "cfsk_ma_test_fake_secret_for_unit_tests",
      CASHFREE_ENV: "sandbox",
      SITE_URL: "https://webinar.example.in",
    },
  },
});
