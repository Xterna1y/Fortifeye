import puppeteer from "puppeteer";
import { sanitizeHTML } from "../utils/sanitizer";

export async function sandboxBrowse(url: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-web-security"
    ]
  });

  const page = await browser.newPage();

  // 🔒 Block dangerous requests
  await page.setRequestInterception(true);

  page.on("request", (req) => {
    const blockedTypes = ["script", "xhr", "fetch", "websocket"];

    if (
      blockedTypes.includes(req.resourceType()) ||
      req.method() !== "GET"
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });

  // 🌐 Load page
  await page.goto(url, { waitUntil: "domcontentloaded" });

  // 📄 Get HTML
  const rawHTML = await page.content();

  await browser.close();

  // 🧼 Sanitize HTML
  return sanitizeHTML(rawHTML);
}