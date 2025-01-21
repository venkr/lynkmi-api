import { defineConfig } from "@playwright/test";

export default defineConfig({
  // We'll use chromium only as discussed
  projects: [
    {
      name: "chromium",
      use: {
        // Channel can be 'chrome', 'chrome-beta', 'chrome-dev', 'chrome-canary' or 'msedge'
        channel: "chrome",
      },
    },
  ],
  use: {
    // Useful scraping defaults
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    // Adjust based on sites you're scraping
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  },
  // Useful for scraping
  timeout: 30000,
});
