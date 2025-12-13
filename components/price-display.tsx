"use client";

import { useState, useEffect } from "react";
import { Tag } from "lucide-react";

interface DiscountConfig {
  enabled: boolean;
  type: "percentage" | "fixed";
  value: number;
  code?: string;
  expiresAt?: string;
  maxUses?: number;
  currentUses: number;
}

interface PriceDisplayProps {
  originalPrice?: number;
  showOneTime?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PriceDisplay({ 
  originalPrice = 29, 
  showOneTime = true,
  size = "md",
  className = ""
}: PriceDisplayProps) {
  const [discount, setDiscount] = useState<DiscountConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        const res = await fetch("/api/admin/discount");
        const data = await res.json();
        
        if (data.enabled && data.value > 0) {
          // Check if expired
          if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
            setDiscount(null);
            return;
          }
          // Check if max uses reached
          if (data.maxUses && data.currentUses >= data.maxUses) {
            setDiscount(null);
            return;
          }
          setDiscount(data);
        }
      } catch (error) {
        console.error("Failed to fetch discount:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiscount();
  }, []);

  // Calculate discounted price
  let finalPrice = originalPrice;
  let discountText = "";
  
  if (discount) {
    if (discount.type === "percentage") {
      finalPrice = originalPrice - (originalPrice * discount.value / 100);
      discountText = `${discount.value}% off`;
    } else {
      finalPrice = originalPrice - (discount.value / 100);
      discountText = `$${(discount.value / 100).toFixed(0)} off`;
    }
    finalPrice = Math.max(0, finalPrice);
  }

  const sizeClasses = {
    sm: "text-xl",
    md: "text-3xl",
    lg: "text-4xl",
  };

  if (isLoading) {
    return (
      <div className={`flex items-baseline gap-2 ${className}`}>
        <p className={`${sizeClasses[size]} font-light text-warm-700`}>${originalPrice}</p>
        {showOneTime && <span className="text-warm-500 text-sm">one-time</span>}
      </div>
    );
  }

  if (!discount) {
    return (
      <div className={`flex items-baseline gap-2 ${className}`}>
        <p className={`${sizeClasses[size]} font-light text-warm-700`}>${originalPrice}</p>
        {showOneTime && <span className="text-warm-500 text-sm">one-time</span>}
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Discount badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
          <Tag className="w-3 h-3" />
          {discountText}
        </span>
        {discount.code && (
          <span className="text-xs text-warm-500">
            Code: <span className="font-mono font-medium">{discount.code}</span>
          </span>
        )}
      </div>
      
      {/* Price display */}
      <div className="flex items-baseline gap-2">
        <p className={`${sizeClasses[size]} font-light text-green-600`}>
          ${finalPrice.toFixed(0)}
        </p>
        <p className="text-lg text-warm-400 line-through">
          ${originalPrice}
        </p>
        {showOneTime && <span className="text-warm-500 text-sm">one-time</span>}
      </div>
    </div>
  );
}

// Hook to get discount info for use in other components
export function useDiscount() {
  const [discount, setDiscount] = useState<DiscountConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDiscount = async () => {
      try {
        const res = await fetch("/api/admin/discount");
        const data = await res.json();
        
        if (data.enabled && data.value > 0) {
          if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
            setDiscount(null);
            return;
          }
          if (data.maxUses && data.currentUses >= data.maxUses) {
            setDiscount(null);
            return;
          }
          setDiscount(data);
        }
      } catch (error) {
        console.error("Failed to fetch discount:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDiscount();
  }, []);

  const originalPrice = 29;
  let finalPrice = originalPrice;
  let discountText = "";
  
  if (discount) {
    if (discount.type === "percentage") {
      finalPrice = originalPrice - (originalPrice * discount.value / 100);
      discountText = `${discount.value}% off`;
    } else {
      finalPrice = originalPrice - (discount.value / 100);
      discountText = `$${(discount.value / 100).toFixed(0)} off`;
    }
    finalPrice = Math.max(0, finalPrice);
  }

  return {
    discount,
    isLoading,
    originalPrice,
    finalPrice,
    discountText,
    hasDiscount: !!discount,
  };
}
