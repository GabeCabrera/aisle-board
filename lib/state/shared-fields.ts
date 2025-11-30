// ============================================================================
// SHARED FIELDS CONFIGURATION
// ============================================================================
// These fields are synced across all templates that use them.
// When a user updates one, it updates everywhere.

export interface SharedFieldDefinition {
  key: string;
  label: string;
  type: "text" | "date" | "number";
  description: string;
}

// Fields that should be synced across templates
export const sharedFields: SharedFieldDefinition[] = [
  {
    key: "weddingDate",
    label: "Wedding Date",
    type: "date",
    description: "The date of your wedding",
  },
  {
    key: "names",
    label: "Names",
    type: "text",
    description: "The couple's names (e.g., Sarah & Gabe)",
  },
  {
    key: "ceremonyVenue",
    label: "Ceremony Venue",
    type: "text",
    description: "Where the ceremony will be held",
  },
  {
    key: "receptionVenue",
    label: "Reception Venue",
    type: "text",
    description: "Where the reception will be held",
  },
  {
    key: "ceremonyTime",
    label: "Ceremony Time",
    type: "text",
    description: "What time the ceremony starts",
  },
  {
    key: "colorPalette",
    label: "Color Palette",
    type: "text",
    description: "Your wedding color scheme",
  },
  {
    key: "theme",
    label: "Theme / Style",
    type: "text",
    description: "Your wedding theme or style",
  },
];

// Set of shared field keys for quick lookup
export const sharedFieldKeys = new Set(sharedFields.map((f) => f.key));

// Check if a field key is a shared field
export function isSharedField(key: string): boolean {
  return sharedFieldKeys.has(key);
}

// Get shared field definition
export function getSharedFieldDefinition(key: string): SharedFieldDefinition | undefined {
  return sharedFields.find((f) => f.key === key);
}
