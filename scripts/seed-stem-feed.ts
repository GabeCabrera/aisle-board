/**
 * Seed Script: Populate Stem Feed with Curated Wedding Inspiration
 *
 * Creates a "Stem Official" account with public boards featuring
 * free-to-use images from Unsplash for the explore feed.
 *
 * Run: set -a && source .env.local && npx tsx scripts/seed-stem-feed.ts
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
const unsplash = (url: string) => `${url}?w=800&q=80&auto=format&fit=crop`;

// Curated wedding inspiration data with VERIFIED working URLs
const STEM_BOARDS = [
  {
    name: "Dream Venues",
    description: "From rustic barns to elegant ballrooms - find your perfect setting.",
    boardType: "standard",
    ideas: [
      { title: "Garden Courtyard Ceremony", imageUrl: unsplash("https://images.unsplash.com/photo-1670529776180-60e4132ab90c"), tags: ["venue", "garden", "outdoor"] },
      { title: "Elegant Reception Hall", imageUrl: unsplash("https://images.unsplash.com/photo-1510076857177-7470076d4098"), tags: ["venue", "ballroom", "elegant"] },
      { title: "Lakeside Ceremony Setup", imageUrl: unsplash("https://images.unsplash.com/photo-1505944357431-27579db47558"), tags: ["venue", "lakeside", "outdoor"] },
      { title: "Poolside Reception", imageUrl: unsplash("https://images.unsplash.com/photo-1571268373914-e888c6dafeff"), tags: ["venue", "pool", "summer"] },
      { title: "Floral Aisle Decor", imageUrl: unsplash("https://images.unsplash.com/photo-1469371670807-013ccf25f16a"), tags: ["venue", "aisle", "florals"] },
      { title: "Estate Wedding", imageUrl: unsplash("https://images.unsplash.com/photo-1521543387600-c745f8e83d77"), tags: ["venue", "estate", "classic"] },
      { title: "Window View Ceremony", imageUrl: unsplash("https://images.unsplash.com/photo-1721677337543-37b07e7e28b5"), tags: ["venue", "indoor", "natural-light"] },
      { title: "Garden Gazebo", imageUrl: unsplash("https://images.unsplash.com/photo-1523438885200-e635ba2c371e"), tags: ["venue", "gazebo", "garden"] },
      { title: "Classic Venue Interior", imageUrl: unsplash("https://images.unsplash.com/photo-1524824267900-2fa9cbf7a506"), tags: ["venue", "classic", "indoor"] },
      { title: "Modern White Venue", imageUrl: unsplash("https://images.unsplash.com/photo-1625755568824-c27ef71d62a5"), tags: ["venue", "modern", "white"] },
    ],
  },
  {
    name: "Bridal Gowns",
    description: "Stunning wedding dress inspiration for every style bride.",
    boardType: "standard",
    ideas: [
      { title: "Classic Elegance", imageUrl: unsplash("https://images.unsplash.com/photo-1521467752200-3bccf80f16ed"), tags: ["dress", "classic", "elegant"] },
      { title: "Romantic Tulle Gown", imageUrl: unsplash("https://images.unsplash.com/photo-1585241920473-b472eb9ffbae"), tags: ["dress", "tulle", "romantic"] },
      { title: "Modern Minimalist", imageUrl: unsplash("https://images.unsplash.com/photo-1599142296733-1c1f2073e6de"), tags: ["dress", "modern", "minimal"] },
      { title: "Bohemian Beauty", imageUrl: unsplash("https://images.unsplash.com/photo-1622277430358-f4d134452e2e"), tags: ["dress", "boho", "flowy"] },
      { title: "Lace Details", imageUrl: unsplash("https://images.unsplash.com/photo-1579583764988-3e08c6132d2a"), tags: ["dress", "lace", "detail"] },
      { title: "Bridal Portrait", imageUrl: unsplash("https://images.unsplash.com/photo-1502955422409-06e43fd3eff3"), tags: ["dress", "portrait", "bride"] },
      { title: "Cathedral Train", imageUrl: unsplash("https://images.unsplash.com/flagged/photo-1578317767641-c2a23b16b814"), tags: ["dress", "train", "dramatic"] },
      { title: "Sleek and Sophisticated", imageUrl: unsplash("https://images.unsplash.com/photo-1557363763-8381968f8353"), tags: ["dress", "sleek", "modern"] },
      { title: "Garden Party Gown", imageUrl: unsplash("https://images.unsplash.com/photo-1621369663005-68a558655fad"), tags: ["dress", "garden", "romantic"] },
      { title: "Vintage Inspired", imageUrl: unsplash("https://images.unsplash.com/photo-1600287792237-3f66db635a73"), tags: ["dress", "vintage", "timeless"] },
      { title: "Flowing Silhouette", imageUrl: unsplash("https://images.unsplash.com/photo-1549488497-94b52bddac5d"), tags: ["dress", "flowing", "ethereal"] },
      { title: "Wedding Day Ready", imageUrl: unsplash("https://images.unsplash.com/photo-1593575620619-602b4ddf6e96"), tags: ["dress", "preparation", "bride"] },
    ],
  },
  {
    name: "Beautiful Bouquets",
    description: "Floral arrangements that will take your breath away.",
    boardType: "standard",
    ideas: [
      { title: "Classic White Elegance", imageUrl: unsplash("https://images.unsplash.com/photo-1521543832500-49e69fb2bea2"), tags: ["bouquet", "white", "classic"] },
      { title: "Romantic Blush Roses", imageUrl: unsplash("https://images.unsplash.com/photo-1521520368710-3ab197656d60"), tags: ["bouquet", "pink", "roses"] },
      { title: "Bridal Cascade", imageUrl: unsplash("https://images.unsplash.com/photo-1594149596808-e3b6174968b3"), tags: ["bouquet", "cascade", "elegant"] },
      { title: "Garden Fresh Mix", imageUrl: unsplash("https://images.unsplash.com/photo-1495610015663-83e7e5246070"), tags: ["bouquet", "garden", "mixed"] },
      { title: "Soft Pastels", imageUrl: unsplash("https://images.unsplash.com/photo-1522142540300-60ae5b4bc569"), tags: ["bouquet", "pastel", "romantic"] },
      { title: "Wild Flower Beauty", imageUrl: unsplash("https://images.unsplash.com/photo-1525258946800-98cfd641d0de"), tags: ["bouquet", "wildflowers", "natural"] },
      { title: "Modern Arrangement", imageUrl: unsplash("https://images.unsplash.com/photo-1595467959554-9ffcbf37f10f"), tags: ["bouquet", "modern", "artistic"] },
      { title: "Hand-Tied Bouquet", imageUrl: unsplash("https://images.unsplash.com/photo-1604531826103-7c626b90a5f4"), tags: ["bouquet", "hand-tied", "organic"] },
      { title: "Peony Perfection", imageUrl: unsplash("https://images.unsplash.com/photo-1700142611715-8a023c5eb8c5"), tags: ["bouquet", "peony", "lush"] },
      { title: "Greenery & White", imageUrl: unsplash("https://images.unsplash.com/photo-1578534102052-70f4c14ee0e7"), tags: ["bouquet", "greenery", "organic"] },
    ],
  },
  {
    name: "Stunning Cakes",
    description: "Wedding cake ideas from classic tiers to modern designs.",
    boardType: "standard",
    ideas: [
      { title: "Minimalist Three-Tier", imageUrl: unsplash("https://images.unsplash.com/photo-1535254973040-607b474cb50d"), tags: ["cake", "minimal", "modern"] },
      { title: "Elegant Floral Tiers", imageUrl: unsplash("https://images.unsplash.com/photo-1623428454614-abaf00244e52"), tags: ["cake", "floral", "elegant"] },
      { title: "Classic White Wedding", imageUrl: unsplash("https://images.unsplash.com/photo-1525257831700-183b9b8bf5c4"), tags: ["cake", "classic", "white"] },
      { title: "Naked Cake Style", imageUrl: unsplash("https://images.unsplash.com/photo-1565661834013-d196ca46e14e"), tags: ["cake", "rustic", "naked"] },
      { title: "Modern Geometric", imageUrl: unsplash("https://images.unsplash.com/photo-1655762755958-cc0e10095c24"), tags: ["cake", "modern", "geometric"] },
      { title: "Gold Accent Elegance", imageUrl: unsplash("https://images.unsplash.com/photo-1519654793190-2e8a4806f1f2"), tags: ["cake", "gold", "luxury"] },
      { title: "Buttercream Dream", imageUrl: unsplash("https://images.unsplash.com/photo-1604702433171-33756f3f3825"), tags: ["cake", "buttercream", "classic"] },
      { title: "Simple Sophistication", imageUrl: unsplash("https://images.unsplash.com/photo-1503525642560-ecca5e2e49e9"), tags: ["cake", "simple", "sophisticated"] },
      { title: "Romantic Rose Cascade", imageUrl: unsplash("https://images.unsplash.com/photo-1632396690014-cf7a0a2f3bbb"), tags: ["cake", "roses", "romantic"] },
      { title: "Garden Party Cake", imageUrl: unsplash("https://images.unsplash.com/photo-1627580358573-ea0c4a2cb199"), tags: ["cake", "garden", "florals"] },
      { title: "Textured Elegance", imageUrl: unsplash("https://images.unsplash.com/photo-1574538860416-baadc5d4ec57"), tags: ["cake", "texture", "elegant"] },
      { title: "Contemporary Design", imageUrl: unsplash("https://images.unsplash.com/photo-1678473289821-1818e3f82e9a"), tags: ["cake", "contemporary", "artistic"] },
    ],
  },
  {
    name: "Table Settings",
    description: "Reception tablescape inspiration for every aesthetic.",
    boardType: "standard",
    ideas: [
      { title: "Elegant Centerpieces", imageUrl: unsplash("https://images.unsplash.com/photo-1655386068478-e8283085cac7"), tags: ["table", "centerpiece", "elegant"] },
      { title: "Classic Reception Setup", imageUrl: unsplash("https://images.unsplash.com/photo-1559373098-518914f1c315"), tags: ["table", "classic", "reception"] },
      { title: "Romantic Candlelight", imageUrl: unsplash("https://images.unsplash.com/photo-1607781229400-4677b37a5f1b"), tags: ["table", "candles", "romantic"] },
      { title: "Modern Minimalist", imageUrl: unsplash("https://images.unsplash.com/photo-1544813617-d99b33c3e573"), tags: ["table", "minimal", "modern"] },
      { title: "Floral Runner", imageUrl: unsplash("https://images.unsplash.com/photo-1604004233302-14f58a92070b"), tags: ["table", "florals", "runner"] },
      { title: "Greenery & Gold", imageUrl: unsplash("https://images.unsplash.com/photo-1544813545-cbe51737035b"), tags: ["table", "greenery", "gold"] },
      { title: "Intimate Gathering", imageUrl: unsplash("https://images.unsplash.com/photo-1526134542648-bf109eeb1a01"), tags: ["table", "intimate", "cozy"] },
    ],
  },
  {
    name: "Invitations & Stationery",
    description: "Paper goods that set the tone for your celebration.",
    boardType: "standard",
    ideas: [
      { title: "Floral Flat Lay", imageUrl: unsplash("https://images.unsplash.com/photo-1632610992723-82d7c212f6d7"), tags: ["stationery", "floral", "flat-lay"] },
      { title: "Modern Minimalist", imageUrl: unsplash("https://images.unsplash.com/photo-1721176487015-5408ae0e9bc2"), tags: ["stationery", "modern", "minimal"] },
      { title: "Elegant Script", imageUrl: unsplash("https://images.unsplash.com/photo-1553013983-15241ab69e57"), tags: ["stationery", "calligraphy", "elegant"] },
      { title: "Complete Wedding Suite", imageUrl: unsplash("https://images.unsplash.com/photo-1656104717095-9d062b0d4e8d"), tags: ["stationery", "suite", "complete"] },
      { title: "Natural Paper Goods", imageUrl: unsplash("https://images.unsplash.com/photo-1612619732485-1ae018b63c55"), tags: ["stationery", "natural", "organic"] },
      { title: "Wax Seal Details", imageUrl: unsplash("https://images.unsplash.com/photo-1634055980590-1a44e5a8b3e4"), tags: ["stationery", "wax-seal", "detail"] },
      { title: "Vintage Inspired", imageUrl: unsplash("https://images.unsplash.com/photo-1697217866029-2aef7068ecee"), tags: ["stationery", "vintage", "classic"] },
      { title: "Botanical Design", imageUrl: unsplash("https://images.unsplash.com/photo-1633008460512-624a321c15b6"), tags: ["stationery", "botanical", "green"] },
      { title: "Ribbon Accents", imageUrl: unsplash("https://images.unsplash.com/photo-1646577132148-bab82662f86c"), tags: ["stationery", "ribbon", "romantic"] },
      { title: "Gold Foil Details", imageUrl: unsplash("https://images.unsplash.com/photo-1596751303335-ca42b3ca50c1"), tags: ["stationery", "gold", "luxury"] },
    ],
  },
  {
    name: "Ceremony Moments",
    description: "Capturing the magic of saying 'I do'.",
    boardType: "standard",
    ideas: [
      { title: "First Dance", imageUrl: unsplash("https://images.unsplash.com/photo-1583939411023-14783179e581"), tags: ["ceremony", "dance", "romantic"] },
      { title: "Chandelier Elegance", imageUrl: unsplash("https://images.unsplash.com/photo-1723832347953-83c28e2d4dd2"), tags: ["ceremony", "chandelier", "elegant"] },
      { title: "Outdoor Celebration", imageUrl: unsplash("https://images.unsplash.com/photo-1507915977619-6ccfe8003ae6"), tags: ["ceremony", "outdoor", "joy"] },
      { title: "Fall Ceremony Setup", imageUrl: unsplash("https://images.unsplash.com/photo-1595407753234-0882f1e77954"), tags: ["ceremony", "fall", "seasonal"] },
      { title: "Couple Portrait", imageUrl: unsplash("https://images.unsplash.com/photo-1583939003579-730e3918a45a"), tags: ["ceremony", "portrait", "couple"] },
      { title: "Walking Down the Aisle", imageUrl: unsplash("https://images.unsplash.com/photo-1523369579000-4ec0fe04db44"), tags: ["ceremony", "aisle", "bride"] },
      { title: "Floral Altar", imageUrl: unsplash("https://images.unsplash.com/photo-1469371670807-013ccf25f16a"), tags: ["ceremony", "altar", "florals"] },
      { title: "Intimate Exchange", imageUrl: unsplash("https://images.unsplash.com/photo-1606490208247-b65be3d94cd1"), tags: ["ceremony", "intimate", "vows"] },
      { title: "Golden Hour Magic", imageUrl: unsplash("https://images.unsplash.com/photo-1606800052052-a08af7148866"), tags: ["ceremony", "golden-hour", "romantic"] },
      { title: "Candlelit Evening", imageUrl: unsplash("https://images.unsplash.com/photo-1588849538263-fbc2b7b8965f"), tags: ["ceremony", "evening", "candles"] },
      { title: "Sunset Vows", imageUrl: unsplash("https://images.unsplash.com/photo-1606217239582-d9f72323bcd7"), tags: ["ceremony", "sunset", "romantic"] },
      { title: "Garden Gazebo", imageUrl: unsplash("https://images.unsplash.com/photo-1523438885200-e635ba2c371e"), tags: ["ceremony", "gazebo", "garden"] },
    ],
  },
  {
    name: "Rings & Details",
    description: "The little things that mean everything.",
    boardType: "standard",
    ideas: [
      { title: "Classic Gold Bands", imageUrl: unsplash("https://images.unsplash.com/photo-1606800052052-a08af7148866"), tags: ["rings", "gold", "classic"] },
      { title: "Ring on Roses", imageUrl: unsplash("https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8"), tags: ["rings", "florals", "detail"] },
      { title: "Elegant Ring Display", imageUrl: unsplash("https://images.unsplash.com/photo-1554047310-ab6170fc7b10"), tags: ["rings", "display", "elegant"] },
      { title: "Invitation Details", imageUrl: unsplash("https://images.unsplash.com/photo-1553915632-175f60dd8e36"), tags: ["rings", "stationery", "flat-lay"] },
      { title: "Solitaire Beauty", imageUrl: unsplash("https://images.unsplash.com/photo-1622398925373-3f91b1e275f5"), tags: ["rings", "solitaire", "diamond"] },
      { title: "Hands Together", imageUrl: unsplash("https://images.unsplash.com/photo-1529634597503-139d3726fed5"), tags: ["rings", "couple", "hands"] },
      { title: "Wedding Band Set", imageUrl: unsplash("https://images.unsplash.com/photo-1654699643507-3047b3e07045"), tags: ["rings", "bands", "pair"] },
      { title: "Silver Elegance", imageUrl: unsplash("https://images.unsplash.com/photo-1562249004-1f7289c19c49"), tags: ["rings", "silver", "modern"] },
      { title: "Ring Close-up", imageUrl: unsplash("https://images.unsplash.com/photo-1605089315599-ca966e96b56a"), tags: ["rings", "close-up", "detail"] },
      { title: "Vintage Style Set", imageUrl: unsplash("https://images.unsplash.com/photo-1565034582189-195bb0084dcf"), tags: ["rings", "vintage", "set"] },
      { title: "Matching Bands", imageUrl: unsplash("https://images.unsplash.com/photo-1627293509201-cd0c780043e6"), tags: ["rings", "matching", "couple"] },
      { title: "Ring Box Moment", imageUrl: unsplash("https://images.unsplash.com/photo-1637616919953-5943e10bd4bf"), tags: ["rings", "box", "moment"] },
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
