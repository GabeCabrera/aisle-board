import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroSection } from "@/components/landing/hero-section";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { PlaygroundDemo } from "@/components/landing/playground-demo"; // New import
import { FAQSection } from "@/components/landing/faq-section";
import { CTASection } from "@/components/landing/cta-section";
import { Footer } from "@/components/landing/footer";

export const dynamic = "force-static";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-white flex flex-col">
      {/* Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="font-serif text-2xl font-medium tracking-tight">
            Scribe & Stem
          </Link>
          <nav aria-label="Main Navigation" className="flex gap-4">
            <Link href="/login" passHref>
              <Button variant="ghost" className="hover:bg-transparent hover:text-primary transition-colors">
                Log in
              </Button>
            </Link>
            <Link href="/register" passHref>
              <Button className="px-6 rounded-full bg-foreground text-background hover:bg-primary hover:text-white transition-all duration-300">
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <HeroSection />
        <FeaturesGrid />
        <PlaygroundDemo /> {/* New Playground Demo component */}
        <FAQSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
