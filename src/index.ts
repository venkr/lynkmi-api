import Fastify from "fastify";
import { chromium, Page, type BrowserContext } from "playwright";

// Types for our request
type SubmitLinkRequest = {
  username: string;
  password: string;
  title: string;
  url: string;
  tags: string[];
  description?: string;
};

// Simple queue to handle requests
class ScrapingQueue {
  private queue: Array<() => Promise<any>> = [];
  private isProcessing = false;
  private timeout = 30000; // 30 seconds timeout

  async add<T>(job: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Queue timeout"));
      }, this.timeout);

      this.queue.push(async () => {
        try {
          const result = await job();
          clearTimeout(timeoutId);
          resolve(result);
        } catch (error) {
          clearTimeout(timeoutId);
          reject(error);
        }
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (job) await job();
    }

    this.isProcessing = false;
  }
}

async function login(page: Page, username: string, password: string) {
  await page.waitForSelector('a[href="/accounts/login/?next=/"].btn');

  console.log("Saw login button");

  // First click the login button on the homepage
  await page.click('a.btn:has-text("login")');

  // Wait for login form to appear
  await page.waitForSelector("#id_username");

  console.log("Saw login form");

  // Fill username and password
  await page.fill("#id_username", username);
  await page.fill("#id_password", password);

  // Click the login submit button
  await page.click("button.login-submit");

  //   // Wait for navigation/redirect after login
  //   await page.waitForNavigation();

  //   // Check if login failed by looking for error div
  //   const errorDiv = await page.locator(".errors");
  //   if (await errorDiv.isVisible()) {
  //     const errorText = await errorDiv.textContent();
  //     throw new Error(`Login failed: ${errorText}`);
  //   }
}

async function main() {
  // Initialize browser
  const browser = await chromium.launch({
    headless: false,
  });
  const queue = new ScrapingQueue();

  const fastify = Fastify({
    logger: true,
  });

  // Health check
  fastify.get("/", async () => {
    return { status: "ok" };
  });

  // Main endpoint
  fastify.post("/submitLink", async (request, reply) => {
    const body = request.body as SubmitLinkRequest;

    // Validate required fields
    if (
      !body.username ||
      !body.password ||
      !body.title ||
      !body.url ||
      !body.tags
    ) {
      reply.code(400);
      return { error: "Missing required fields" };
    }

    try {
      // Queue the scraping job
      const result = await queue.add(async () => {
        // Create a fresh context for this request
        const context: BrowserContext = await browser.newContext();
        const page = await context.newPage();

        try {
          // TODO: Implement login
          // TODO: Implement submit
          await page.goto("https://lynkmi.com");
          await login(page, body.username, body.password);

          return { success: true };
        } finally {
          await context.close();
        }
      });

      return result;
    } catch (error) {
      reply.code(500);
      return { error: "Failed to process request" };
    }
  });

  try {
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main().catch(console.error);
