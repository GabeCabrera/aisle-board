"use client";

import Link from "next/link";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function PricingSection() {
  return (
    <section className="py-24 px-6 bg-muted/30" id="pricing">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl mb-4 text-foreground">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free. Upgrade when you need more.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="rounded-3xl border border-border p-8 bg-white hover:shadow-lg transition-shadow">
            <div className="mb-6">
              <h3 className="text-xl font-medium text-foreground mb-1">Free</h3>
              <p className="text-sm text-muted-foreground">For getting started</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-light text-foreground">$0</span>
              <span className="text-muted-foreground ml-1">/forever</span>
            </div>

            <Link
              href="/register"
              className="block w-full py-3 text-center text-sm font-medium text-foreground border border-border rounded-full hover:bg-muted/50 transition-colors mb-8"
            >
              Get started
            </Link>

            <div className="space-y-3">
              {[
                "Up to 50 guests",
                "Budget tracker",
                "Basic checklist",
                "Day-of timeline",
                "1 RSVP form",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stem - Most Popular */}
          <div className="rounded-3xl border-2 border-primary p-8 bg-gradient-to-br from-primary/5 via-rose-50/50 to-amber-50/50 relative shadow-lg">
            <div className="absolute -top-3 left-6">
              <span className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
                Most Popular
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-medium text-foreground mb-1">Stem</h3>
              <p className="text-sm text-muted-foreground">For serious planners</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-light text-foreground">$12</span>
              <span className="text-muted-foreground ml-1">/month</span>
              <p className="text-xs text-green-600 mt-1">or $99/year (save $45)</p>
            </div>

            <Link
              href="/register"
              className="block w-full py-3 text-center text-sm font-medium text-white bg-primary rounded-full hover:bg-primary/90 transition-colors mb-8"
            >
              Start free trial
            </Link>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-2">Everything in Free, plus:</p>
              {[
                "Unlimited guests",
                "Seating chart builder",
                "Vendor tracking",
                "Google Calendar sync",
                "Unlimited RSVP forms",
                "PDF exports",
                "Premium templates",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stem+ Premium */}
          <div className="rounded-3xl border border-border p-8 bg-white relative hover:shadow-lg transition-shadow">
            <div className="absolute -top-3 left-6">
              <span className="px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-medium rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" />
                Premium
              </span>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-medium text-foreground mb-1">Stem+</h3>
              <p className="text-sm text-muted-foreground">White-glove experience</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-light text-foreground">$25</span>
              <span className="text-muted-foreground ml-1">/month</span>
              <p className="text-xs text-green-600 mt-1">or $199/year (save $101)</p>
            </div>

            <Link
              href="/register"
              className="block w-full py-3 text-center text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-500 rounded-full hover:from-violet-600 hover:to-purple-600 transition-colors mb-8"
            >
              Start free trial
            </Link>

            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-2">Everything in Stem, plus:</p>
              {[
                "Curated vendor recommendations",
                "1:1 planning consultation",
                "Priority support",
                "Premium export templates",
                "Early access to features",
              ].map((feature) => (
                <div key={feature} className="flex items-start gap-3">
                  <Check className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-10">
          All paid plans include a 14-day free trial. Cancel anytime.
        </p>
      </div>
    </section>
  );
}
