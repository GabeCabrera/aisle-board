import { z } from "zod";

// ============================================================================
// SANITIZATION HELPERS
// ============================================================================

/**
 * Sanitize a string to prevent XSS attacks
 * Removes HTML tags and dangerous characters
 */
export function sanitizeString(input: string | null | undefined): string {
  if (!input) return "";
  
  return input
    .toString()
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove script-like patterns
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    // Limit length to prevent DoS
    .slice(0, 10000);
}

/**
 * Sanitize an email address
 */
export function sanitizeEmail(input: string | null | undefined): string {
  if (!input) return "";
  
  const sanitized = input.toString().trim().toLowerCase().slice(0, 254);
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(sanitized) ? sanitized : "";
}

/**
 * Sanitize a phone number - keep only digits and common separators
 */
export function sanitizePhone(input: string | null | undefined): string {
  if (!input) return "";
  
  return input
    .toString()
    .replace(/[^0-9+\-() ]/g, "")
    .slice(0, 20);
}

/**
 * Sanitize for safe database storage and display
 */
export function sanitizeForDb(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "boolean" || typeof value === "number") {
      sanitized[key] = value;
    } else if (value === null || value === undefined) {
      sanitized[key] = null;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item => 
        typeof item === "object" && item !== null 
          ? sanitizeForDb(item as Record<string, unknown>)
          : typeof item === "string" 
            ? sanitizeString(item)
            : item
      );
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeForDb(value as Record<string, unknown>);
    }
  }
  
  return sanitized;
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

// Registration
export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  email: z.string().email("Invalid email address").max(254, "Email is too long"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password is too long"),
  emailOptIn: z.boolean().default(false),
});

// Page update
export const pageUpdateSchema = z.object({
  pageId: z.string().uuid("Invalid page ID"),
  fields: z.record(z.unknown()),
});

// Template IDs for adding pages
export const addPagesSchema = z.object({
  templateIds: z.array(
    z.string()
      .max(50)
      .regex(/^[a-z0-9-]+$/, "Invalid template ID")
  ).min(1, "At least one template is required")
    .max(20, "Too many templates"),
});

// Page deletion
export const deletePageSchema = z.object({
  pageId: z.string().uuid("Invalid page ID"),
});

// RSVP form creation/update
export const rsvpFormSchema = z.object({
  pageId: z.string().uuid("Invalid page ID"),
  title: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
  fields: z.record(z.boolean()).optional(),
  mealOptions: z.array(z.string().max(100)).max(20, "Too many meal options").optional(),
});

// Profile update
export const profileUpdateSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  weddingDate: z.string().datetime().optional().nullable(),
  onboardingComplete: z.boolean().optional(),
  plannerName: z.string().max(50).optional(),
  bio: z.string().max(500).optional(),
  socialLinks: z.record(z.string().url()).optional().nullable(),
  profileImage: z.string().url().max(2000).optional().nullable(),
});

// Plan selection
export const planSelectSchema = z.object({
  plan: z.enum(["free", "starter", "complete"]),
});

// Chat message
export const chatMessageSchema = z.object({
  message: z.string().min(1, "Message is required").max(10000, "Message is too long"),
  conversationId: z.string().uuid().optional(),
});

// ============================================================================
// RATE LIMITING HELPER (simple in-memory, use Redis in production)
// ============================================================================

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count };
}

// Clean up old entries periodically (only in non-edge environments)
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetAt) {
        rateLimitMap.delete(key);
      }
    }
  }, 60000);
}
