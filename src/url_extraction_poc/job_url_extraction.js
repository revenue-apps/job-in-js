// agent-google-careers.cjs (CommonJS)
// npm i openai node-html-parser undici

const OpenAI = require("openai");
const { parse } = require("node-html-parser");
const { fetch } = require("undici");
require("dotenv").config();

// ---- CONFIG ----
const LOCATION = "United States";         // change as needed
const SORT_BY = "date";                   // "date" | "relevance"
const START_PAGE = 1;                     // inclusive
const END_PAGE = 2;                       // inclusive (set your max page here)

// Build a page URL
const baseUrl = "https://www.google.com/about/careers/applications/jobs/results";
const buildUrl = (page) =>
  `${baseUrl}?location=${encodeURIComponent(LOCATION)}&sort_by=${encodeURIComponent(SORT_BY)}&page=${page}`;

// Pages queue
const PAGES = Array.from({ length: END_PAGE - START_PAGE + 1 }, (_, i) => buildUrl(START_PAGE + i));

// --- OpenAI client ---
const openai = new OpenAI({
 apiKey: process.env.OPENAI_API_KEY
});

// --- helpers ---
function unwrapJsonFences(s = "") {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (m ? m[1] : s).trim();
}
function toAbsolute(u) {
  if (!u) return "";
  return u.startsWith("http") ? u : `https://www.google.com${u}`;
}

// --- Tool: fetchPage(url) -> returns anchors (href + text) ---
async function fetchPage(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36",
      "accept-language": "en-US,en;q=0.9",
    },
  });
  const html = await res.text();

  const root = parse(html);
  const anchors = root.querySelectorAll("a[href]").map((a) => ({
    href: a.getAttribute("href") || "",
    text: (a.text || "").trim().slice(0, 160),
  }));

  return { url, anchors };
}

// --- tool schema for OpenAI ---
const tools = [
  {
    type: "function",
    function: {
      name: "fetchPage",
      description:
        "HTTP GET a URL and return a compact list of anchors on the page (href + text).",
      parameters: {
        type: "object",
        properties: { url: { type: "string" } },
        required: ["url"],
      },
    },
  },
];

const availableTools = { fetchPage };

// --- System prompt: fetch a known list of pages ---
const baseMessages = [
  {
    role: "system",
    content: [
      "You are a web data extraction agent.",
      "Task:",
      "- Fetch EACH of the following Google Careers result pages (in order), extract ALL job detail links from EVERY page, then return the UNION (deduplicated, preserving page order).",
      ...PAGES.map((u, i) => `  ${i + 1}) ${u}`),
      "",
      "Link rules:",
      "- A job detail link starts with /about/careers/applications/jobs/results/ followed by an id-slug.",
      "- Output ABSOLUTE URLs (prepend https://www.google.com if needed).",
      "- Deduplicate while preserving order across pages.",
      "",
      "Output format:",
      "- Return ONLY a JSON array of strings (the URLs). No prose.",
    ].join("\n"),
  },
];

async function agent(userInput) {
  const messages = [...baseMessages, { role: "user", content: userInput }];

  // queue + tracker
  const queue = [...PAGES];
  const fetched = new Set();

  // Enough turns for N pages + finalization
  const MAX_ITERS = PAGES.length * 2 + 4;

  for (let i = 0; i < MAX_ITERS; i++) {
    const res = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-4"
      messages,
      tools,
      temperature: 0,
    });

    const { finish_reason, message } = res.choices[0];

    if (finish_reason === "tool_calls" && message.tool_calls?.length) {
      for (const tc of message.tool_calls) {
        const name = tc.function?.name;
        if (!availableTools[name]) continue;

        // Always fetch the next unfetched page from our queue
        const url = queue.find((u) => !fetched.has(u));
        if (!url) {
          // no more pages left; ask the model to finalize
          messages.push({
            role: "system",
            content: [
              "You have fetched all pages.",
              "From ALL collected anchors across ALL pages:",
              "- Keep ONLY hrefs starting with '/about/careers/applications/jobs/results/'.",
              "- Convert to ABSOLUTE URLs using 'https://www.google.com' if needed.",
              "- Deduplicate preserving original discovery order (page 1 -> page 2 -> ...).",
              "- Return ONLY the JSON array of URLs.",
            ].join("\n"),
          });
          continue;
        }

        fetched.add(url);
        const toolResult = await availableTools[name](url);

        // Echo call + result
        messages.push({
          role: "assistant",
          tool_calls: [{ id: tc.id, type: "function", function: { name, arguments: JSON.stringify({ url }) } }],
        });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(toolResult),
        });

        // If more pages remain, nudge to fetch next; else finalize
        const remaining = queue.filter((u) => !fetched.has(u)).length;
        messages.push({
          role: "system",
          content:
            remaining > 0
              ? `You have ${remaining} page(s) left. Call fetchPage for the next page in order. Return ONLY the final JSON array after all pages are fetched.`
              : [
                  "You have fetched all pages.",
                  "From ALL collected anchors:",
                  "- Keep ONLY hrefs starting with '/about/careers/applications/jobs/results/'.",
                  "- Convert to ABSOLUTE URLs using 'https://www.google.com' if needed.",
                  "- Deduplicate preserving original discovery order across pages.",
                  "- Return ONLY the JSON array.",
                ].join("\n"),
        });
      }
      continue;
    }

    if (finish_reason === "stop") {
      const raw = message.content ?? "[]";
      const body = unwrapJsonFences(raw);
      try {
        const arr = JSON.parse(body);
        if (Array.isArray(arr)) {
          const unique = [...new Set(arr.map(toAbsolute))].filter(Boolean);
          return JSON.stringify(unique, null, 2);
        }
      } catch {
        // fall through
      }
      return body;
    }
  }

  return "[]"; // safety net
}

// ---- Run it ----
async function main() {
  const out = await agent(
    `Extract ALL job detail URLs from pages ${START_PAGE} to ${END_PAGE} (inclusive) for location "${LOCATION}" sorted by "${SORT_BY}". Return JSON array only.`
  );
  console.log(out);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
