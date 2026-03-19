import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { categoriesTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";

const router: IRouter = Router({ mergeParams: true });

const DEFAULT_CATEGORIES = [
  { name: "Food & Dining", keywords: ["restaurant", "cafe", "coffee", "pizza", "burger", "grubhub", "doordash", "uber eats", "mcdonald", "starbucks", "chipotle", "subway"], color: "#f97316", icon: "utensils" },
  { name: "Groceries", keywords: ["grocery", "supermarket", "whole foods", "kroger", "publix", "trader joe", "walmart", "target", "aldi", "costco", "safeway"], color: "#22c55e", icon: "shopping-cart" },
  { name: "Transportation", keywords: ["gas", "uber", "lyft", "taxi", "parking", "toll", "transit", "metro", "fuel", "shell", "bp", "exxon", "chevron"], color: "#3b82f6", icon: "car" },
  { name: "Shopping", keywords: ["amazon", "ebay", "etsy", "best buy", "apple", "mall", "clothing", "shoes", "nike", "zara", "h&m"], color: "#8b5cf6", icon: "shopping-bag" },
  { name: "Entertainment", keywords: ["netflix", "spotify", "hulu", "disney", "cinema", "theater", "concert", "ticket", "game", "steam"], color: "#ec4899", icon: "tv" },
  { name: "Health & Medical", keywords: ["pharmacy", "doctor", "hospital", "dental", "cvs", "walgreens", "medical", "health", "clinic", "urgent care"], color: "#ef4444", icon: "heart" },
  { name: "Utilities & Bills", keywords: ["electric", "water", "internet", "phone", "cable", "insurance", "at&t", "verizon", "comcast", "xfinity"], color: "#64748b", icon: "zap" },
  { name: "Income", keywords: ["payroll", "salary", "direct deposit", "venmo", "zelle", "transfer", "refund", "interest", "dividend"], color: "#10b981", icon: "trending-up" },
  { name: "Travel", keywords: ["airline", "hotel", "airbnb", "flight", "booking", "expedia", "delta", "american air", "united", "marriott", "hilton"], color: "#0ea5e9", icon: "plane" },
  { name: "Other", keywords: [], color: "#94a3b8", icon: "tag" },
];

// GET /api/users/:userId/categories
router.get("/", async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: "bad_request", message: "Invalid user ID." });

  let categories = await db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId));

  // Seed defaults if none exist
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

// POST /api/users/:userId/categories/categorize — AI categorize a transaction description
router.post("/categorize", async (req, res) => {
  const userId = parseInt(req.params.userId);
  const { description } = req.body as { description?: string };
  if (!description) return res.status(400).json({ error: "bad_request", message: "Description is required." });

  const categories = await db.select().from(categoriesTable).where(eq(categoriesTable.userId, userId));
  if (categories.length === 0) return res.json({ categoryId: null, categoryName: "Other" });

  const descLower = description.toLowerCase();
  let best: { id: number; name: string } | null = null;
  let bestScore = 0;

  for (const cat of categories) {
    if (cat.name === "Other") continue;
    let score = 0;
    for (const kw of (cat.keywords as string[])) {
      if (descLower.includes(kw.toLowerCase())) score++;
    }
    if (score > bestScore) { bestScore = score; best = { id: cat.id, name: cat.name }; }
  }

  const other = categories.find((c) => c.name === "Other");
  return res.json({ categoryId: best?.id ?? other?.id ?? null, categoryName: best?.name ?? "Other", confidence: bestScore });
});

export default router;
