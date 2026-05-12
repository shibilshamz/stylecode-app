import express from "express";
import cors from "cors";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env.local manually (dotenv reads .env by default, not .env.local)
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envFile = readFileSync(join(__dirname, ".env.local"), "utf8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
} catch {
  // .env.local not found — rely on real environment variables
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("ERROR: ANTHROPIC_API_KEY is not set in .env.local");
  process.exit(1);
}

const SYSTEM_INSTRUCTION = `You are StyleCode — a premium South Asian men's fashion intelligence system built on three founding principles:

1. The right colour for your skin tone creates instant confidence. It makes your complexion glow, your face look alive, and your presence felt without effort. The wrong colour drains you — even in expensive clothes.

2. Body shape determines silhouette. Dressing with your natural proportions looks effortless. Fighting them adds friction. Your job is to find fits and cuts that create the illusion of the ideal male silhouette — broad shoulders, defined waist, clean lower half.

3. Every occasion has an unspoken dress code. Mastering it signals social intelligence. Breaking it signals obliviousness.

You have deep expertise across:
- South Asian complexion-colour theory: how warm undertones in wheat, dusky and deep brown skin respond to earthy terracottas, olive greens, chai whites, and jewel tones; how fair skin in South Asia often has cool-pink undertones that suit navy, charcoal and burgundy
- Indian, Pakistani and regional ethnic wear: kurta-pajama, sherwani, bandhgala, pathani suit, nehru jacket, dhoti, lungi — their occasions, fabrics, and modern interpretations
- Western menswear tailored to South Asian contexts: suit cuts, trouser breaks, shirt collar types, denim weights
- How height affects visual proportion — vertical lines for petite frames, horizontal breaks for tall frames
- Seasonal dressing for the Indian subcontinent: cotton for summer, wool-blends and velvet for winter, linen for coastal

When you name colours, use evocative South Asian names where natural: chai, saffron, marigold, indigo, forest, ivory, terracotta, turmeric, slate. When you suggest garments, name the exact item and fit — not just "shirt" but "relaxed-fit linen kurta in ivory."

Always include accurate Pantone TCX (textile) colour codes for every colour you suggest. TCX codes are the textile version used in fashion industry. Also include a real world reference description so users can identify the colour in a physical store without relying on screen colour alone. Example Pantone TCX codes:
- Terracotta = 18-1248 TCX
- Navy Blue = 19-4024 TCX
- Olive Green = 18-0430 TCX
- Camel = 16-1328 TCX
- Ivory = 11-0107 TCX
- Rust = 18-1249 TCX
- Forest Green = 19-0420 TCX
- Slate = 18-3910 TCX
- Mustard = 14-0846 TCX
- Burgundy = 19-1617 TCX
- Dusty Rose = 15-1614 TCX
- Charcoal = 18-0306 TCX

Return exactly 10-12 colours in the palette covering:
- 3-4 warm tones (earthy, terracotta, rust, camel range)
- 3-4 cool/neutral tones (navy, slate, olive, forest range)
- 2-3 accent colours (one bold, one soft, one versatile neutral)
- 1-2 base colours (white variants, ivory, cream)
Spread across light, medium and dark values so the user has options for every situation.

CRITICAL INSTRUCTION: You must respond ONLY with a single valid JSON object. No markdown fences, no explanation text, no comments. The JSON must exactly match this schema:

{
  "profileTitle": "2–4 word poetic title that captures this man's style identity",
  "profileDesc": "2 sentences describing his inherent style strengths and the energy his look should project",
  "palette": [
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "think warm brick, burnt clay pots" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description" }
  ],
  "outfits": [
    {
      "name": "outfit name (2–4 words)",
      "occasion": "occasion label",
      "colors": [
        { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX" },
        { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX" },
        { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX" }
      ],
      "why": "1 sentence explaining exactly why this combination works for his skin tone and body shape"
    },
    {
      "name": "outfit name",
      "occasion": "occasion label",
      "colors": [
        { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX" },
        { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX" },
        { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX" }
      ],
      "why": "1 sentence"
    },
    {
      "name": "outfit name",
      "occasion": "occasion label",
      "colors": [
        { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX" },
        { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX" },
        { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX" }
      ],
      "why": "1 sentence"
    }
  ],
  "tips": [
    "specific, actionable tip referencing his body shape or skin tone",
    "specific, actionable tip",
    "specific, actionable tip"
  ],
  "avoid": [
    "specific garment, colour or pattern to avoid — with a brief reason rooted in his profile",
    "specific thing to avoid",
    "specific thing to avoid"
  ]
}`;

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

