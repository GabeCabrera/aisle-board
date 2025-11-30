"use client";

import Link from "next/link";
import { Check, Tag } from "lucide-react";
import { PriceDisplay } from "@/components/price-display";

export function PricingSection() {
  return (
    <section className="py-24 px-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
          <h2 className="text-3xl font-serif font-light tracking-wide mb-4">
            Simple, Honest Pricing
          </h2>
          <p className="text-warm-600">
            Start free. Upgrade if you want more.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="border border-warm-200 p-8 bg-white">
            <h3 className="text-xl font-serif tracking-wider uppercase mb-2">
              Essentials
            </h3>
            <p className="text-3xl font-light text-warm-700 mb-4">Free</p>
            <p className="text-warm-600 text-sm mb-6">
              Everything you need to get started.
            </p>
            
            <div className="space-y-3 mb-8">
              {[
                "Day-of schedule",
                "Budget tracker", 
                "Guest list",
                "Full interactive planner",
                "Access from any device",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-warm-500 flex-shrink-0" />
                  <span className="text-warm-600">{feature}</span>
                </div>
              ))}
            </div>

            <Link
              href="/register"
              className="block text-center py-3 border border-warm-400 text-warm-600 
                         tracking-wider uppercase text-xs hover:bg-warm-50 transition-colors"
            >
              Get Started Free
            </Link>
          </div>

          {/* Complete Plan */}
          <div className="border border-warm-400 p-8 bg-warm-50/30 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 bg-warm-600 text-white text-[10px] tracking-widest uppercase">
                Most Popular
              </span>
            </div>
            
            <h3 className="text-xl font-serif tracking-wider uppercase mb-2 mt-2">
              Complete
            </h3>
            <div className="mb-4">
              <PriceDisplay />
            </div>
            <p className="text-warm-600 text-sm mb-6">
              Everything in Essentials, plus:
            </p>
            
            <div className="space-y-3 mb-8">
              {[
                "All 10+ templates",
                "Vendor contact tracking",
                "Seating chart builder",
                "Wedding party management",
                "Planning timeline & checklists",
                "Export to PDF",
                "Lifetime access",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 text-sm">
                  <Check className="w-4 h-4 text-warm-500 flex-shrink-0" />
                  <span className="text-warm-600">{feature}</span>
                </div>
              ))}
            </div>

            <Link
              href="/register"
              className="block text-center py-3 bg-warm-600 text-white 
                         tracking-wider uppercase text-xs hover:bg-warm-700 transition-colors"
            >
              Start Planning
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
