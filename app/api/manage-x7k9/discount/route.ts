import { NextRequest, NextResponse } from "next/server";

interface DiscountConfig {
  enabled: boolean;
  type: "percentage" | "fixed";
  value: number;
  code?: string;
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
}

// Global discount config (resets on redeploy - for persistence use a database)
// This is intentionally simple for MVP
let discountConfig: DiscountConfig = {
  enabled: false,
  type: "percentage",
  value: 0,
  currentUses: 0,
};

export async function GET() {
  return NextResponse.json(discountConfig);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Preserve currentUses when updating other fields
    const currentUses = discountConfig.currentUses;
    
    discountConfig = {
      enabled: body.enabled ?? false,
      type: body.type ?? "percentage",
      value: Number(body.value) || 0,
      code: body.code?.trim() || undefined,
      expiresAt: body.expiresAt || undefined,
      maxUses: body.maxUses ? Number(body.maxUses) : undefined,
      currentUses: body.resetUses ? 0 : currentUses,
    };

    return NextResponse.json({ 
      success: true, 
      discount: discountConfig 
    });
  } catch (error) {
    console.error("Error updating discount:", error);
    return NextResponse.json(
      { error: "Failed to update discount" },
      { status: 500 }
    );
  }
}
