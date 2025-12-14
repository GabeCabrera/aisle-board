/**
 * Seed Script: Populate Stem Feed with Curated Wedding Inspiration
 *
 * Creates a "Stem Official" account with public boards featuring
 * free-to-use images from Unsplash for the explore feed.
 *
 * Run: npx tsx scripts/seed-stem-feed.ts
 */

import "dotenv/config";
import { resolve } from "path";
import { config } from "dotenv";
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "../lib/db";
import { boards, ideas, tenants, users } from "../lib/db/schema";
import { eq } from "drizzle-orm";
import * as bcrypt from "bcryptjs";

const STEM_OFFICIAL_SLUG = "stem-official";
const STEM_OFFICIAL_EMAIL = "official@scribeand.stem";

// Helper to construct Unsplash URLs with optimization
const unsplash = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;

// Curated wedding inspiration data
const STEM_BOARDS = [
  {
    name: "Dream Venues",
    description: "From rustic barns to elegant ballrooms - find your perfect setting.",
    boardType: "standard",
    ideas: [
      { title: "Elegant Ballroom Reception", imageUrl: unsplash("neAMdikyhEQ"), tags: ["venue", "ballroom", "elegant"] },
      { title: "Garden Courtyard Ceremony", imageUrl: unsplash("aRQrz0fclB8"), tags: ["venue", "garden", "outdoor"] },
      { title: "Lakeside Ceremony Setup", imageUrl: unsplash("jTnipV64uLo"), tags: ["venue", "lakeside", "outdoor"] },
      { title: "Rustic Barn Entrance", imageUrl: unsplash("rMZoTaUitlA"), tags: ["venue", "barn", "rustic"] },
      { title: "Poolside Reception", imageUrl: unsplash("RpUcPmG46vw"), tags: ["venue", "pool", "summer"] },
      { title: "Estate Wedding", imageUrl: unsplash("UxCS2kVhZTc"), tags: ["venue", "estate", "classic"] },
      { title: "Intimate Candlelit Dinner", imageUrl: unsplash("AGkaDjG5hg0"), tags: ["venue", "intimate", "romantic"] },
      { title: "Window View Ceremony", imageUrl: unsplash("vcshPRvJpwo"), tags: ["venue", "indoor", "natural-light"] },
      { title: "Garden Gazebo", imageUrl: unsplash("K8KiCHh4WU4"), tags: ["venue", "gazebo", "garden"] },
      { title: "Barn Interior Magic", imageUrl: unsplash("oft_BJ6gnrg"), tags: ["venue", "barn", "couple"] },
    ],
  },
  {
    name: "Bridal Gowns",
    description: "Stunning wedding dress inspiration for every style bride.",
    boardType: "standard",
    ideas: [
      { title: "Classic A-Line Silhouette", imageUrl: unsplash("qSgqgOfKZB4"), tags: ["dress", "classic", "a-line"] },
      { title: "Romantic Lace Details", imageUrl: unsplash("KRPCwGCzUJs"), tags: ["dress", "lace", "romantic"] },
      { title: "Modern Minimalist", imageUrl: unsplash("-shn8ecaH2w"), tags: ["dress", "modern", "minimal"] },
      { title: "Dreamy Tulle Gown", imageUrl: unsplash("Yy1tmz_G3uQ"), tags: ["dress", "tulle", "princess"] },
      { title: "Elegant Train", imageUrl: unsplash("R2txNeMEs_I"), tags: ["dress", "train", "elegant"] },
      { title: "Bohemian Beauty", imageUrl: unsplash("zGtGfqQqe6U"), tags: ["dress", "boho", "flowy"] },
      { title: "Vintage Inspired", imageUrl: unsplash("QKYxgkaTmQk"), tags: ["dress", "vintage", "timeless"] },
      { title: "Sleek and Sophisticated", imageUrl: unsplash("KRM-2sIbgMI"), tags: ["dress", "sleek", "modern"] },
      { title: "Romantic Off-Shoulder", imageUrl: unsplash("tCZg7Foz5hA"), tags: ["dress", "romantic", "off-shoulder"] },
      { title: "Garden Party Gown", imageUrl: unsplash("7wjxyiUvt4I"), tags: ["dress", "garden", "floral"] },
      { title: "Cathedral Veil", imageUrl: unsplash("cW6WOyXbIeU"), tags: ["dress", "veil", "cathedral"] },
      { title: "Bridal Portrait", imageUrl: unsplash("Ey0daypzVBo"), tags: ["dress", "portrait", "bride"] },
    ],
  },
  {
    name: "Beautiful Bouquets",
    description: "Floral arrangements that will take your breath away.",
    boardType: "standard",
    ideas: [
      { title: "Classic White Elegance", imageUrl: unsplash("AdKsp_FzTYE"), tags: ["bouquet", "white", "classic"] },
      { title: "Romantic Blush Roses", imageUrl: unsplash("295NLwGdrKM"), tags: ["bouquet", "pink", "roses"] },
      { title: "Garden Fresh Mix", imageUrl: unsplash("HP9_dGIQEik"), tags: ["bouquet", "garden", "mixed"] },
      { title: "Soft Pink & White", imageUrl: unsplash("QmwV53wTxHc"), tags: ["bouquet", "pink", "soft"] },
      { title: "Bridal Cascade", imageUrl: unsplash("aOtnf2BU4sY"), tags: ["bouquet", "cascade", "elegant"] },
      { title: "Wild Flower Beauty", imageUrl: unsplash("pTrHHGrxeOE"), tags: ["bouquet", "wildflowers", "natural"] },
      { title: "Red Rose Statement", imageUrl: unsplash("uAzTOItl26I"), tags: ["bouquet", "red", "dramatic"] },
      { title: "Delicate Pastels", imageUrl: unsplash("8yPA6ZYq0-s"), tags: ["bouquet", "pastel", "romantic"] },
      { title: "Greenery & White", imageUrl: unsplash("UQl_-yabQiA"), tags: ["bouquet", "greenery", "organic"] },
      { title: "Peony Perfection", imageUrl: unsplash("MSOnEL7uGPw"), tags: ["bouquet", "peony", "lush"] },
    ],
  },
  {
    name: "Stunning Cakes",
    description: "Wedding cake ideas from classic tiers to modern designs.",
    boardType: "standard",
    ideas: [
      { title: "Rustic Wooden Display", imageUrl: unsplash("d1hmd6N3448"), tags: ["cake", "rustic", "wood"] },
      { title: "Classic Four-Tier", imageUrl: unsplash("fXAuCMEYGY4"), tags: ["cake", "classic", "tiered"] },
      { title: "Fresh Strawberry Delight", imageUrl: unsplash("Xb5c2x6wJPc"), tags: ["cake", "fruit", "summer"] },
      { title: "Elegant Floral Tiers", imageUrl: unsplash("U7N6XFvTBjU"), tags: ["cake", "floral", "elegant"] },
      { title: "Greenery Topped", imageUrl: unsplash("DtINiuJqB_w"), tags: ["cake", "greenery", "natural"] },
      { title: "Fig & Flower Autumn", imageUrl: unsplash("4on47p0-bk4"), tags: ["cake", "autumn", "figs"] },
      { title: "Cake Cutting Moment", imageUrl: unsplash("wk9iC7_keLY"), tags: ["cake", "moment", "couple"] },
      { title: "Minimalist Three-Tier", imageUrl: unsplash("22JxStzTxwo"), tags: ["cake", "minimal", "modern"] },
      { title: "Garden Party Cake", imageUrl: unsplash("UDRFLKSCY-c"), tags: ["cake", "garden", "florals"] },
      { title: "Romantic Rose Cascade", imageUrl: unsplash("7ePjhwxtxCU"), tags: ["cake", "roses", "romantic"] },
      { title: "Modern Fondant Art", imageUrl: unsplash("CeKaBzyvxxI"), tags: ["cake", "modern", "artistic"] },
      { title: "Traditional Cutting", imageUrl: unsplash("Hps0j8Uu8Us"), tags: ["cake", "tradition", "couple"] },
    ],
  },
  {
    name: "Table Settings",
    description: "Reception tablescape inspiration for every aesthetic.",
    boardType: "standard",
    ideas: [
      { title: "Fresh Floral Centerpiece", imageUrl: unsplash("0KGLv110IUA"), tags: ["table", "centerpiece", "pink"] },
      { title: "Formal Dinner Setup", imageUrl: unsplash("3NLJXvQfdc0"), tags: ["table", "formal", "elegant"] },
      { title: "Grand Chandelier Hall", imageUrl: unsplash("7BTo4Nam3IE"), tags: ["table", "chandelier", "grand"] },
      { title: "Long Table Blue Accents", imageUrl: unsplash("YKBT8rRAzpU"), tags: ["table", "blue", "florals"] },
      { title: "Purple Elegance", imageUrl: unsplash("OIUBcKw0ArM"), tags: ["table", "purple", "moody"] },
      { title: "Classic Place Setting", imageUrl: unsplash("g5l5lBEKm1U"), tags: ["table", "place-setting", "classic"] },
      { title: "Ballroom Grandeur", imageUrl: unsplash("iXTkKQyVqbM"), tags: ["table", "ballroom", "luxury"] },
      { title: "Natural Greenery Touch", imageUrl: unsplash("_iiVGXjMbsU"), tags: ["table", "greenery", "organic"] },
      { title: "Romantic Candlelight", imageUrl: unsplash("OvNJPVfxMcc"), tags: ["table", "candles", "romantic"] },
      { title: "Personalized Place Cards", imageUrl: unsplash("QE1H41_xAzg"), tags: ["table", "details", "personal"] },
      { title: "Beach Wedding Table", imageUrl: unsplash("GZSVj0NkeSM"), tags: ["table", "beach", "destination"] },
      { title: "Intimate Gathering", imageUrl: unsplash("b-Tpxy0mQ6M"), tags: ["table", "intimate", "simple"] },
    ],
  },
  {
    name: "Invitations & Stationery",
    description: "Paper goods that set the tone for your celebration.",
    boardType: "standard",
    ideas: [
      { title: "Floral Flat Lay", imageUrl: unsplash("LeaaP6KgeYQ"), tags: ["stationery", "floral", "flat-lay"] },
      { title: "Modern Black & White", imageUrl: unsplash("a0BlHWem6l0"), tags: ["stationery", "modern", "black"] },
      { title: "Complete Wedding Suite", imageUrl: unsplash("8HX_r68ZM58"), tags: ["stationery", "suite", "complete"] },
      { title: "Elegant Bridal Details", imageUrl: unsplash("BiT7NBELhTg"), tags: ["stationery", "details", "bridal"] },
      { title: "Green & Gold Suite", imageUrl: unsplash("HIw5gIcoJoo"), tags: ["stationery", "green", "gold"] },
      { title: "Minimalist Design", imageUrl: unsplash("skQTL_S7-NE"), tags: ["stationery", "minimal", "clean"] },
      { title: "Calligraphy Details", imageUrl: unsplash("UR_SbilElPs"), tags: ["stationery", "calligraphy", "elegant"] },
      { title: "Winter White", imageUrl: unsplash("W4ROulrlhE4"), tags: ["stationery", "winter", "white"] },
      { title: "Vintage Ribbon Accent", imageUrl: unsplash("a33vkVuM1uA"), tags: ["stationery", "vintage", "ribbon"] },
      { title: "Garden Florals", imageUrl: unsplash("FNOsfYdhzeQ"), tags: ["stationery", "garden", "florals"] },
    ],
  },
  {
    name: "Ceremony Moments",
    description: "Capturing the magic of saying 'I do'.",
    boardType: "standard",
    ideas: [
      { title: "Outdoor Aisle Setup", imageUrl: unsplash("WsckrpQh2S0"), tags: ["ceremony", "outdoor", "aisle"] },
      { title: "Garden Arch Backdrop", imageUrl: unsplash("riHGdvluDk8"), tags: ["ceremony", "arch", "garden"] },
      { title: "Church Ceremony", imageUrl: unsplash("SI3oKGfzMjk"), tags: ["ceremony", "church", "traditional"] },
      { title: "Sunset Vows", imageUrl: unsplash("y4bE8ST_CTg"), tags: ["ceremony", "sunset", "romantic"] },
      { title: "Intimate Exchange", imageUrl: unsplash("ijuTbtiGh5w"), tags: ["ceremony", "intimate", "vows"] },
      { title: "Floral Altar", imageUrl: unsplash("JFAPl7brL6U"), tags: ["ceremony", "altar", "florals"] },
      { title: "Walking Down the Aisle", imageUrl: unsplash("dvF6s1H1x68"), tags: ["ceremony", "aisle", "bride"] },
      { title: "First Kiss", imageUrl: unsplash("cpa3-3UPfC8"), tags: ["ceremony", "kiss", "moment"] },
      { title: "Beach Ceremony", imageUrl: unsplash("hozd6nji98A"), tags: ["ceremony", "beach", "destination"] },
      { title: "Floral Ceremony Decor", imageUrl: unsplash("fJzmPe-a0eU"), tags: ["ceremony", "decor", "florals"] },
      { title: "Rustic Outdoor Setup", imageUrl: unsplash("lR--zjgQRY0"), tags: ["ceremony", "rustic", "outdoor"] },
      { title: "Candlelit Evening", imageUrl: unsplash("8vaQKYnawHw"), tags: ["ceremony", "evening", "candles"] },
    ],
  },
  {
    name: "Rings & Details",
    description: "The little things that mean everything.",
    boardType: "standard",
    ideas: [
      { title: "Classic Solitaire", imageUrl: unsplash("WHUG4KXCbuI"), tags: ["rings", "solitaire", "classic"] },
      { title: "Rings on Invitation", imageUrl: unsplash("8vaQKYnawHw"), tags: ["rings", "details", "stationery"] },
      { title: "Ring Box Display", imageUrl: unsplash("M2T1j-6Fn8w"), tags: ["rings", "box", "display"] },
      { title: "Wedding Band Set", imageUrl: unsplash("AKbE5xlIZXA"), tags: ["rings", "bands", "pair"] },
      { title: "Rose Gold Beauty", imageUrl: unsplash("-Kc29c7lCBA"), tags: ["rings", "rose-gold", "modern"] },
      { title: "Ring Exchange Moment", imageUrl: unsplash("YeJWDWeIZho"), tags: ["rings", "exchange", "moment"] },
      { title: "Vintage Style Ring", imageUrl: unsplash("ZYet8yoepik"), tags: ["rings", "vintage", "unique"] },
      { title: "Emerald Cut Diamond", imageUrl: unsplash("N1CZNuM_Fd8"), tags: ["rings", "emerald-cut", "elegant"] },
      { title: "Hands Together", imageUrl: unsplash("a--udXtK6x0"), tags: ["rings", "couple", "hands"] },
      { title: "Ring Bearer Pillow", imageUrl: unsplash("Ci9LwmMEyeI"), tags: ["rings", "pillow", "ceremony"] },
      { title: "Flat Lay Details", imageUrl: unsplash("jZrfY30y6Kc"), tags: ["rings", "flat-lay", "details"] },
      { title: "Diamond Close-up", imageUrl: unsplash("2lQQkvY9G5k"), tags: ["rings", "diamond", "sparkle"] },
    ],
  },
];