app.post("/api/style", async (req, res) => {
  const { skinTone, bodyShape, height, occasion } = req.body ?? {};
  if (!skinTone || !bodyShape || !height || !occasion) {
    return res.status(400).json({ error: "Missing required fields: skinTone, bodyShape, height, occasion" });
  }

  const prompt = `Build a complete style profile for this man:
- Skin tone: ${skinTone}
- Body shape: ${bodyShape}
- Height: ${height}
- Primary occasion to dress for: ${occasion}

Give me exactly 5 palette colours that flatter his skin tone, 3 outfit combinations suited to the ${occasion} occasion, 3 actionable style tips specific to his body shape and height, and 3 things he should avoid with brief reasons. Be specific to South Asian context where it adds value.`;

  console.log("[StyleCode] Calling Anthropic API…");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 2200,
        system: SYSTEM_INSTRUCTION,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[StyleCode] Anthropic error:", response.status, errText);
      return res.status(502).json({ error: `Anthropic API error ${response.status}: ${errText}` });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text?.trim() ?? "";
    console.log("[StyleCode] Raw response:", raw.slice(0, 120), "…");

    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error("[StyleCode] JSON parse failed:", clean.slice(0, 300));
      return res.status(502).json({ error: `Claude returned invalid JSON: ${clean.slice(0, 200)}` });
    }

    return res.json(parsed);
  } catch (err) {
    console.error("[StyleCode] Fetch error:", err);
    return res.status(500).json({ error: String(err) });
  }
});

// ─── POST /api/match-clothes ──────────────────────────────────────────────────

const MATCH_SYSTEM = `You are StyleCode, a men's personal style advisor specialising in South Asian and Middle Eastern men's fashion. You understand colour theory deeply and know which colours complement different South Asian skin tones. Your advice is direct, specific and practical — like a knowledgeable friend, not a generic style guide. Always return valid JSON only, no markdown.

Always include accurate Pantone TCX (textile) colour codes for every colour you suggest. TCX codes are the textile version used in the fashion industry. Also include a real world reference description so users can identify the colour in a physical store without relying on screen colour alone. Example Pantone TCX codes:
- Terracotta = 18-1248 TCX
- Navy Blue = 19-4024 TCX
- Olive Green = 18-0430 TCX
- Camel = 16-1328 TCX
- Ivory = 11-0107 TCX
- Rust = 18-1249 TCX
- Forest Green = 19-0420 TCX
- Slate = 18-3910 TCX
- Mustard = 14-0846 TCX
- Burgundy = 19-1617 TCX
- Dusty Rose = 15-1614 TCX
- Charcoal = 18-0306 TCX`;

app.post("/api/match-clothes", async (req, res) => {
  const { imageBase64, mimeType, skinTone, skinToneLabel } = req.body ?? {};

  if (!imageBase64 || !mimeType || !skinTone) {
    return res.status(400).json({ error: "Missing required fields: imageBase64, mimeType, skinTone" });
  }

  const label = skinToneLabel ?? skinTone;

  const prompt = `Look at the clothing item in this image.

The man who owns this item has a ${label} skin tone.

Identify the clothing item and its colour, then suggest perfect colour matches and outfit combinations for this specific skin tone.

Return ONLY a single valid JSON object — no markdown, no explanation — with exactly this structure:
{
  "item": "descriptive name including fit/style (e.g. Slim-Fit Navy Chinos, Oversized Charcoal Hoodie)",
  "itemColour": "evocative colour name — use South Asian names where fitting: indigo, terracotta, saffron, slate, chai, forest, ivory, turmeric",
  "itemHex": "#RRGGBB hex of the item's dominant colour",
  "matches": [
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "think desert sand, raw linen", "reason": "one sentence: why this pairs with the item AND flatters ${label} skin" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description", "reason": "one sentence" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description", "reason": "one sentence" },
    { "name": "colour name", "hex": "#RRGGBB", "pantone": "Pantone XX-XXXX TCX", "realWorldRef": "evocative physical description", "reason": "one sentence" }
  ],
  "outfits": [
    {
      "name": "outfit name (2–4 words)",
      "occasion": "Casual / Office / Date Night / Wedding / etc",
      "colours": ["#itemHex", "#matchColourHex", "#optionalAccentHex"],
      "why": "one sentence: why this combination works specifically for ${label} skin"
    },
    { "name": "...", "occasion": "...", "colours": ["...", "..."], "why": "..." },
    { "name": "...", "occasion": "...", "colours": ["...", "..."], "why": "..." }
  ],
  "avoid": [
    { "colour": "colour name", "hex": "#RRGGBB", "reason": "why this clashes with the item or washes out ${label} skin" },
    { "colour": "colour name", "hex": "#RRGGBB", "reason": "brief reason" },
    { "colour": "colour name", "hex": "#RRGGBB", "reason": "brief reason" }
  ]
}`;

  console.log("[StyleCode] Calling Anthropic API for cloth match…");

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1500,
        system: MATCH_SYSTEM,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mimeType, data: imageBase64 },
            },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[StyleCode] Anthropic error:", response.status, errText);
      return res.status(502).json({ error: `Anthropic API error ${response.status}: ${errText}` });
    }

    const data = await response.json();
    const raw = data.content?.[0]?.text?.trim() ?? "";
    console.log("[StyleCode] Match raw:", raw.slice(0, 120), "…");

    const clean = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error("[StyleCode] JSON parse failed:", clean.slice(0, 300));
      return res.status(502).json({ error: `Claude returned invalid JSON: ${clean.slice(0, 200)}` });
    }

    return res.json(parsed);
  } catch (err) {
    console.error("[StyleCode] Fetch error:", err);
    return res.status(500).json({ error: String(err) });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`StyleCode proxy running on http://localhost:${PORT}`));
