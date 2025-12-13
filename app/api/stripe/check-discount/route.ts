import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPromoCodeByCode, incrementPromoCodeUses, upgradeTenantByUserEmail } from "@/lib/db/queries";

// Check discount validity and return pricing info
export async function POST(request: NextRequest) {
  try {
    const { promoCode, userEmail, applyCode } = await request.json();

    const originalPrice = 2900; // $29.00 in cents

    // If applying a code (which can upgrade accounts), require authentication
    if (applyCode) {
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json(
          { error: "Authentication required to apply promo codes" },
          { status: 401 }
        );
      }
      // Verify the email matches the session user (prevent upgrading other accounts)
      if (userEmail && userEmail !== session.user.email) {
        return NextResponse.json(
          { error: "Cannot apply promo code to a different account" },
          { status: 403 }
        );
      }
    }

    // No promo code provided
    if (!promoCode) {
      return NextResponse.json({
        originalPrice,
        finalPrice: originalPrice,
        discountApplied: false,
        discountAmount: 0,
      });
    }

    // Look up promo code in database
    const code = await getPromoCodeByCode(promoCode);

    // Code not found
    if (!code) {
      return NextResponse.json({
        originalPrice,
        finalPrice: originalPrice,
        discountApplied: false,
        discountAmount: 0,
        error: "Invalid promo code",
      });
    }

    // Code is not active
    if (!code.isActive) {
      return NextResponse.json({
        originalPrice,
        finalPrice: originalPrice,
        discountApplied: false,
        discountAmount: 0,
        error: "This promo code is no longer active",
      });
    }

    // Check expiration
    if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
      return NextResponse.json({
        originalPrice,
        finalPrice: originalPrice,
        discountApplied: false,
        discountAmount: 0,
        error: "This promo code has expired",
      });
    }

    // Check max uses
    if (code.maxUses && code.currentUses >= code.maxUses) {
      return NextResponse.json({
        originalPrice,
        finalPrice: originalPrice,
        discountApplied: false,
        discountAmount: 0,
        error: "This promo code has reached its usage limit",
      });
    }

    // Handle FREE type - grants complete membership directly
    if (code.type === "free") {
      // If applyCode is true and we have a user email, upgrade them immediately
      if (applyCode && userEmail) {
        const tenant = await upgradeTenantByUserEmail(userEmail);
        if (tenant) {
          await incrementPromoCodeUses(code.id);
          return NextResponse.json({
            originalPrice,
            finalPrice: 0,
            discountApplied: true,
            discountAmount: originalPrice,
            discountDescription: "Free Complete Plan",
            isFree: true,
            upgraded: true,
            message: "Your account has been upgraded to the Complete plan!",
          });
        }
      }

      return NextResponse.json({
        originalPrice,
        finalPrice: 0,
        discountApplied: true,
        discountAmount: originalPrice,
        discountDescription: "Free Complete Plan",
        isFree: true,
      });
    }

    // Calculate discount for percentage or fixed types
    let discountAmount = 0;
    let discountDescription = "";

    if (code.type === "percentage") {
      discountAmount = Math.round(originalPrice * (code.value / 100));
      discountDescription = `${code.value}% off`;
    } else if (code.type === "fixed") {
      discountAmount = code.value;
      discountDescription = `$${(code.value / 100).toFixed(2)} off`;
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);

    // If applyCode is true, increment usage counter
    if (applyCode) {
      await incrementPromoCodeUses(code.id);
    }

    return NextResponse.json({
      originalPrice,
      finalPrice,
      discountApplied: true,
      discountAmount,
      discountDescription,
      promoCodeId: code.id, // Return ID so checkout can increment uses after purchase
    });
  } catch (error) {
    console.error("Error checking discount:", error);
    return NextResponse.json(
      { error: "Failed to check discount" },
      { status: 500 }
    );
  }
}