async function seedStemFeed() {
  console.log("🌱 Seeding Stem feed with curated inspiration...\n");

  // Check if Stem Official tenant exists
  let tenant = await db.query.tenants.findFirst({
    where: eq(tenants.slug, STEM_OFFICIAL_SLUG),
  });

  if (!tenant) {
    console.log("Creating Stem Official account...");

    // Create the official tenant
    const [newTenant] = await db.insert(tenants).values({
      displayName: "Stem Official",
      slug: STEM_OFFICIAL_SLUG,
      plan: "yearly", // Give full access
      hasLegacyAccess: true,
    }).returning();

    tenant = newTenant;

    // Create a system user for this tenant
    const passwordHash = await bcrypt.hash("stem-official-2024-secure", 12);
    await db.insert(users).values({
      tenantId: tenant.id,
      email: STEM_OFFICIAL_EMAIL,
      passwordHash,
      name: "Stem Official",
      role: "owner",
    });

    console.log(`✓ Created tenant: ${tenant.displayName} (${tenant.id})`);
  } else {
    console.log(`Found existing tenant: ${tenant.displayName}`);
  }

  // Clear existing boards for this tenant
  console.log("Clearing existing boards...");
  await db.delete(boards).where(eq(boards.tenantId, tenant.id));

  // Create boards and ideas
  let totalIdeas = 0;
  for (const [index, boardData] of STEM_BOARDS.entries()) {
    console.log(`Creating board: ${boardData.name}`);

    const [board] = await db.insert(boards).values({
      tenantId: tenant.id,
      name: boardData.name,
      description: boardData.description,
      boardType: boardData.boardType,
      position: index,
      isPublic: true, // Make all boards public for the explore feed
    }).returning();

    // Add ideas to this board
    for (const ideaData of boardData.ideas) {
      await db.insert(ideas).values({
        boardId: board.id,
        title: ideaData.title,
        imageUrl: ideaData.imageUrl,
        tags: ideaData.tags,
      });
      totalIdeas++;
    }

    console.log(`  ✓ Added ${boardData.ideas.length} ideas`);
  }

  console.log(`\n✨ Stem feed seeded successfully!`);
  console.log(`   - ${STEM_BOARDS.length} boards created`);
  console.log(`   - ${totalIdeas} ideas added`);
  console.log(`   - All boards are PUBLIC and will appear in the explore feed`);
}

seedStemFeed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error seeding Stem feed:", err);
    process.exit(1);
  });
