import "dotenv/config";
import { resolve } from "path";
import { config } from "dotenv";
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../lib/db";
import { boards, ideas, tenants } from "../lib/db/schema"; // Updated imports
import { eq } from "drizzle-orm";

const DEMO_SLUG = "emma-james-demo";

const INSPIRATION_DATA = [
  {
    name: "Modern Minimal",
    description: "Clean lines, neutral colors, and understated elegance.",
    ideas: [ // Updated from sparks
      {
        title: "Minimalist Table Setting",
        imageUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=800&auto=format&fit=crop",
        tags: ["table", "decor", "white"],
      },
      {
        title: "Modern Dress Detail",
        imageUrl: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?q=80&w=800&auto=format&fit=crop",
        tags: ["dress", "fashion", "simple"],
      },
      {
        title: "Elegant Stationery",
        imageUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop",
        tags: ["invitation", "paper", "modern"],
      },
      {
        title: "Simple Cake",
        imageUrl: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=80&w=800&auto=format&fit=crop",
        tags: ["cake", "food", "minimal"],
      },
    ],
  },
  {
    name: "Romantic Garden",
    description: "Soft pastels, lush florals, and outdoor whimsy.",
    ideas: [ // Updated from sparks
      {
        title: "Garden Ceremony Arch",
        imageUrl: "https://images.unsplash.com/photo-1519225468359-6963275409834-432f7b1728f2?q=80&w=800&auto=format&fit=crop",
        tags: ["ceremony", "flowers", "outdoor"],
      },
      {
        title: "Blush Bouquet",
        imageUrl: "https://images.unsplash.com/photo-1522673607200-16450625cd495?q=80&w=800&auto=format&fit=crop",
        tags: ["flowers", "bouquet", "pink"],
      },
      {
        title: "Outdoor Reception",
        imageUrl: "https://images.unsplash.com/photo-1511795409834-432f7b1728f2?q=80&w=800&auto=format&fit=crop",
        tags: ["reception", "lighting", "night"],
      },
      {
        title: "Floral Centerpiece",
        imageUrl: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?q=80&w=800&auto=format&fit=crop",
        tags: ["decor", "flowers", "table"],
      },
    ],
  },
  {
    name: "Boho Chic",
    description: "Earthy tones, dried florals, and relaxed vibes.",
    ideas: [ // Updated from sparks
      {
        title: "Boho Lace Dress",
        imageUrl: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?q=80&w=800&auto=format&fit=crop", // Reusing suitable image
        tags: ["dress", "lace", "vintage"],
      },
      {
        title: "Dried Flower Arrangement",
        imageUrl: "https://images.unsplash.com/photo-1532467349201-51b8f412bc59?q=80&w=800&auto=format&fit=crop",
        tags: ["flowers", "decor", "dried"],
      },
      {
        title: "Outdoor Lounge",
        imageUrl: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=800&auto=format&fit=crop",
        tags: ["reception", "lounge", "relax"],
      },
    ],
  },
];

async function seedInspo() {
  console.log("🎨 Seeding inspiration data...\n");

  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, DEMO_SLUG),
  });

  if (!tenant) {
    console.error("❌ Demo tenant not found. Run `pnpm db:seed` first.");
    process.exit(1);
  }

  console.log(`Found tenant: ${tenant.displayName}`);

  // Clear existing boards
  await db.delete(boards).where(eq(boards.tenantId, tenant.id)); // Updated table name
  console.log("Cleared existing boards."); // Updated message

  for (const [index, p] of INSPIRATION_DATA.entries()) {
    console.log(`Creating board: ${p.name}`); // Updated message
    
    const [board] = await db.insert(boards).values({
      tenantId: tenant.id,
      name: p.name,
      description: p.description,
      position: index,
      isPublic: true,
    }).returning();

    for (const s of p.ideas) { // Updated from p.sparks
      await db.insert(ideas).values({
        boardId: board.id, // Updated from paletteId
        title: s.title,
        imageUrl: s.imageUrl,
        tags: s.tags,
      });
    }
    console.log(`  - Added ${p.ideas.length} ideas`); // Updated message
  }

  console.log("\n✨ Inspiration seeded successfully!");
}

seedInspo()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error seeding inspiration:", err);
    process.exit(1);
  });