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
  BadgeCheck
} from "lucide-react";
import { PricingSection } from "@/components/pricing-section";

export function LandingPage() {
  return (
    <main className="min-h-screen select-none">
      {/* Hero Section */}
      <section className="min-h-[85vh] flex flex-col items-center justify-center px-8 py-16 bg-gradient-to-b from-warm-50 to-white">
        <div className="text-center max-w-2xl">
          <div className="w-16 h-px bg-warm-400 mx-auto mb-8" />
          
          <h1 className="text-5xl md:text-6xl font-serif font-light tracking-widest uppercase mb-4">
            Aisle
          </h1>
          <p className="text-sm tracking-[0.3em] uppercase text-warm-500 mb-6">
            Wedding Planner
          </p>

          {/* No Subscription Badge - NEW */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full mb-8">
            <BadgeCheck className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              One-time $29 — No monthly subscription, ever
            </span>
          </div>
          
          <p className="text-xl text-warm-600 mb-12 leading-relaxed font-light">
            A calm, beautiful space to plan your wedding together.
            <br />
            No chaos. No overwhelm. Just you two, and the day you&apos;re dreaming of.
          </p>
          
          <div className="w-16 h-px bg-warm-400 mx-auto mb-12" />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
          
          <p className="mt-8 text-sm text-warm-400">
            Free to start · No credit card required
          </p>
        </div>
      </section>

      {/* Product Preview Section - NEW */}
      <section className="py-16 px-8 bg-white border-b border-warm-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-sm tracking-widest uppercase text-warm-400 mb-2">See it in action</p>
            <h2 className="text-2xl font-serif font-light tracking-wide text-warm-800">
              Beautiful, Simple Wedding Planning
            </h2>
          </div>
          
          {/* Product Screenshots/Mockups */}
          <div className="relative">
            {/* Main Dashboard Preview */}
            <div className="bg-gradient-to-br from-warm-50 to-warm-100 rounded-xl shadow-2xl overflow-hidden border border-warm-200">
              {/* Browser Chrome */}
              <div className="bg-warm-200/50 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-warm-300" />
                  <div className="w-3 h-3 rounded-full bg-warm-300" />
                  <div className="w-3 h-3 rounded-full bg-warm-300" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-white/70 rounded px-3 py-1 text-xs text-warm-500 text-center max-w-xs mx-auto">
                    sarahandgabe.aisleboard.com
                  </div>
                </div>
              </div>
              
              {/* App Preview Content */}
              <div className="p-6 md:p-8">
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Sidebar Preview */}
                  <div className="bg-white rounded-lg shadow-sm p-4 space-y-3">
                    <div className="text-xs uppercase tracking-wider text-warm-400 mb-3">Your Pages</div>
                    {["Cover Page", "Budget Tracker", "Guest List", "Wedding Party", "Day-Of Schedule"].map((item, i) => (
                      <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${i === 1 ? 'bg-warm-100 text-warm-700' : 'text-warm-500'}`}>
                        <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-warm-500' : 'bg-warm-300'}`} />
                        {item}
                      </div>
                    ))}
                  </div>
                  
                  {/* Main Content Preview */}
                  <div className="md:col-span-2 bg-white rounded-lg shadow-sm p-6">
                    <div className="text-center mb-6">
                      <h3 className="text-xl font-serif text-warm-800">Budget Tracker</h3>
                      <div className="w-8 h-px bg-warm-300 mx-auto mt-2" />
                    </div>
                    
                    {/* Budget Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-warm-50 rounded-lg">
                        <div className="text-lg font-medium text-warm-700">$25,000</div>
                        <div className="text-xs text-warm-500">Total Budget</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg font-medium text-green-600">$8,500</div>
                        <div className="text-xs text-warm-500">Spent</div>
                      </div>
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg font-medium text-blue-600">$16,500</div>
                        <div className="text-xs text-warm-500">Remaining</div>
                      </div>
                    </div>
                    
                    {/* Sample Budget Items */}
                    <div className="space-y-2">
                      {[
                        { category: "Venue", vendor: "The Grand Estate", cost: "$5,000", paid: true },
                        { category: "Photography", vendor: "Jane Smith Photo", cost: "$2,500", paid: true },
                        { category: "Catering", vendor: "Delicious Bites", cost: "$4,200", paid: false },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-2 border-b border-warm-100 text-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-warm-500" />
                            </div>
                            <div>
                              <div className="font-medium text-warm-700">{item.category}</div>
                              <div className="text-xs text-warm-400">{item.vendor}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-warm-600">{item.cost}</span>
                            {item.paid && <Check className="w-4 h-4 text-green-500" />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Feature Cards */}
            <div className="hidden md:block absolute -right-4 top-1/4 bg-white rounded-lg shadow-lg p-4 border border-warm-200 max-w-[180px]">
              <div className="flex items-center gap-2 text-sm text-warm-600">
                <Users className="w-4 h-4 text-blue-500" />
                <span>142 guests</span>
              </div>
              <div className="text-xs text-warm-400 mt-1">87 RSVPs received</div>
            </div>
            
            <div className="hidden md:block absolute -left-4 bottom-1/4 bg-white rounded-lg shadow-lg p-4 border border-warm-200 max-w-[180px]">
              <div className="flex items-center gap-2 text-sm text-warm-600">
                <Calendar className="w-4 h-4 text-pink-500" />
                <span>186 days to go</span>
              </div>
              <div className="text-xs text-warm-400 mt-1">June 14, 2025</div>
            </div>
          </div>
        </div>
      </section>

      {/* Congratulations Section */}
      <section className="py-24 px-8 bg-white">
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
      <section className="py-24 px-8 bg-warm-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
            <h2 className="text-3xl font-serif font-light tracking-wide mb-4">
              The Best Free Wedding Planner App
            </h2>
            <p className="text-warm-600 max-w-xl mx-auto">
              Aisle is a simple, elegant wedding planner that lives in your browser. 
              No apps to download, no accounts to sync, no spreadsheets to wrestle with.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-warm-500" />
              </div>
              <h3 className="font-medium text-warm-700 mb-2">Wedding Timeline Creator</h3>
              <p className="text-sm text-warm-500">
                From &ldquo;just engaged&rdquo; to &ldquo;I do&rdquo; — a clear path through every milestone with our drag-and-drop planner.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-warm-500" />
              </div>
              <h3 className="font-medium text-warm-700 mb-2">Guest List & RSVP Tracker</h3>
              <p className="text-sm text-warm-500">
                Guest lists, RSVPs, seating charts, wedding party — all in one place with automatic tracking.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-warm-500" />
              </div>
              <h3 className="font-medium text-warm-700 mb-2">Wedding Budget Tracker</h3>
              <p className="text-sm text-warm-500">
                See where your money goes with visual breakdowns. No surprises, no stress.
              </p>
            </div>
          </div>

          {/* Mid-page CTA - NEW */}
          <div className="mt-12 text-center">
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

      {/* Pricing Section */}
      <PricingSection />

      {/* About Section */}
      <section className="py-24 px-8 bg-warm-50/50">
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
              We&apos;re getting married in early 2026 (announcements coming soon!), and like you, we wanted a place to plan our day 
              that felt as special as the wedding itself. Something calm. Something beautiful. 
              Something that didn&apos;t make us want to throw our laptops out the window.
            </p>
            <p className="text-warm-600 leading-relaxed mb-6">
              So we built Aisle.
            </p>
            <p className="text-warm-600 leading-relaxed mb-6">
              This is Gabe writing — and I just want to say: Sarah is the most patient, kind, and 
              understanding person I know. Her passion and curiosity inspire me every day. 
              I wouldn&apos;t want to do any of this without her.
            </p>
            <p className="text-warm-600 leading-relaxed mb-6 italic">
              Sarah, I love you. I made this for you. I can&apos;t wait to marry you.
            </p>
            <p className="text-warm-600 leading-relaxed">
              We hope Aisle helps you and your person plan something beautiful together.
            </p>
          </div>

          <div className="text-center mt-12">
            <p className="text-warm-400 text-sm tracking-wider">
              — Sarah & Gabe
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-8 bg-white">
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
              <p className="text-xs text-warm-400">
                © {new Date().getFullYear()} Aisle
              </p>
              <p className="text-xs text-warm-400 mt-1">
                Built for couples, by a couple
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky Mobile CTA - NEW */}
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

      {/* Add bottom padding on mobile to account for sticky CTA */}
      <div className="h-20 md:hidden" />
    </main>
  );
}
