import Fastify from "fastify";
import { chromium, Page, type BrowserContext } from "playwright";

// Types for our request
type SubmitLinkRequest = {
  username: string;
  password: string;
  title?: string;
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
  await page.waitForSelector('a[href="/accounts/login/?next=/"].btn', {
    timeout: 3000,
  });

  console.log("Saw login button");

  // First click the login button on the homepage
  await page.click('a.btn:has-text("login")');

  // Wait for login form to appear
  await page.waitForSelector("#id_username", { timeout: 3000 });

  console.log("Saw login form");

  // Fill username and password
  await page.fill("#id_username", username);
  await page.fill("#id_password", password);

  // Click the login submit button
  await page.click("button.login-submit");

  // Wait for settings link to verify successful login
  try {
    await page.waitForSelector('a[href="/settings"][title="Settings"]', {
      timeout: 3000,
    });
    console.log("Successfully logged in");
  } catch (error) {
    console.error("Failed to login - settings link not found");
    throw new Error("Login failed - could not verify successful login");
  }
}

async function submitLink(
  page: Page,
  url: string,
  tags: string[],
  title?: string,
  description?: string
) {
  // Fill URL and wait for other fields to appear
  await page.fill("#id_url", url);
  await page.waitForTimeout(100);

  // Handle tags using the select2 textarea
  const tagInput = page.locator("div.add-tags-input .select2-search__field");
  for (const tag of tags) {
    await tagInput.fill(tag);
    await page.keyboard.press("Enter");
    // Small wait between tags
    await page.waitForTimeout(100);
  }

  // Wait the required 300ms
  await page.waitForTimeout(300);

  // Handle optional description
  if (description) {
    await page.fill("#id_description", description);
  }

  // Handle title
  const titleField = page.locator("#id_title");
  const currentTitle = await titleField.inputValue();

  if (title) {
    await titleField.fill(title);
  } else if (!currentTitle) {
    // If no title provided and no auto-generated title, use "Untitled Link"
    await titleField.fill("Untitled Link");
  }

  // Click the submit button to make it enabled
  await page.click("input.add-form-submit#submit-button", { force: true });

  // Click the submit button
  await page.click("input.add-form-submit#submit-button");

  // Wait 300 ms
  await page.waitForTimeout(300);
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
    if (!body.username || !body.password || !body.url || !body.tags) {
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
          await page.goto("https://lynkmi.com");
          await login(page, body.username, body.password);
          await submitLink(
            page,
            body.url,
            body.tags,
            body.title,
            body.description
          );
          // TODO: Implement submit

          return { success: true };
        } finally {
          // Wait 5 seconds before closing context
          //   await page.waitForTimeout(5000);
          await context.close();
        }
      });

      return result;
    } catch (error) {
      if (error instanceof Error) {
        reply.code(500);
        return { error: "Failed to process request", details: error.message };
      } else {
        reply.code(500);
        return { error: "Failed to process request", details: error };
      }
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
