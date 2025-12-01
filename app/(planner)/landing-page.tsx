import Link from "next/link";
import Image from "next/image";
import { 
  Heart, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Check,
  Star,
  BadgeCheck,
  X
} from "lucide-react";
import { PricingSection } from "@/components/pricing-section";

export function LandingPage() {
  return (
    <main className="min-h-screen select-none">
      {/* Hero Section - Redesigned with benefit-first headline + product peek */}
      <section className="min-h-screen flex flex-col px-8 pt-12 pb-8 bg-gradient-to-b from-warm-50 to-white overflow-hidden">
        {/* Top content */}
        <div className="text-center max-w-2xl mx-auto flex-shrink-0">
          <div className="w-16 h-px bg-warm-400 mx-auto mb-6" />
          
          {/* Brand mark - smaller */}
          <p className="text-sm tracking-[0.3em] uppercase text-warm-400 mb-4">
            Aisle
          </p>

          {/* Benefit-first H1 with SEO keywords */}
          <h1 className="text-4xl md:text-5xl font-serif font-light tracking-wide mb-4 text-warm-800">
            The Stress-Free
            <br />
            <span className="text-warm-600">Wedding Planner App</span>
          </h1>

          {/* No Subscription Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full mb-6">
            <BadgeCheck className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              One-time $29 — No monthly fees, ever
            </span>
          </div>
          
          <p className="text-lg text-warm-600 mb-8 leading-relaxed font-light max-w-lg mx-auto">
            A calm, beautiful space for you and your partner.
            No chaos. No overwhelm. Just the two of you, planning your day.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-warm-600 text-white
                         tracking-widest uppercase text-sm hover:bg-warm-700 
                         transition-colors duration-300"
            >
              Start Planning Free
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-block px-8 py-4 border border-warm-400 text-warm-600 
                         tracking-widest uppercase text-sm hover:bg-warm-50 
                         transition-colors duration-300"
            >
              Sign In
            </Link>
          </div>
          
          <p className="text-sm text-warm-400 mb-8">
            Free to start · No credit card required
          </p>
        </div>

        {/* Product Preview - "Peeking" from bottom, above the fold */}
        <div className="flex-1 flex items-end justify-center max-w-5xl mx-auto w-full">
          <div className="w-full transform translate-y-12 md:translate-y-16">
            <div className="bg-white rounded-t-xl shadow-[0_-10px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden border border-warm-200 border-b-0">
              {/* Browser Chrome */}
              <div className="bg-warm-200/50 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-warm-300" />
                  <div className="w-3 h-3 rounded-full bg-warm-300" />
                  <div className="w-3 h-3 rounded-full bg-warm-300" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white/70 rounded px-3 py-1 text-xs text-warm-500 text-center max-w-xs mx-auto">
                    yourtwo.aisleboard.com
                  </div>
                </div>
              </div>
              
              {/* App Preview Content - Just show the top portion */}
              <div className="p-4 md:p-6">
                <div className="grid md:grid-cols-4 gap-4">
                  {/* Sidebar Preview */}
                  <div className="hidden md:block bg-white rounded-lg shadow-sm p-3 space-y-2">
                    <div className="text-xs uppercase tracking-wider text-warm-400 mb-2">Your Pages</div>
                    {["Cover Page", "Budget Tracker", "Guest List", "Seating Chart", "Timeline"].map((item, i) => (
                      <div key={item} className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${i === 1 ? 'bg-warm-100 text-warm-700' : 'text-warm-500'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${i === 1 ? 'bg-warm-500' : 'bg-warm-300'}`} />
                        {item}
                      </div>
                    ))}
                  </div>
                  
                  {/* Main Content Preview */}
                  <div className="md:col-span-3 bg-white rounded-lg shadow-sm p-4">
                    <div className="text-center mb-4">
                      <h3 className="text-lg font-serif text-warm-800">Budget Tracker</h3>
                      <div className="w-8 h-px bg-warm-300 mx-auto mt-1" />
                    </div>
                    
                    {/* Budget Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="text-center p-2 bg-warm-50 rounded-lg">
                        <div className="text-base font-medium text-warm-700">$25,000</div>
                        <div className="text-xs text-warm-500">Budget</div>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <div className="text-base font-medium text-green-600">$8,500</div>
                        <div className="text-xs text-warm-500">Spent</div>
                      </div>
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <div className="text-base font-medium text-blue-600">$16,500</div>
                        <div className="text-xs text-warm-500">Remaining</div>
                      </div>
                    </div>
                    
                    {/* Sample Budget Items */}
                    <div className="space-y-1">
                      {[
                        { category: "Venue", vendor: "The Grand Estate", cost: "$5,000", paid: true },
                        { category: "Photography", vendor: "Jane Smith Photo", cost: "$2,500", paid: true },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 border-b border-warm-100 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-warm-100 flex items-center justify-center">
                              <DollarSign className="w-3 h-3 text-warm-500" />
                            </div>
                            <div>
                              <div className="font-medium text-warm-700 text-xs">{item.category}</div>
                              <div className="text-xs text-warm-400">{item.vendor}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-warm-600 text-xs">{item.cost}</span>
                            {item.paid && <Check className="w-3 h-3 text-green-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Chart - "Why Aisle?" Social Proof via Logic */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
            <h2 className="text-3xl font-serif font-light tracking-wide mb-4 text-warm-800">
              Why Couples Choose Aisle
            </h2>
            <p className="text-warm-600">
              We built what we wished existed.
            </p>
          </div>

          {/* Comparison Table */}
          <div className="overflow-hidden rounded-xl border border-warm-200">
            <div className="grid grid-cols-3">
              {/* Header */}
              <div className="p-4 bg-warm-50"></div>
              <div className="p-4 bg-warm-100 text-center">
                <span className="text-xs uppercase tracking-wider text-warm-500">Other Apps</span>
              </div>
              <div className="p-4 bg-warm-600 text-center">
                <span className="text-xs uppercase tracking-wider text-white">Aisle</span>
              </div>

              {/* Rows */}
              {[
                { feature: "Pricing", other: "Monthly fees", aisle: "One-time $29" },
                { feature: "Ads", other: "Vendor ads everywhere", aisle: "Zero ads" },
                { feature: "Interface", other: "Cluttered & overwhelming", aisle: "Calm & minimal" },
                { feature: "Your data", other: "Sold to vendors", aisle: "Private, always" },
                { feature: "Getting started", other: "Endless questions", aisle: "Ready in 60 seconds" },
              ].map((row, i) => (
                <div key={row.feature} className="contents">
                  <div className={`p-4 font-medium text-warm-700 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-warm-50/50'}`}>
                    {row.feature}
                  </div>
                  <div className={`p-4 text-center ${i % 2 === 0 ? 'bg-white' : 'bg-warm-50/50'}`}>
                    <div className="flex items-center justify-center gap-2 text-warm-500 text-sm">
                      <X className="w-4 h-4 text-red-400" />
                      <span>{row.other}</span>
                    </div>
                  </div>
                  <div className={`p-4 text-center ${i % 2 === 0 ? 'bg-warm-50' : 'bg-warm-100/50'}`}>
                    <div className="flex items-center justify-center gap-2 text-warm-700 text-sm">
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{row.aisle}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA after comparison */}
          <div className="mt-10 text-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-warm-600 text-white
                         tracking-widest uppercase text-sm hover:bg-warm-700 
                         transition-colors duration-300"
            >
              Try It Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works - Address "60 seconds" claim */}
      <section className="py-20 px-8 bg-warm-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
            <h2 className="text-3xl font-serif font-light tracking-wide mb-4 text-warm-800">
              Ready in 60 Seconds
            </h2>
            <p className="text-warm-600">
              No endless questionnaires. Just start planning.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4 text-warm-600 font-serif text-xl">
                1
              </div>
              <h3 className="font-medium text-warm-700 mb-2">Create your account</h3>
              <p className="text-sm text-warm-500">
                Just your email and a password. That&apos;s it.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4 text-warm-600 font-serif text-xl">
                2
              </div>
              <h3 className="font-medium text-warm-700 mb-2">Set your wedding date</h3>
              <p className="text-sm text-warm-500">
                We&apos;ll create a timeline tailored to your day.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4 text-warm-600 font-serif text-xl">
                3
              </div>
              <h3 className="font-medium text-warm-700 mb-2">Start planning together</h3>
              <p className="text-sm text-warm-500">
                Invite your partner and dive in. Everything auto-saves.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Congratulations Section */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <Heart className="w-8 h-8 text-warm-400 mx-auto mb-6" />
          <h2 className="text-3xl font-serif font-light tracking-wide mb-6">
            Congratulations
          </h2>
          <p className="text-warm-600 leading-relaxed text-lg">
            You said yes. You found your person. And now you get to plan one of the most 
            beautiful days of your life together.
          </p>
          <p className="text-warm-600 leading-relaxed text-lg mt-4">
            Take a breath. This should be joyful. We're here to help keep it that way.
          </p>
        </div>
      </section>

      {/* Features Section - Updated H2s for SEO */}
      <section className="py-20 px-8 bg-warm-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
            <h2 className="text-3xl font-serif font-light tracking-wide mb-4">
              Everything You Need, Nothing You Don&apos;t
            </h2>
            <p className="text-warm-600 max-w-xl mx-auto">
              A simple, elegant wedding planner that lives in your browser. 
              No apps to download, no spreadsheets to wrestle with.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-warm-500" />
              </div>
              <h3 className="font-medium text-warm-700 mb-2">Wedding Timeline Creator</h3>
              <p className="text-sm text-warm-500">
                From &ldquo;just engaged&rdquo; to &ldquo;I do&rdquo; — a clear path through every milestone.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-warm-500" />
              </div>
              <h3 className="font-medium text-warm-700 mb-2">Guest List & RSVP Tracker</h3>
              <p className="text-sm text-warm-500">
                Guest lists, RSVPs, seating charts, wedding party — all in one place.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-warm-500" />
              </div>
              <h3 className="font-medium text-warm-700 mb-2">Wedding Budget Tracker</h3>
              <p className="text-sm text-warm-500">
                See where your money goes with visual breakdowns. No surprises.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* About Section */}
      <section className="py-20 px-8 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
            <h2 className="text-3xl font-serif font-light tracking-wide">
              A Note From Us
            </h2>
          </div>

          <div className="prose prose-warm mx-auto text-center">
            <p className="text-warm-600 leading-relaxed mb-6">
              Hi, we&apos;re Sarah & Gabe.
            </p>
            <p className="text-warm-600 leading-relaxed mb-6">
              We&apos;re getting married in early 2026, and like you, we wanted a place to plan our day 
              that felt as special as the wedding itself. Something calm. Something beautiful. 
              Something that didn&apos;t make us want to throw our laptops out the window.
            </p>
            <p className="text-warm-600 leading-relaxed mb-6">
              So we built Aisle.
            </p>
            <p className="text-warm-600 leading-relaxed mb-6 italic">
              We hope it helps you and your person plan something beautiful together.
            </p>
          </div>

          <div className="text-center mt-8">
            <p className="text-warm-400 text-sm tracking-wider">
              — Sarah & Gabe
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-8 bg-warm-50/50">
        <div className="max-w-xl mx-auto text-center">
          <Sparkles className="w-8 h-8 text-warm-400 mx-auto mb-6" />
          <h2 className="text-3xl font-serif font-light tracking-wide mb-4">
            Ready to Start?
          </h2>
          <p className="text-warm-600 mb-8">
            Your wedding deserves a planner as thoughtful as you are.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-warm-600 text-white
                       tracking-widest uppercase text-sm hover:bg-warm-700 
                       transition-colors duration-300"
          >
            Create Your Planner
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 bg-warm-50 border-t border-warm-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <p className="font-serif tracking-widest uppercase text-warm-700 mb-1">
                Aisle
              </p>
              <p className="text-xs text-warm-500">
                Made with love in Utah
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-warm-500">
              <Link href="/register" className="hover:text-warm-700 transition-colors">
                Get Started
              </Link>
              <Link href="/login" className="hover:text-warm-700 transition-colors">
                Sign In
              </Link>
              <a href="mailto:hello@aisleboard.com" className="hover:text-warm-700 transition-colors">
                Contact
              </a>
            </div>

            <div className="text-center md:text-right">
              <div className="flex gap-4 justify-center md:justify-end text-xs text-warm-400 mb-1">
                <Link href="/privacy" className="hover:text-warm-600 transition-colors">
                  Privacy
                </Link>
                <Link href="/terms" className="hover:text-warm-600 transition-colors">
                  Terms
                </Link>
              </div>
              <p className="text-xs text-warm-400">
                © {new Date().getFullYear()} Aisle
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-warm-200 md:hidden z-50">
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 w-full py-3 bg-warm-600 text-white
                     tracking-widest uppercase text-sm hover:bg-warm-700 
                     transition-colors duration-300 rounded-lg"
        >
          Start Planning Free
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Bottom padding on mobile for sticky CTA */}
      <div className="h-20 md:hidden" />
    </main>
  );
}
