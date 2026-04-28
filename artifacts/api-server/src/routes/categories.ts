import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import OpenAI from "openai";

const router: IRouter = Router({ mergeParams: true });

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", keywords: ["restaurant", "cafe", "coffee", "pizza", "burger", "grubhub", "doordash", "uber eats", "mcdonald", "starbucks", "chipotle", "subway", "doordash", "postmates", "seamless"], color: "#f97316", icon: "utensils" },
  { name: "Groceries", keywords: ["grocery", "supermarket", "whole foods", "kroger", "publix", "trader joe", "walmart", "target", "aldi", "costco", "safeway", "instacart"], color: "#22c55e", icon: "shopping-cart" },
  { name: "Transportation", keywords: ["gas", "uber", "lyft", "taxi", "parking", "toll", "transit", "metro", "fuel", "shell", "bp", "exxon", "chevron", "autozone", "jiffy lube"], color: "#3b82f6", icon: "car" },
  { name: "Shopping", keywords: ["amazon", "ebay", "etsy", "best buy", "apple", "mall", "clothing", "shoes", "nike", "zara", "h&m", "amzn"], color: "#8b5cf6", icon: "shopping-bag" },
  { name: "Entertainment", keywords: ["netflix", "spotify", "hulu", "disney", "cinema", "theater", "concert", "ticket", "game", "steam", "youtube", "twitch"], color: "#ec4899", icon: "tv" },
  { name: "Health & Medical", keywords: ["pharmacy", "doctor", "hospital", "dental", "cvs", "walgreens", "medical", "health", "clinic", "urgent care", "gym", "fitness"], color: "#ef4444", icon: "heart" },
  { name: "Utilities & Bills", keywords: ["electric", "water", "internet", "phone", "cable", "insurance", "at&t", "verizon", "comcast", "xfinity", "t-mobile", "pge", "con ed"], color: "#64748b", icon: "zap" },
  { name: "Income", keywords: ["payroll", "salary", "direct deposit", "venmo", "zelle", "transfer in", "refund", "interest", "dividend", "deposit"], color: "#10b981", icon: "trending-up" },
  { name: "Travel", keywords: ["airline", "hotel", "airbnb", "flight", "booking", "expedia", "delta", "american air", "united", "marriott", "hilton", "vrbo"], color: "#0ea5e9", icon: "plane" },
  { name: "Other", keywords: [], color: "#94a3b8", icon: "tag" },
];

function getOpenAIClient(): OpenAI | null {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseURL || !apiKey) return null;
  return new OpenAI({ baseURL, apiKey });
}

function keywordMatch(description: string, categories: typeof DEFAULT_CATEGORIES): { name: string; score: number } {
  const descLower = description.toLowerCase();
  let best = { name: "Other", score: 0 };
  for (const cat of categories) {
    if (cat.name === "Other") continue;
    let score = 0;
    for (const kw of cat.keywords) {
      if (descLower.includes(kw.toLowerCase())) score++;
    }
    if (score > best.score) best = { name: cat.name, score };
  }
  return best;
}

async function aiCategorize(description: string, categoryNames: string[]): Promise<string | null> {
  const client = getOpenAIClient();
  if (!client) return null;
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-5-mini",
      messages: [
        {
          role: "system",
          content: `You are a financial transaction classifier. Given a transaction description, output ONLY the single most appropriate category name from the list below. Output nothing else — no explanation, no punctuation, just the category name exactly as written.

Categories: ${categoryNames.filter((n) => n !== "Other").join(", ")}, Other`,
        },
        {
          role: "user",
          content: description,
        },
      ],
    });
    const result = completion.choices[0]?.message?.content?.trim() ?? null;
    if (result && categoryNames.some((n) => n.toLowerCase() === result.toLowerCase())) {
      return categoryNames.find((n) => n.toLowerCase() === result.toLowerCase()) ?? null;
    }
    return null;
  } catch (err) {
    console.error("[AI categorize] error:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

// GET /api/users/:userId/categories
router.get("/", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "bad_request", message: "Invalid user ID." });

  let categories = await db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId));

  if (categories.length === 0) {
    const defaults = DEFAULT_CATEGORIES.map((c) => ({ ...c, userId, isSystem: true, isAi: false }));
    categories = await db.insert(categoriesTable).values(defaults).returning();
  }

  return res.json(categories);
});

// POST /api/users/:userId/categories
router.post("/", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "bad_request", message: "Invalid user ID." });

  const { name, keywords, color, icon } = req.body as { name?: string; keywords?: string[]; color?: string; icon?: string };
  if (!name?.trim()) return res.status(400).json({ error: "bad_request", message: "Category name is required." });

  const [cat] = await db.insert(categoriesTable).values({
    userId, name: name.trim(),
    keywords: keywords ?? [],
    color: color ?? "#3b82f6",
    icon: icon ?? "tag",
    isSystem: false, isAi: false,
  }).returning();

  return res.status(201).json(cat);
});

// PATCH /api/users/:userId/categories/:id
router.patch("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const { name, keywords, color, icon } = req.body as { name?: string; keywords?: string[]; color?: string; icon?: string };

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if (keywords !== undefined) updates.keywords = keywords;
  if (color !== undefined) updates.color = color;
  if (icon !== undefined) updates.icon = icon;

  if (Object.keys(updates).length === 0) return res.status(400).json({ error: "bad_request", message: "Nothing to update." });

  const [updated] = await db.update(categoriesTable).set(updates).where(eq(categoriesTable.id, id)).returning();
  if (!updated || updated.userId !== userId) return res.status(404).json({ error: "not_found" });
  return res.json(updated);
});

// DELETE /api/users/:userId/categories/:id
router.delete("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = parseInt(req.params.userId);
  const [deleted] = await db.delete(categoriesTable).where(eq(categoriesTable.id, id)).returning();
  if (!deleted || deleted.userId !== userId) return res.status(404).json({ error: "not_found" });
  return res.json({ success: true });
});

// POST /api/users/:userId/categories/categorize
// Classifies a transaction description using fast keyword matching with AI fallback.
router.post("/categorize", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "bad_request", message: "Invalid user ID." });

  const { description } = req.body as { description?: string };
  if (!description) return res.status(400).json({ error: "bad_request", message: "Description is required." });

  const categories = await db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId));
  const catList = categories.length > 0 ? categories : DEFAULT_CATEGORIES.map((c) => ({ ...c, id: 0, userId }));
  const categoryNames = catList.map((c) => c.name);
  const other = catList.find((c) => c.name === "Other");

  // Fast path: keyword matching
  const kwResult = keywordMatch(description, catList as typeof DEFAULT_CATEGORIES);
  if (kwResult.score >= 1) {
    const matched = catList.find((c) => c.name === kwResult.name);
    return res.json({
      categoryId: matched?.id ?? other?.id ?? null,
      categoryName: kwResult.name,
      confidence: kwResult.score,
      method: "keyword",
    });
  }

  // AI path: call GPT when keyword matching finds nothing
  const aiName = await aiCategorize(description, categoryNames);
  if (aiName) {
    const matched = catList.find((c) => c.name === aiName);
    return res.json({
      categoryId: matched?.id ?? other?.id ?? null,
      categoryName: aiName,
      confidence: 1,
      method: "ai",
    });
  }

  // Final fallback: Other
  return res.json({
    categoryId: other?.id ?? null,
    categoryName: "Other",
    confidence: 0,
    method: "fallback",
  });
});

export default router;
