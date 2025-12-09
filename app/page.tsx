import Link from "next/link";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeatureCard } from "@/components/feature-card"; // New import

export const dynamic = "force-static";

const features = [
  {
    title: "Intelligent Budgeting",
    description: "Dynamic allocation that adapts to your spending habits.",
  },
  {
    title: "Guest Logistics",
    description: "RSVP tracking, meal choices, and seating charts in one view.",
  },
  {
    title: "Vendor Management",
    description: "Contracts, payments, and communication history.",
  },
];

export default function LandingPage() {
    const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Wedding Planning",
    "provider": {
      "@type": "Organization",
      "name": "Scribe & Stem"
    },
    "name": "AI Wedding Planner",
    "description": "An intelligent operating system for your wedding that manages your budget, guests, and sanity with AI assistance.",
    "areaServed": {
      "@type": "ServiceArea",
      "serviceType": "Online Service"
    },
    "url": "https://aisleboard.com", // Replace with actual domain
    "offers": {
      "@type": "Offer",
      "priceCurrency": "USD",
      "price": "0", // Assuming a free tier or starting price
      "description": "Start planning your wedding for free with our AI assistant.",
      "category": "Free Trial"
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-white">




      {/* Navigation */}
      <header className="w-full px-6 py-6 max-w-7xl mx-auto flex justify-between items-center">
        <h1 className="font-serif text-2xl font-medium tracking-tight">Scribe & Stem</h1>
        <nav aria-label="Main Navigation" className="flex gap-4">
          <Link href="/login" legacyBehavior passHref>
            <Button variant="ghost" className="hover:bg-transparent hover:text-primary transition-colors">
              Log in
            </Button>
          </Link>
          <Link href="/register" legacyBehavior passHref>
            <Button className="px-6 bg-foreground text-background hover:bg-primary hover:text-white transition-all duration-300">
              Get Started
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 lg:pt-32 lg:pb-48 relative">
        
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 -z-10 opacity-40 pointer-events-none">
          <div className="w-[600px] h-[600px] bg-gradient-to-br from-rose-100 to-stone-200 rounded-full blur-3xl animate-wave-slow" />
        </div>

        <section className="animate-fade-in-up max-w-4xl" aria-labelledby="hero-heading">
          <h2 id="hero-heading" className="sr-only">The Intelligent Wedding Planner</h2>
          
          <div className="font-serif text-6xl md:text-8xl leading-none mb-8">
            The wedding planner <br />
            <span className="text-primary italic">that actually plans.</span>
          </div>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12 font-light leading-relaxed">
            Scribe & Stem isn't just a checklist. It's an intelligent operating system for your wedding that manages your budget, guests, and sanity.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register" legacyBehavior passHref>
              <Button size="lg" className="text-lg bg-foreground text-background hover:bg-primary hover:text-white transition-all duration-300 hover:scale-105 shadow-lifted">
                Start Planning Free <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login" legacyBehavior passHref>
              <Button variant="outline" size="lg" className="text-lg border-stone-300 hover:border-stone-800 hover:bg-stone-50 transition-all duration-300">
                View Demo
              </Button>
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section aria-labelledby="features-heading" className="mt-24">
          <h3 id="features-heading" className="sr-only">Key Features of Scribe & Stem</h3>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard 
                key={i} 
                icon={
                  i === 0 ? <Sparkles className="w-6 h-6 text-primary" /> : 
                  i === 1 ? <CheckCircle2 className="w-6 h-6 text-secondary" /> :
                            <ArrowRight className="w-6 h-6 text-accent-foreground" />
                } 
                title={feature.title} 
                description={feature.description} 
              />
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
