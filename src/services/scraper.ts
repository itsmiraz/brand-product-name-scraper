import axios from "axios";
import * as cheerio from "cheerio";
import { normalizeProducts } from "./llm";

interface Input {
  brandName: string;
  website: string;
  facebook?: string;
  instagram?: string;
}
// src/services/http.ts

export const http = axios.create({
  timeout: 12000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
  },
  // Optional: respect proxies if you ever set HTTP(S)_PROXY envs
  proxy: false,
});

// src/services/retry.ts
export async function withRetry<T>(fn: () => Promise<T>, attempts = 3) {
  let delay = 500;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e: any) {
      const status = e?.response?.status;
      if (i === attempts - 1 || (status && status < 500 && status !== 429))
        throw e;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error("unreachable");
}

export async function fetchProducts({ website }: Input): Promise<string[]> {
  try {
    // --- Shopify detection ---
    const shopifyUrl = `${website.replace(/\/$/, "")}/products.json?limit=50`;
    try {
      const resp = await withRetry(() => http.get(shopifyUrl));
      if (resp.data?.products) {
        const names = resp.data.products.map((p: any) => p.title);
        return await normalizeProducts(names);
      }
    } catch {
      console.log("Not a Shopify site, fallback to crawling...");
    }

    // --- Fallback Crawl ---
    const resp = await withRetry(() => http.get(website, { timeout: 10000 }));
    console.log(resp);
    const $ = cheerio.load(resp.data);

    // Grab text candidates from headings/links
    const candidates: string[] = [];
    $("h1,h2,h3,a").each((_, el) => {
      const text = $(el).text().trim();
      if (text.length > 2 && text.length < 80) {
        candidates.push(text);
      }
    });

    // Deduplicate raw candidates
    const unique = Array.from(new Set(candidates));

    if (unique.length === 0) return [];

    return await normalizeProducts(unique);
  } catch (err) {
    console.error("Scraper error", err);
    return [];
  }
}
