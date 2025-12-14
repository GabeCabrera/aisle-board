/**
 * AI Vendor Enrichment Service
 *
 * Scrapes vendor websites and uses Claude to extract structured vendor information
 */

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export interface EnrichedWebVendor {
  id: string; // Generated from URL hash
  name: string;
  slug: string;
  website: string;
  description: string | null;
  profileImage: string | null;
  coverImage: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  priceRange: string | null;
  category: string;
  isFromWeb: true;
  // Additional fields to match VendorProfile shape
  isVerified: false;
  isFeatured: false;
  averageRating: null;
  reviewCount: number;
  saveCount: number;
}

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  pagemap?: {
    metatags?: Array<{
      "og:image"?: string;
      "og:description"?: string;
      "og:title"?: string;
    }>;
    cse_image?: Array<{ src: string }>;
  };
}

/**
 * Search Google for wedding vendors
 */
export async function searchGoogleForVendors(
  category: string,
  location: string,
  count: number
): Promise<GoogleSearchResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !cx) {
    console.warn("Google Search API not configured");
    return [];
  }

  const query = `wedding ${category} ${location}`;

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=${Math.min(count, 10)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || !data.items) {
      console.error("Google search error:", data.error?.message || "No results");
      return [];
    }

    return data.items;
  } catch (error) {
    console.error("Google search failed:", error);
    return [];
  }
}

/**
 * Fetch HTML content from a URL
 */
async function fetchWebpage(url: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WeddingPlannerBot/1.0)",
        Accept: "text/html",
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const html = await res.text();
    // Limit HTML size to prevent token overflow
    return html.slice(0, 50000);
  } catch (error) {
    console.error(`Failed to fetch ${url}:`, error);
    return null;
  }
}

/**
 * Generate a slug from vendor name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
}

/**
 * Generate a deterministic ID from URL
 */
function generateIdFromUrl(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `web-${Math.abs(hash).toString(36)}`;
}

/**
 * Use Claude to extract vendor information from HTML
 */
async function extractVendorInfoWithAI(
  html: string,
  category: string,
  url: string,
  fallbackData: { title: string; snippet: string; ogImage?: string }
): Promise<EnrichedWebVendor | null> {
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this wedding vendor webpage and extract information. Return ONLY valid JSON with no explanation.

URL: ${url}
Category: ${category}

HTML Content:
${html.slice(0, 30000)}

Extract and return this JSON structure:
{
  "name": "Business name (string)",
  "description": "1-2 sentence description of their services (string or null)",
  "city": "City name (string or null)",
  "state": "State abbreviation like CA, NY, UT (string or null)",
  "phone": "Phone number (string or null)",
  "email": "Email address (string or null)",
  "priceRange": "One of: $, $$, $$$, $$$$ based on any pricing clues (string or null)",
  "profileImage": "Best logo or team photo URL (string or null)",
  "coverImage": "Best portfolio/hero image URL (string or null)"
}

Guidelines:
- For name, use the actual business name, not the page title
- For images, use absolute URLs (add domain if needed)
- For state, use 2-letter abbreviation
- For priceRange, infer from pricing if mentioned
- If you can't find a field, use null

Fallback info from search:
- Title: ${fallbackData.title}
- Snippet: ${fallbackData.snippet}`,
        },
      ],
    });

    const textContent = response.content.find((c) => c.type === "text");
    if (!textContent || textContent.type !== "text") return null;

    // Parse JSON from response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const extracted = JSON.parse(jsonMatch[0]);

    // Build the enriched vendor object
    const name = extracted.name || fallbackData.title.split("|")[0].split("-")[0].trim();
    const enrichedVendor: EnrichedWebVendor = {
      id: generateIdFromUrl(url),
      name,
      slug: generateSlug(name),
      website: url,
      description: extracted.description || fallbackData.snippet || null,
      profileImage: extracted.profileImage || fallbackData.ogImage || null,
      coverImage: extracted.coverImage || extracted.profileImage || fallbackData.ogImage || null,
      city: extracted.city || null,
      state: extracted.state || null,
      phone: extracted.phone || null,
      email: extracted.email || null,
      priceRange: extracted.priceRange || null,
      category,
      isFromWeb: true,
      isVerified: false,
      isFeatured: false,
      averageRating: null,
      reviewCount: 0,
      saveCount: 0,
    };

    return enrichedVendor;
  } catch (error) {
    console.error("AI extraction failed:", error);
    return null;
  }
}

/**
 * Create a basic vendor from search result without AI enrichment
 */
function createBasicVendorFromSearch(
  result: GoogleSearchResult,
  category: string
): EnrichedWebVendor {
  const name = result.title.split("|")[0].split("-")[0].split("–")[0].trim();
  const ogImage = result.pagemap?.metatags?.[0]?.["og:image"] || result.pagemap?.cse_image?.[0]?.src;

  return {
    id: generateIdFromUrl(result.link),
    name,
    slug: generateSlug(name),
    website: result.link,
    description: result.snippet || null,
    profileImage: ogImage || null,
    coverImage: ogImage || null,
    city: null,
    state: null,
    phone: null,
    email: null,
    priceRange: null,
    category,
    isFromWeb: true,
    isVerified: false,
    isFeatured: false,
    averageRating: null,
    reviewCount: 0,
    saveCount: 0,
  };
}

/**
 * Enrich a single vendor from search result
 */
export async function enrichVendorFromSearchResult(
  result: GoogleSearchResult,
  category: string
): Promise<EnrichedWebVendor> {
  const ogImage = result.pagemap?.metatags?.[0]?.["og:image"] || result.pagemap?.cse_image?.[0]?.src;

  // Try to fetch and parse the webpage
  const html = await fetchWebpage(result.link);

  if (html) {
    const enriched = await extractVendorInfoWithAI(html, category, result.link, {
      title: result.title,
      snippet: result.snippet,
      ogImage,
    });

    if (enriched) {
      return enriched;
    }
  }

  // Fallback to basic vendor from search result
  return createBasicVendorFromSearch(result, category);
}

/**
 * Search and enrich vendors from the web
 */
export async function searchAndEnrichWebVendors(
  category: string,
  location: string,
  count: number
): Promise<EnrichedWebVendor[]> {
  // Search Google
  const searchResults = await searchGoogleForVendors(category, location, count);

  if (searchResults.length === 0) {
    return [];
  }

  // Enrich each result in parallel (with concurrency limit)
  const enrichmentPromises = searchResults.slice(0, count).map((result) =>
    enrichVendorFromSearchResult(result, category)
  );

  const enrichedVendors = await Promise.all(enrichmentPromises);

  // Filter out any null results
  return enrichedVendors.filter((v): v is EnrichedWebVendor => v !== null);
}
