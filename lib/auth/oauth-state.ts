/**
 * HMAC-signed OAuth state utilities
 *
 * Provides cryptographically signed state parameters for OAuth flows
 * to prevent CSRF attacks and state tampering.
 */

import { createHmac, timingSafeEqual } from "crypto";

interface StatePayload {
  tenantId: string;
  userId: string;
  timestamp: number;
}

interface StateData {
  tenantId: string;
  userId: string;
  [key: string]: unknown;
}

const STATE_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

/**
 * Create a signed state parameter for OAuth
 * @param data - The data to encode in the state
 * @returns Base64-encoded signed state string
 */
export function createSignedState(data: StateData): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("NEXTAUTH_SECRET is required for OAuth state signing");
  }

  const payload: StatePayload = {
    tenantId: data.tenantId,
    userId: data.userId,
    timestamp: Date.now(),
  };

  const payloadStr = JSON.stringify(payload);
  const signature = createHmac("sha256", secret)
    .update(payloadStr)
    .digest("hex");

  const signedState = JSON.stringify({ payload: payloadStr, signature });
  return Buffer.from(signedState).toString("base64url");
}

/**
 * Verify and decode a signed state parameter
 * @param state - The base64-encoded signed state string
 * @returns The decoded payload, or null if invalid/expired
 */
export function verifySignedState(state: string): StatePayload | null {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    console.error("NEXTAUTH_SECRET is required for OAuth state verification");
    return null;
  }

  try {
    const decoded = Buffer.from(state, "base64url").toString("utf-8");
    const { payload: payloadStr, signature } = JSON.parse(decoded);

    // Verify signature using timing-safe comparison
    const expectedSignature = createHmac("sha256", secret)
      .update(payloadStr)
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (signatureBuffer.length !== expectedBuffer.length) {
      console.warn("OAuth state signature length mismatch");
      return null;
    }

    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
      console.warn("OAuth state signature verification failed");
      return null;
    }

    // Parse and validate payload
    const payload: StatePayload = JSON.parse(payloadStr);

    // Check expiration
    const age = Date.now() - payload.timestamp;
    if (age > STATE_EXPIRY_MS) {
      console.warn(`OAuth state expired (age: ${age}ms)`);
      return null;
    }

    // Validate required fields
    if (!payload.tenantId || !payload.userId) {
      console.warn("OAuth state missing required fields");
      return null;
    }

    return payload;
  } catch (error) {
    console.error("Failed to verify OAuth state:", error);
    return null;
  }
}
