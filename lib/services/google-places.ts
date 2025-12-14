/**
 * Google Places API Integration Service
 *
 * Provides vendor data enrichment from Google Places API.
 * Tier-based: Free gets basic info, Premium gets photos + ratings.
 */

import { db } from "@/lib/db";
import { vendorProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Types
export interface PlaceSearchResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
  business_status?: string;
  types?: string[];
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  opening_hours?: {
    weekday_text?: string[];
    open_now?: boolean;
  };
  // Premium fields
  photos?: Array<{
    photo_reference: string;
    width: number;
    height: number;
  }>;
  rating?: number;
  user_ratings_total?: number;
  reviews?: Array<{
    author_name: string;
    rating: number;
    text: string;
    time: number;
  }>;
  // Address components
  address_components?: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

export interface EnrichedVendorData {
  name?: string;
  phone?: string;
  website?: string;
  city?: string;
  state?: string;
  // Premium fields
  photos?: string[];
  rating?: number;
  reviewCount?: number;
}

type Tier = "free" | "premium";

// Free tier fields (basic info)
const FREE_FIELDS = [
  "name",
  "formatted_address",
  "formatted_phone_number",
  "website",
  "opening_hours",
  "address_components",
].join(",");

// Premium tier fields (includes photos and ratings)
const PREMIUM_FIELDS = [
  ...FREE_FIELDS.split(","),
  "photos",
  "rating",
  "user_ratings_total",
].join(",");

/**
 * Search for businesses on Google Places
 */
export async function searchGooglePlaces(
  query: string,
  location?: string
): Promise<PlaceSearchResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_PLACES_API_KEY not set");
    return [];
  }

  try {
    const searchQuery = location ? `${query} ${location}` : query;
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/textsearch/json"
    );
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("type", "establishment");
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places search error:", data.status, data.error_message);
      return [];
    }

    return data.results || [];
  } catch (error) {
    console.error("Google Places search failed:", error);
    return [];
  }
}

/**
 * Get detailed place information by place ID
 */
export async function getPlaceDetails(
  placeId: string,
  tier: Tier = "free"
): Promise<PlaceDetails | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_PLACES_API_KEY not set");
    return null;
  }

  try {
    const fields = tier === "premium" ? PREMIUM_FIELDS : FREE_FIELDS;
    const url = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    url.searchParams.set("place_id", placeId);
    url.searchParams.set("fields", fields);
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Places details error:", data.status, data.error_message);
      return null;
    }

    return data.result;
  } catch (error) {
    console.error("Google Places details failed:", error);
    return null;
  }
}

/**
 * Get photo URL from photo reference
 */
export function getPhotoUrl(
  photoReference: string,
  maxWidth: number = 800
): string {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return "";

  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
}

/**
 * Parse address components to extract city and state
 */
function parseAddressComponents(
  components?: PlaceDetails["address_components"]
): { city?: string; state?: string } {
  if (!components) return {};

  let city: string | undefined;
  let state: string | undefined;

  for (const component of components) {
    if (component.types.includes("locality")) {
      city = component.long_name;
    }
    if (component.types.includes("administrative_area_level_1")) {
      state = component.short_name; // Use abbreviation for state
    }
  }

  return { city, state };
}

/**
 * Transform Google Places data to vendor-friendly format
 */
export function transformPlaceToVendorData(
  place: PlaceDetails,
  tier: Tier = "free"
): EnrichedVendorData {
  const { city, state } = parseAddressComponents(place.address_components);

  const data: EnrichedVendorData = {
    name: place.name,
    phone: place.formatted_phone_number,
    website: place.website,
    city,
    state,
  };

  // Add premium fields if available
  if (tier === "premium") {
    if (place.photos && place.photos.length > 0) {
      // Get up to 10 photo URLs
      data.photos = place.photos
        .slice(0, 10)
        .map((p) => getPhotoUrl(p.photo_reference));
    }
    if (place.rating) {
      data.rating = place.rating;
    }
    if (place.user_ratings_total) {
      data.reviewCount = place.user_ratings_total;
    }
  }

  return data;
}

