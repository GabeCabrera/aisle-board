import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Use HTTP driver for Vercel serverless compatibility
// Note: This driver doesn't support transactions, so we use optimistic locking
const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });
