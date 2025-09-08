import axios from "axios";

/**
 * Send raw product names to local Ollama (Mistral)
 * and get normalized/generic product terms.
 */
export async function normalizeProducts(raw: string[]): Promise<string[]> {
  const prompt = `
You are a product name cleaner.
Task: From the following list of product titles, extract only the *generic product type* (remove brand names, starter kit , set ,marketing fluff, sizes, emojis, "","show all","blank" etc).
Return a JSON array of strings.

Input: ${JSON.stringify(raw.slice(0, 30))}  // cap list
Output:
`;

  try {
    const resp = await axios.post("http://localhost:11434/api/generate", {
      model: "mistral",
      prompt,
      stream: false,
    });

    // Ollama returns object with 'response'
    const text = resp.data.response.trim();

    // Try to parse JSON from LLM
    let cleaned: string[] = [];
    try {
      cleaned = JSON.parse(text);
    } catch {
      console.error("LLM did not return valid JSON, fallback to raw list");
      cleaned = raw;
    }

    return Array.from(new Set(cleaned.map((p) => p.trim().toLowerCase())));
  } catch (err) {
    console.error("LLM error", err);
    return raw;
  }
}