/**
 * Enrich a vendor profile from Google Places
 * This updates the vendor in the database with Google data
 */
export async function enrichVendorFromGoogle(
  vendorId: string,
  placeId: string,
  tier: Tier = "free"
): Promise<{ success: boolean; data?: EnrichedVendorData; error?: string }> {
  try {
    // Get place details
    const place = await getPlaceDetails(placeId, tier);
    if (!place) {
      return { success: false, error: "Could not fetch place details" };
    }

    // Transform to vendor data
    const enrichedData = transformPlaceToVendorData(place, tier);

    // Prepare update object
    const updateData: Record<string, unknown> = {
      googlePlaceId: placeId,
      googleData: place, // Store raw Google data for reference
      googleDataUpdatedAt: new Date(),
      updatedAt: new Date(),
    };

    // Only update fields that have values and aren't already set
    // This preserves manual edits while filling in missing data
    const vendor = await db.query.vendorProfiles.findFirst({
      where: eq(vendorProfiles.id, vendorId),
    });

    if (!vendor) {
      return { success: false, error: "Vendor not found" };
    }

    // Fill in missing basic fields
    if (enrichedData.phone && !vendor.phone) {
      updateData.phone = enrichedData.phone;
    }
    if (enrichedData.website && !vendor.website) {
      updateData.website = enrichedData.website;
    }
    if (enrichedData.city && !vendor.city) {
      updateData.city = enrichedData.city;
    }
    if (enrichedData.state && !vendor.state) {
      updateData.state = enrichedData.state;
    }

    // For premium tier, add photos if portfolio is empty
    if (tier === "premium" && enrichedData.photos && enrichedData.photos.length > 0) {
      const existingPhotos = (vendor.portfolioImages as string[]) || [];
      if (existingPhotos.length === 0) {
        updateData.portfolioImages = enrichedData.photos;
      }
    }

    // Update the vendor
    await db
      .update(vendorProfiles)
      .set(updateData)
      .where(eq(vendorProfiles.id, vendorId));

    return { success: true, data: enrichedData };
  } catch (error) {
    console.error("Failed to enrich vendor from Google:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Search Google Places and find the best match for a vendor
 */
export async function findGooglePlaceForVendor(
  vendorName: string,
  location?: string
): Promise<PlaceSearchResult | null> {
  const results = await searchGooglePlaces(vendorName, location);

  if (results.length === 0) {
    return null;
  }

  // Return the first result as best match
  // Could be enhanced with fuzzy name matching
  return results[0];
}

/**
 * Calculate profile completeness score (0-100)
 */
export function calculateProfileCompleteness(vendor: {
  name?: string | null;
  description?: string | null;
  profileImage?: string | null;
  coverImage?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  city?: string | null;
  state?: string | null;
  priceRange?: string | null;
  instagram?: string | null;
  portfolioImages?: unknown;
}): number {
  const weights: Record<string, number> = {
    name: 5,
    description: 15,
    profileImage: 15,
    coverImage: 10,
    email: 5,
    phone: 5,
    website: 10,
    city: 5,
    state: 5,
    priceRange: 5,
    instagram: 5,
    portfolioImages: 15, // Up to 15 points for 10+ images
  };

  let score = 0;

  // Check each field
  if (vendor.name) score += weights.name;
  if (vendor.description && vendor.description.length > 50) score += weights.description;
  if (vendor.profileImage) score += weights.profileImage;
  if (vendor.coverImage) score += weights.coverImage;
  if (vendor.email) score += weights.email;
  if (vendor.phone) score += weights.phone;
  if (vendor.website) score += weights.website;
  if (vendor.city) score += weights.city;
  if (vendor.state) score += weights.state;
  if (vendor.priceRange) score += weights.priceRange;
  if (vendor.instagram) score += weights.instagram;

  // Portfolio images: scale from 0-15 based on count (up to 10 images)
  const portfolioImages = vendor.portfolioImages as string[] | undefined;
  if (portfolioImages && Array.isArray(portfolioImages)) {
    const imageScore = Math.min(portfolioImages.length, 10) * 1.5;
    score += imageScore;
  }

  return Math.round(score);
}
