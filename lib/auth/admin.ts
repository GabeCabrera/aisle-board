/**
 * Admin authentication utilities
 *
 * Uses ADMIN_EMAILS environment variable (comma-separated) and database isAdmin flag
 */

import { getUserByEmail } from "@/lib/db/queries";

type SessionUser = {
  user?: {
    email?: string | null;
  };
} | null;

/**
 * Check if the current session user is an admin
 *
 * Checks in order:
 * 1. ADMIN_EMAILS environment variable (comma-separated list)
 * 2. Database isAdmin flag on user record
 */
export async function isAdmin(session: SessionUser): Promise<boolean> {
  if (!session?.user?.email) return false;

  // Check environment variable first (for initial setup/recovery)
  const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];
  if (adminEmails.includes(session.user.email.toLowerCase())) {
    return true;
  }

  // Check database flag
  const user = await getUserByEmail(session.user.email);
  return user?.isAdmin ?? false;
}

/**
 * Require admin access - throws if not admin
 * Use this in API routes for cleaner code
 */
export async function requireAdmin(session: SessionUser): Promise<void> {
  if (!(await isAdmin(session))) {
    throw new Error("Unauthorized: Admin access required");
  }
}
