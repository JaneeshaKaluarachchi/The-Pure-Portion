const { GoogleGenAI } = require("@google/genai");
const Inventory = require("../models/Inventory");
const mongoose = require("mongoose");

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash";

const clean = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

const similarity = (a, b) => {
  a = clean(a);
  b = clean(b);
  if (!a || !b) return 0;
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.88;
  const aWords = a.split(/\s+/);
  const bWords = b.split(/\s+/);
  let matches = 0;
  aWords.forEach((aw) => {
    if (bWords.some((bw) => bw === aw || bw.startsWith(aw) || aw.startsWith(bw))) matches++;
  });
  return (matches / Math.max(aWords.length, bWords.length)) * 0.75;
};

const PARSE_PROMPT = `You are a recipe ingredient extractor.
Extract ALL ingredients from the recipe content provided.
Return ONLY a valid JSON array — no markdown, no explanation, no extra text.
Format: [{"name":"ingredient name in lowercase singular","quantity":number,"unit":"unit"}]
Allowed units: g, kg, ml, l, pcs, tbsp, tsp, cup, oz, lb, pieces, packs
Rules:
- Lowercase, singular ingredient names (e.g. "onion" not "Onions")
- For ranges like "1-2 cups" use the average (1.5)
- "to taste" or unspecified quantity → use 1
- If no ingredients found, return []`;

const parseWithGemini = async (content, mimeType) => {
  let response;

  if (mimeType === "text/plain") {
    response = await ai.models.generateContent({
      model: MODEL,
      contents: `${PARSE_PROMPT}\n\nRecipe content:\n${content}`,
    });
  } else {
    response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: PARSE_PROMPT },
            { inlineData: { mimeType, data: content } },
          ],
        },
      ],
    });
  }

  const raw = response.text.trim().replace(/^```json\s*|\s*```$/g, "").trim();
  return JSON.parse(raw);
};

const parseRecipeUpload = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.userId);
    let parsedIngredients;

    if (req.body.text && req.body.text.trim()) {
      parsedIngredients = await parseWithGemini(req.body.text.trim(), "text/plain");
    } else if (req.file) {
      const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];
      if (!allowed.includes(req.file.mimetype)) {
        return res.status(400).json({ message: "Only images (JPEG/PNG/WEBP) and PDF files are supported" });
      }
      const base64 = req.file.buffer.toString("base64");
      parsedIngredients = await parseWithGemini(base64, req.file.mimetype);
    } else {
      return res.status(400).json({ message: "Provide recipe text or upload a PDF/image file" });
    }

    if (!Array.isArray(parsedIngredients) || parsedIngredients.length === 0) {
      return res.status(422).json({ message: "No ingredients could be extracted. Try providing clearer recipe content." });
    }

    const inventoryItems = await Inventory.find({ restaurantId, isActive: true });

    const results = parsedIngredients.map((ing) => {
      const scored = inventoryItems
        .map((item) => ({ item, score: similarity(ing.name, item.name) }))
        .filter((x) => x.score > 0.2)
        .sort((a, b) => b.score - a.score);

      const best = scored[0];
      const confidence =
        !best          ? "none"
        : best.score >= 0.85 ? "high"
        : best.score >= 0.5  ? "partial"
        :                      "low";

      return {
        parsedName: ing.name,
        quantity: Number(ing.quantity) || 1,
        unit: ing.unit || "g",
        confidence,
        inventoryMatch: best && best.score >= 0.5
          ? {
              _id:             best.item._id,
              name:            best.item.name,
              unit:            best.item.unit,
              currentQuantity: best.item.currentQuantity,
              costPerUnit:     best.item.costPerUnit,
            }
          : null,
        suggestions: scored.slice(0, 6).map((x) => ({
          _id:   x.item._id,
          name:  x.item.name,
          unit:  x.item.unit,
          score: Math.round(x.score * 100),
        })),
      };
    });

    res.json({ ingredients: results, total: results.length });
  } catch (err) {
    console.error("Recipe parse error:", err);
    if (err instanceof SyntaxError) {
      return res.status(422).json({
        message: "AI returned unexpected data. Try rephrasing or use a clearer recipe format.",
      });
    }
    res.status(500).json({ message: "Parse failed: " + err.message });
  }
};

module.exports = { parseRecipeUpload };
