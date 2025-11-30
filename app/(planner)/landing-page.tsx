import Link from "next/link";
import { 
  Heart, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Check
} from "lucide-react";
import { PricingSection } from "@/components/pricing-section";

export function LandingPage() {
  return (
    <main className="min-h-screen select-none">
      {/* Hero Section */}
      <section className="min-h-[78vh] flex flex-col items-center justify-center px-8 py-16 bg-gradient-to-b from-warm-50 to-white">
        <div className="text-center max-w-2xl">
          <div className="w-16 h-px bg-warm-400 mx-auto mb-8" />
          
          <h1 className="text-5xl md:text-6xl font-serif font-light tracking-widest uppercase mb-4">
            Aisle
          </h1>
          <p className="text-sm tracking-[0.3em] uppercase text-warm-500 mb-8">
            Wedding Planner
          </p>
          
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
              Start Planning
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

      {/* What is Aisle Section */}
      <section className="py-24 px-8 bg-warm-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
            <h2 className="text-3xl font-serif font-light tracking-wide mb-4">
              What is Aisle?
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
              <h3 className="font-medium text-warm-700 mb-2">Plan Your Timeline</h3>
              <p className="text-sm text-warm-500">
                From &ldquo;just engaged&rdquo; to &ldquo;I do&rdquo; — a clear path through every milestone.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-warm-500" />
              </div>
              <h3 className="font-medium text-warm-700 mb-2">Manage Your People</h3>
              <p className="text-sm text-warm-500">
                Guest lists, RSVPs, seating charts, wedding party — all in one place.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 rounded-full bg-warm-100 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-warm-500" />
              </div>
              <h3 className="font-medium text-warm-700 mb-2">Track Your Budget</h3>
              <p className="text-sm text-warm-500">
                See where your money goes. No surprises, no stress.
              </p>
            </div>
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
    </main>
  );
}
