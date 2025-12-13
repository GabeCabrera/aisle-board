/**
 * Redis-based rate limiting using Upstash
 *
 * Uses sliding window algorithm for accurate rate limiting.
 * Falls back to in-memory rate limiting if Redis is not configured.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Check if Redis is configured
const hasRedisConfig = !!(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis client if configured
const redis = hasRedisConfig
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limiters for different use cases
// Using sliding window algorithm for smooth rate limiting

/**
 * General API rate limiter - 100 requests per minute
 */
export const apiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      prefix: "ratelimit:api",
      analytics: true,
    })
  : null;

/**
 * AI/Chat rate limiter - 30 requests per minute (expensive operations)
 */
export const aiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "1 m"),
      prefix: "ratelimit:ai",
      analytics: true,
    })
  : null;

/**
 * Auth rate limiter - 10 requests per minute (login, register, password reset)
 */
export const authRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      prefix: "ratelimit:auth",
      analytics: true,
    })
  : null;

/**
 * Public API rate limiter - 20 requests per minute (for unauthenticated endpoints)
 */
export const publicRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "1 m"),
      prefix: "ratelimit:public",
      analytics: true,
    })
  : null;

// In-memory fallback rate limiter (same as in lib/validation.ts)
const inMemoryLimits = new Map<string, { count: number; resetAt: number }>();

function inMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const record = inMemoryLimits.get(key);

  if (!record || now > record.resetAt) {
    inMemoryLimits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, reset: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, reset: record.resetAt };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, reset: record.resetAt };
}

/**
 * Check rate limit for a given identifier
 * Uses Redis if available, falls back to in-memory
 */
export async function checkRateLimit(
  identifier: string,
  limiter: Ratelimit | null = apiRateLimiter,
  fallbackLimit: number = 100,
  fallbackWindowMs: number = 60000
): Promise<{
  success: boolean;
  remaining: number;
  reset: number;
}> {
  // Use Redis rate limiter if available
  if (limiter) {
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  }

  // Fallback to in-memory rate limiting
  const fallbackKey = `${identifier}:fallback`;
  const result = inMemoryRateLimit(fallbackKey, fallbackLimit, fallbackWindowMs);
  return {
    success: result.allowed,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Get identifier for rate limiting from request
 * Uses IP address or forwarded IP
 */
export function getRateLimitIdentifier(request: Request): string {
  // Try to get real IP from headers (for proxied requests)
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback to a default (in development or when IP not available)
  return "unknown";
}

/**
 * Check if Redis is configured and available
 */
export function isRedisConfigured(): boolean {
  return hasRedisConfig;
}

// Clean up old in-memory entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of inMemoryLimits.entries()) {
      if (now > record.resetAt) {
        inMemoryLimits.delete(key);
      }
    }
  }, 60000);
}
