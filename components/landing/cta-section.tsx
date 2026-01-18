"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto bg-foreground text-background rounded-[2.5rem] p-12 md:p-24 text-center">
        <h2 className="font-serif text-4xl md:text-6xl mb-6 text-white">
          Ready to start planning?
        </h2>
        <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10 font-light">
          Join thousands of modern couples planning their weddings without the stress.
          Start for free today.
        </p>
        
        <Link href="/register" passHref>
          <Button size="lg" className="h-14 px-10 text-lg bg-white text-foreground hover:bg-white/90 transition-colors rounded-full">
            Get Started for Free <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
        
        <p className="mt-6 text-sm text-white/40">
          No credit card required for free plan.
        </p>
      </div>
    </section>
  );
}
