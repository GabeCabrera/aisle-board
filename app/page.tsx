import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { PricingSection } from "@/components/pricing-section";
import { FAQSection } from "@/components/landing/faq-section";
import { BlogSection } from "@/components/landing/blog-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export const dynamic = "force-static";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-foreground selection:text-background flex flex-col">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-serif text-2xl font-medium tracking-tight">
            Scribe & Stem
          </Link>
          <nav aria-label="Main Navigation" className="flex gap-4 items-center">
            <Link href="/vendor/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              For Vendors
            </Link>
            <Link href="/login" passHref>
              <Button variant="ghost" className="hover:bg-muted/50 transition-colors">
                Log in
              </Button>
            </Link>
            <Link href="/register" passHref>
              <Button className="px-6 rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <HeroSection />
        <FeaturesGrid />
        <PricingSection />
        <FAQSection />
        <BlogSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
