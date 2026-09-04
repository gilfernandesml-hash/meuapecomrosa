import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir:"./tests/e2e",fullyParallel:false,workers:1,timeout:60_000,maxFailures:1,
  use:{baseURL:"http://127.0.0.1:3100",browserName:"chromium",channel:"chrome",trace:"retain-on-failure"},
  webServer:{command:"node --import tsx tests/serve.ts",url:"http://127.0.0.1:3100",timeout:120_000,reuseExistingServer:!process.env.CI},
});
