"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Script from "next/script"; // Import Script for JSON-LD

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.2, 0.8, 0.2, 1], // "Enterprise" easing
    }
  },
};

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
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Stem", // Assuming 'Stem' is the brand name
    "url": "https://aisleboard.com", // Replace with actual domain
    "logo": "https://aisleboard.com/logo.svg", // Replace with actual logo URL
    "sameAs": [
      // Add social media profiles here if available
      // "https://www.facebook.com/yourpage",
      // "https://twitter.com/yourhandle",
      // "https://www.instagram.com/yourhandle"
    ]
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "Wedding Planning",
    "provider": {
      "@type": "Organization",
      "name": "Stem"
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
      {/* JSON-LD Structured Data */}
      <Script
        id="organization-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Script
        id="service-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      {/* Navigation */}
      <nav className="w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <span className="font-serif text-2xl font-medium tracking-tight" aria-label="Stem homepage link">Stem</span> {/* Changed div to span for better semantics with aria-label */}
        <div className="flex gap-4">
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
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 lg:pt-32 lg:pb-48 relative">
        
        {/* Abstract Background Element */}
        <div className="absolute top-0 right-0 -z-10 opacity-40 pointer-events-none">
          <div className="w-[600px] h-[600px] bg-gradient-to-br from-rose-100 to-stone-200 rounded-full blur-3xl animate-wave-slow" />
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-4xl"
        >
          <motion.h1 variants={item} className="font-serif text-6xl md:text-8xl lg:text-9xl leading-[0.9] tracking-tight mb-8 text-foreground">
            The wedding planner <br />
            <span className="text-primary italic">that actually plans.</span>
          </motion.h1>
          
          <motion.p variants={item} className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-12 font-light leading-relaxed">
            Stem isn't just a checklist. It's an intelligent operating system for your wedding that manages your budget, guests, and sanity.
          </motion.p>

          <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
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
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <section aria-labelledby="features-heading" className="mt-24">
          <h2 id="features-heading" className="sr-only">Key Features of Stem</h2> {/* Visually hidden heading for semantics */}
          <motion.ul
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.li key={i} className="group hover:shadow-lifted transition-all duration-500 hover:-translate-y-2 cursor-pointer">
                <Card className="h-full"> {/* Ensure Card fills li height */}
                  <CardContent className="p-8">
                    <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center mb-6 group-hover:bg-primary/10 transition-colors duration-500">
                      {i === 0 ? <Sparkles className="w-6 h-6 text-primary" /> : 
                      i === 1 ? <CheckCircle2 className="w-6 h-6 text-secondary" /> :
                                <ArrowRight className="w-6 h-6 text-accent-foreground" />}
                    </div>
                    <h3 className="font-serif text-2xl mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.li>
            ))}
          </motion.ul>
        </section>
      </main>
    </div>
  );
}
