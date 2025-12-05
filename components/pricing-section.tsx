"use client";

import Link from "next/link";
import { Check, Star } from "lucide-react";

export function PricingSection() {
  return (
    <section className="py-24 px-6 bg-white" id="pricing">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif font-light mb-4 text-warm-900">
            Pricing
          </h2>
          <p className="text-lg text-warm-500">
            Free to start. Upgrade when you're ready.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="rounded-2xl border border-warm-200 p-8 bg-white">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-warm-800 mb-1">Free</h3>
              <p className="text-sm text-warm-500">For getting started</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-light text-warm-800">$0</span>
            </div>

            <Link
              href="/register"
              className="block w-full py-3 text-center text-sm font-medium text-warm-700 border border-warm-300 rounded-full hover:bg-warm-50 transition-colors mb-8"
            >
              Get started
            </Link>

            <div className="space-y-3">
              {[
                "3 planning templates",
                "Budget tracker",
                "Guest list",
                "Day-of schedule",
                "10 AI planner messages",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-warm-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-warm-600">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Aisle - Most Popular */}
          <div className="rounded-2xl border-2 border-rose-200 p-8 bg-gradient-to-br from-rose-50/50 to-amber-50/50 relative">
            <div className="absolute -top-3 left-6">
              <span className="px-3 py-1 bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs rounded-full">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-warm-800 mb-1">Aisle</h3>
              <p className="text-sm text-warm-500">For couples planning their wedding</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-light text-warm-800">$11.99</span>
              <span className="text-warm-500 ml-1">/mo</span>
              <p className="text-xs text-green-600 mt-1">or $119/year (save $25)</p>
            </div>

            <Link
              href="/register"
              className="block w-full py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-amber-500 rounded-full hover:from-rose-600 hover:to-amber-600 transition-colors mb-8"
            >
              Start free trial
            </Link>

            <div className="space-y-3">
              <p className="text-sm text-warm-500 mb-2">Everything in Free, plus:</p>
              {[
                "All 10+ planning templates",
                "Unlimited AI planner",
                "Vibe discovery & matching",
                "Vendor contact tracking",
                "Seating chart builder",
                "Wedding party management",
                "Export to PDF",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-warm-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Aisle+ Premium */}
          <div className="rounded-2xl border border-warm-200 p-8 bg-white relative">
            <div className="absolute -top-3 left-6">
              <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" />
                Premium
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-medium text-warm-800 mb-1">Aisle+</h3>
              <p className="text-sm text-warm-500">White-glove planning experience</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-light text-warm-800">$24.99</span>
              <span className="text-warm-500 ml-1">/mo</span>
              <p className="text-xs text-green-600 mt-1">or $249/year (save $51)</p>
            </div>

            <Link
              href="/register"
              className="block w-full py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full hover:from-purple-600 hover:to-indigo-600 transition-colors mb-8"
            >
              Start free trial
            </Link>

            <div className="space-y-3">
              <p className="text-sm text-warm-500 mb-2">Everything in Aisle, plus:</p>
              {[
                "Priority AI responses",
                "Curated vendor recommendations",
                "1:1 planning consultation call",
                "Premium export templates",
                "Early access to new features",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-warm-700">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-warm-400 mt-10">
          All paid plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
