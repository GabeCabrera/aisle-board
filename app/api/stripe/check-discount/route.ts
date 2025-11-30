import { NextRequest, NextResponse } from "next/server";

// Check discount validity and return pricing info
export async function POST(request: NextRequest) {
  try {
    const { promoCode } = await request.json();
    const baseUrl = process.env.NEXTAUTH_URL || request.headers.get("origin") || "http://localhost:3000";
    
    // Fetch current discount config from admin endpoint
    const discountRes = await fetch(`${baseUrl}/api/manage-x7k9/discount`);
    const discount = await discountRes.json();

    const originalPrice = 2900; // $29.00 in cents
    
    // Check if discount is enabled
    if (!discount.enabled) {
      return NextResponse.json({
        originalPrice,
        finalPrice: originalPrice,
        discountApplied: false,
        discountAmount: 0,
      });
    }

    // Check if promo code is required and matches
    if (discount.code && discount.code.toLowerCase() !== promoCode?.toLowerCase()) {
      return NextResponse.json({
        originalPrice,
        finalPrice: originalPrice,
        discountApplied: false,
        discountAmount: 0,
        error: promoCode ? "Invalid promo code" : undefined,
      });
    }

    // Check expiration
    if (discount.expiresAt && new Date(discount.expiresAt) < new Date()) {
      return NextResponse.json({
        originalPrice,
        finalPrice: originalPrice,
        discountApplied: false,
        discountAmount: 0,
        error: "This discount has expired",
      });
    }

    // Check max uses
    if (discount.maxUses && discount.currentUses >= discount.maxUses) {
      return NextResponse.json({
        originalPrice,
        finalPrice: originalPrice,
        discountApplied: false,
        discountAmount: 0,
        error: "This discount has reached its usage limit",
      });
    }

    // Calculate discount
    let discountAmount = 0;
    let discountDescription = "";

    if (discount.type === "percentage") {
      discountAmount = Math.round(originalPrice * (discount.value / 100));
      discountDescription = `${discount.value}% off`;
    } else {
      discountAmount = discount.value;
      discountDescription = `$${(discount.value / 100).toFixed(2)} off`;
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return NextResponse.json({
      originalPrice,
      finalPrice,
      discountApplied: true,
      discountAmount,
      discountDescription,
    });
  } catch (error) {
    console.error("Error checking discount:", error);
    return NextResponse.json(
      { error: "Failed to check discount" },
      { status: 500 }
    );
  }
}
