"use client";

import { useState } from "react";
import { 
  Heart, 
  Check, 
  X, 
  Calendar, 
  Users, 
  DollarSign,
  Sparkles,
  Star,
  Clock,
  Shield,
  ArrowRight,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin
} from "lucide-react";
import { Logo } from "@/components/logo";

export default function MarketingAssetsPage() {
  const [selectedAd, setSelectedAd] = useState<number | null>(null);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-warm-800 mb-2">Marketing Assets</h1>
        <p className="text-warm-500">Click any ad to view full-screen for screenshots</p>
      </div>

      {/* Instagram Stories */}
      <h2 className="text-xl font-serif text-warm-800 mb-6">Instagram Stories (9:16)</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
        {/* Story 1 */}
        <div 
          onClick={() => setSelectedAd(101)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-[9/16] bg-gradient-to-b from-warm-100 via-rose-50 to-warm-50 rounded-lg shadow-lg overflow-hidden border border-warm-200 max-h-80">
            <Story1Emotional />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Story 1: Emotional</p>
        </div>

        {/* Story 2 */}
        <div 
          onClick={() => setSelectedAd(102)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-[9/16] bg-warm-800 rounded-lg shadow-lg overflow-hidden max-h-80">
            <Story2Pricing />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Story 2: Pricing</p>
        </div>

        {/* Story 3 */}
        <div 
          onClick={() => setSelectedAd(103)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-[9/16] bg-gradient-to-b from-rose-100 to-warm-100 rounded-lg shadow-lg overflow-hidden border border-warm-200 max-h-80">
            <Story3Features />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Story 3: Features</p>
        </div>

        {/* Story 4: Budget UI */}
        <div 
          onClick={() => setSelectedAd(104)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-[9/16] bg-white rounded-lg shadow-lg overflow-hidden border border-warm-200 max-h-80">
            <StoryBudgetUI />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Story 4: Budget UI</p>
        </div>

        {/* Story 5: Guest List UI */}
        <div 
          onClick={() => setSelectedAd(105)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-[9/16] bg-white rounded-lg shadow-lg overflow-hidden border border-warm-200 max-h-80">
            <StoryGuestListUI />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Story 5: Guest List UI</p>
        </div>
      </div>

      {/* Square Ads */}
      <h2 className="text-xl font-serif text-warm-800 mb-6">Square Formats (1:1)</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Ad 1: Emotional Hero */}
        <div 
          onClick={() => setSelectedAd(1)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-gradient-to-br from-warm-50 to-warm-100 rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <Ad1Emotional />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">1. Emotional Hero (1:1)</p>
        </div>

        {/* Ad 2: Pricing Comparison */}
        <div 
          onClick={() => setSelectedAd(2)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-white rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <Ad2Pricing />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">2. Pricing Hook (1:1)</p>
        </div>

        {/* Ad 3: Features */}
        <div 
          onClick={() => setSelectedAd(3)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-warm-600 rounded-lg shadow-lg overflow-hidden">
            <Ad3Features />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">3. Features (1:1)</p>
        </div>

        {/* Ad 4: Us vs Them */}
        <div 
          onClick={() => setSelectedAd(4)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-white rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <Ad4Comparison />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">4. Comparison (1:1)</p>
        </div>

        {/* Ad 5: Problem/Solution */}
        <div 
          onClick={() => setSelectedAd(5)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-gradient-to-br from-rose-50 to-warm-50 rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <Ad5ProblemSolution />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">5. Problem/Solution (1:1)</p>
        </div>

        {/* Ad 6: Social Proof */}
        <div 
          onClick={() => setSelectedAd(6)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-warm-800 rounded-lg shadow-lg overflow-hidden">
            <Ad6SocialProof />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">6. Social Proof (1:1)</p>
        </div>

        {/* Ad 9: Budget UI Preview */}
        <div 
          onClick={() => setSelectedAd(9)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-warm-50 rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <AdBudgetUI />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">9. Budget UI Preview (1:1)</p>
        </div>

        {/* Ad 10: Guest List UI Preview */}
        <div 
          onClick={() => setSelectedAd(10)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-warm-50 rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <AdGuestListUI />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">10. Guest List UI Preview (1:1)</p>
        </div>

        {/* Ad 11: Timeline UI Preview */}
        <div 
          onClick={() => setSelectedAd(11)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-warm-50 rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <AdTimelineUI />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">11. Timeline UI Preview (1:1)</p>
        </div>

        {/* Ad 12: Seating Chart UI Preview */}
        <div 
          onClick={() => setSelectedAd(12)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-warm-50 rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <AdSeatingUI />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">12. Seating Chart UI (1:1)</p>
        </div>

        {/* Ad 13: Full App Preview */}
        <div 
          onClick={() => setSelectedAd(13)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-gradient-to-br from-warm-100 to-rose-50 rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <AdFullAppPreview />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">13. Full App Preview (1:1)</p>
        </div>
      </div>

      {/* Landscape Ads */}
      <h2 className="text-xl font-serif text-warm-800 mt-12 mb-6">Landscape Formats (16:9)</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Ad 7: Landscape Hero */}
        <div 
          onClick={() => setSelectedAd(7)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-video bg-gradient-to-r from-warm-100 to-rose-50 rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <Ad7LandscapeHero />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">7. Landscape Hero (16:9)</p>
        </div>

        {/* Ad 8: Landscape Features */}
        <div 
          onClick={() => setSelectedAd(8)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-video bg-warm-700 rounded-lg shadow-lg overflow-hidden">
            <Ad8LandscapeFeatures />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">8. Landscape Features (16:9)</p>
        </div>

        {/* Ad 14: Landscape UI Preview */}
        <div 
          onClick={() => setSelectedAd(14)}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-video bg-warm-50 rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <AdLandscapeUIPreview />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">14. Landscape UI Preview (16:9)</p>
        </div>
      </div>

      {/* Full Screen Modal */}
      {selectedAd && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAd(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            {/* Square ads */}
            {selectedAd === 1 && <div className="w-[500px] max-w-[90vw] aspect-square bg-gradient-to-br from-warm-50 to-warm-100 rounded-lg overflow-hidden"><Ad1Emotional /></div>}
            {selectedAd === 2 && <div className="w-[500px] max-w-[90vw] aspect-square bg-white rounded-lg overflow-hidden"><Ad2Pricing /></div>}
            {selectedAd === 3 && <div className="w-[500px] max-w-[90vw] aspect-square bg-warm-600 rounded-lg overflow-hidden"><Ad3Features /></div>}
            {selectedAd === 4 && <div className="w-[500px] max-w-[90vw] aspect-square bg-white rounded-lg overflow-hidden"><Ad4Comparison /></div>}
            {selectedAd === 5 && <div className="w-[500px] max-w-[90vw] aspect-square bg-gradient-to-br from-rose-50 to-warm-50 rounded-lg overflow-hidden"><Ad5ProblemSolution /></div>}
            {selectedAd === 6 && <div className="w-[500px] max-w-[90vw] aspect-square bg-warm-800 rounded-lg overflow-hidden"><Ad6SocialProof /></div>}
            {selectedAd === 9 && <div className="w-[500px] max-w-[90vw] aspect-square bg-warm-50 rounded-lg overflow-hidden"><AdBudgetUI /></div>}
            {selectedAd === 10 && <div className="w-[500px] max-w-[90vw] aspect-square bg-warm-50 rounded-lg overflow-hidden"><AdGuestListUI /></div>}
            {selectedAd === 11 && <div className="w-[500px] max-w-[90vw] aspect-square bg-warm-50 rounded-lg overflow-hidden"><AdTimelineUI /></div>}
            {selectedAd === 12 && <div className="w-[500px] max-w-[90vw] aspect-square bg-warm-50 rounded-lg overflow-hidden"><AdSeatingUI /></div>}
            {selectedAd === 13 && <div className="w-[500px] max-w-[90vw] aspect-square bg-gradient-to-br from-warm-100 to-rose-50 rounded-lg overflow-hidden"><AdFullAppPreview /></div>}
            {/* Landscape ads */}
            {selectedAd === 7 && <div className="w-[800px] max-w-[90vw] aspect-video bg-gradient-to-r from-warm-100 to-rose-50 rounded-lg overflow-hidden"><Ad7LandscapeHero /></div>}
            {selectedAd === 8 && <div className="w-[800px] max-w-[90vw] aspect-video bg-warm-700 rounded-lg overflow-hidden"><Ad8LandscapeFeatures /></div>}
            {selectedAd === 14 && <div className="w-[800px] max-w-[90vw] aspect-video bg-warm-50 rounded-lg overflow-hidden"><AdLandscapeUIPreview /></div>}
            {/* Story ads - 9:16 aspect ratio */}
            {selectedAd === 101 && <div className="h-[90vh] max-h-[800px] aspect-[9/16] bg-gradient-to-b from-warm-100 via-rose-50 to-warm-50 rounded-lg overflow-hidden"><Story1Emotional /></div>}
            {selectedAd === 102 && <div className="h-[90vh] max-h-[800px] aspect-[9/16] bg-warm-800 rounded-lg overflow-hidden"><Story2Pricing /></div>}
            {selectedAd === 103 && <div className="h-[90vh] max-h-[800px] aspect-[9/16] bg-gradient-to-b from-rose-100 to-warm-100 rounded-lg overflow-hidden"><Story3Features /></div>}
            {selectedAd === 104 && <div className="h-[90vh] max-h-[800px] aspect-[9/16] bg-white rounded-lg overflow-hidden"><StoryBudgetUI /></div>}
            {selectedAd === 105 && <div className="h-[90vh] max-h-[800px] aspect-[9/16] bg-white rounded-lg overflow-hidden"><StoryGuestListUI /></div>}
            <p className="text-white text-center mt-4 text-sm">Click outside to close</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// UI COMPONENT PREVIEWS - Reusable mock UI elements
// ============================================================================

function BudgetCard({ category, vendor, amount, paid }: { category: string; vendor: string; amount: string; paid: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-warm-100">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center">
          <DollarSign className="w-4 h-4 text-warm-500" />
        </div>
        <div>
          <p className="text-xs font-medium text-warm-700">{category}</p>
          <p className="text-[10px] text-warm-400">{vendor}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-warm-600">{amount}</span>
        {paid && <Check className="w-3 h-3 text-green-500" />}
      </div>
    </div>
  );
}

function GuestRow({ name, email, rsvp }: { name: string; email: string; rsvp: "yes" | "no" | "pending" }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-warm-100">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-warm-200 flex items-center justify-center">
          <span className="text-[10px] font-medium text-warm-600">{name.split(' ').map(n => n[0]).join('')}</span>
        </div>
        <div>
          <p className="text-xs font-medium text-warm-700">{name}</p>
          <p className="text-[10px] text-warm-400">{email}</p>
        </div>
      </div>
      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
        rsvp === 'yes' ? 'bg-green-100 text-green-700' :
        rsvp === 'no' ? 'bg-red-100 text-red-700' :
        'bg-warm-100 text-warm-500'
      }`}>
        {rsvp === 'yes' ? 'Attending' : rsvp === 'no' ? 'Declined' : 'Pending'}
      </span>
    </div>
  );
}

function TimelineItem({ time, event, icon: Icon }: { time: string; event: string; icon: typeof Clock }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-[10px] text-warm-400 w-12 text-right">{time}</div>
      <div className="w-6 h-6 rounded-full bg-warm-200 flex items-center justify-center">
        <Icon className="w-3 h-3 text-warm-600" />
      </div>
      <p className="text-xs text-warm-700">{event}</p>
    </div>
  );
}

// ============================================================================
// INSTAGRAM STORIES (9:16)
// ============================================================================

function Story1Emotional() {
  return (
    <div className="h-full flex flex-col items-center justify-between p-6 py-10 text-center">
      <Logo size="sm" showText={true} href={undefined} />
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <Heart className="w-10 h-10 text-rose-400 mb-4" />
        <h2 className="text-2xl font-serif font-light text-warm-800 mb-3 leading-tight">
          Plan Your
          <br />
          Wedding
          <br />
          <span className="text-warm-600">Without</span>
          <br />
          <span className="text-warm-600">the Stress</span>
        </h2>
        <p className="text-warm-600 text-sm mt-4 max-w-[200px] leading-relaxed">
          A calm, beautiful space for you & your partner
        </p>
      </div>
      
      <div>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-warm-600 text-white text-xs tracking-wider uppercase rounded-full">
          Start Free
          <ArrowRight className="w-3 h-3" />
        </div>
        <p className="text-[10px] text-warm-400 mt-2">aisleboard.com</p>
      </div>
    </div>
  );
}

function Story2Pricing() {
  return (
    <div className="h-full flex flex-col items-center justify-between p-6 py-10 text-center text-white">
      <Logo size="sm" showText={true} href={undefined} variant="white" />
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="text-warm-400 text-xs uppercase tracking-wider mb-2">Monthly or yearly</p>
        <span className="text-5xl font-serif">$12/mo</span>
        
        <div className="w-10 h-px bg-warm-600 my-6" />
        
        <h2 className="text-xl font-serif font-light mb-6">
          Cancel Anytime.<br />
          No Hidden Fees.
        </h2>
        
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-warm-200">Budget tracker</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-warm-200">Guest list & RSVPs</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-warm-200">Seating charts</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-warm-200">Timeline & tasks</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-warm-200">Calendar sync</span>
          </div>
        </div>
      </div>
      
      <div>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-warm-800 text-xs tracking-wider uppercase rounded-full">
          Try Free
          <ArrowRight className="w-3 h-3" />
        </div>
        <p className="text-[10px] text-warm-500 mt-2">aisleboard.com</p>
      </div>
    </div>
  );
}

function Story3Features() {
  return (
    <div className="h-full flex flex-col items-center justify-between p-6 py-10 text-center">
      <Logo size="sm" showText={true} href={undefined} />
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-xl font-serif font-light text-warm-800 mb-6">
          Everything
          <br />
          in One Place
        </h2>
        
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="flex flex-col items-center p-3 bg-white/60 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-warm-200 flex items-center justify-center mb-1">
              <DollarSign className="w-4 h-4 text-warm-600" />
            </div>
            <span className="text-[10px] text-warm-600">Budget</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white/60 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-warm-200 flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-warm-600" />
            </div>
            <span className="text-[10px] text-warm-600">Guests</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white/60 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-warm-200 flex items-center justify-center mb-1">
              <Calendar className="w-4 h-4 text-warm-600" />
            </div>
            <span className="text-[10px] text-warm-600">Timeline</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-white/60 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-warm-200 flex items-center justify-center mb-1">
              <Sparkles className="w-4 h-4 text-warm-600" />
            </div>
            <span className="text-[10px] text-warm-600">Seating</span>
          </div>
        </div>
        
        <p className="text-warm-600 text-xs max-w-[180px]">
          No spreadsheets.
          <br />
          No chaos. No ads.
        </p>
      </div>
      
      <div>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-warm-700 text-white text-xs tracking-wider uppercase rounded-full">
          Start Planning
          <ArrowRight className="w-3 h-3" />
        </div>
        <p className="text-[10px] text-warm-400 mt-2">aisleboard.com</p>
      </div>
    </div>
  );
}

// Story 4: Budget UI Preview
function StoryBudgetUI() {
  return (
    <div className="h-full flex flex-col p-4 pt-6">
      <Logo size="sm" showText={true} href={undefined} className="mb-4" />
      
      <div className="flex-1 flex flex-col">
        <p className="text-[10px] text-warm-500 uppercase tracking-wider mb-2">Budget Tracker</p>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-warm-50 rounded-lg">
            <p className="text-sm font-medium text-warm-700">$25k</p>
            <p className="text-[9px] text-warm-400">Budget</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-600">$8.5k</p>
            <p className="text-[9px] text-warm-400">Spent</p>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-600">$16.5k</p>
            <p className="text-[9px] text-warm-400">Left</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-warm-100 rounded-full mb-4 overflow-hidden">
          <div className="h-full w-[34%] bg-warm-500 rounded-full" />
        </div>
        
        {/* Budget items */}
        <div className="space-y-2 flex-1">
          <BudgetCard category="Venue" vendor="The Grand Estate" amount="$5,000" paid={true} />
          <BudgetCard category="Photography" vendor="Jane Smith Photo" amount="$2,500" paid={true} />
          <BudgetCard category="Catering" vendor="Delicious Bites" amount="$4,200" paid={false} />
          <BudgetCard category="Flowers" vendor="Bloom & Co" amount="$1,800" paid={false} />
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-warm-600 text-white text-[10px] tracking-wider uppercase rounded-full">
          Try Free
          <ArrowRight className="w-3 h-3" />
        </div>
        <p className="text-[9px] text-warm-400 mt-1">aisleboard.com</p>
      </div>
    </div>
  );
}

// Story 5: Guest List UI Preview
function StoryGuestListUI() {
  return (
    <div className="h-full flex flex-col p-4 pt-6">
      <Logo size="sm" showText={true} href={undefined} className="mb-4" />
      
      <div className="flex-1 flex flex-col">
        <p className="text-[10px] text-warm-500 uppercase tracking-wider mb-2">Guest List</p>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-warm-50 rounded-lg">
            <p className="text-sm font-medium text-warm-700">124</p>
            <p className="text-[9px] text-warm-400">Invited</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-600">86</p>
            <p className="text-[9px] text-warm-400">Attending</p>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded-lg">
            <p className="text-sm font-medium text-amber-600">24</p>
            <p className="text-[9px] text-warm-400">Pending</p>
          </div>
        </div>
        
        {/* Guest rows */}
        <div className="space-y-2 flex-1">
          <GuestRow name="Sarah Johnson" email="sarah@email.com" rsvp="yes" />
          <GuestRow name="Michael Chen" email="m.chen@email.com" rsvp="yes" />
          <GuestRow name="Emily Davis" email="emily.d@email.com" rsvp="pending" />
          <GuestRow name="James Wilson" email="jwilson@email.com" rsvp="yes" />
          <GuestRow name="Lisa Anderson" email="lisa.a@email.com" rsvp="no" />
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-warm-600 text-white text-[10px] tracking-wider uppercase rounded-full">
          Try Free
          <ArrowRight className="w-3 h-3" />
        </div>
        <p className="text-[9px] text-warm-400 mt-1">aisleboard.com</p>
      </div>
    </div>
  );
}

// ============================================================================
// SQUARE ADS (1:1)
// ============================================================================

function Ad1Emotional() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <Logo size="md" showText={true} href={undefined} className="mb-6" />
      <h2 className="text-3xl md:text-4xl font-serif font-light text-warm-800 mb-4 leading-tight">
        Plan Your Wedding
        <br />
        <span className="text-warm-600">Without the Stress</span>
      </h2>
      <p className="text-warm-600 mb-8 max-w-xs">
        A calm, beautiful space for you and your partner to plan your perfect day together.
      </p>
      <div className="inline-flex items-center gap-2 px-6 py-3 bg-warm-600 text-white text-sm tracking-wider uppercase">
        Start Free
      </div>
      <p className="text-xs text-warm-400 mt-4">No credit card required</p>
    </div>
  );
}

function Ad2Pricing() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-6">
        <span className="text-6xl font-serif text-warm-700">$12/mo</span>
        <p className="text-warm-500 text-sm mt-1">cancel anytime</p>
      </div>
      
      <div className="w-16 h-px bg-warm-300 mb-6" />
      
      <h2 className="text-2xl font-serif text-warm-800 mb-4">
        No Hidden Fees.<br />Ever.
      </h2>
      
      <div className="space-y-2 text-left mb-6">
        <div className="flex items-center gap-2 text-warm-600">
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-sm">Unlimited planning tools</span>
        </div>
        <div className="flex items-center gap-2 text-warm-600">
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-sm">Guest list & RSVP tracking</span>
        </div>
        <div className="flex items-center gap-2 text-warm-600">
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-sm">Budget management</span>
        </div>
        <div className="flex items-center gap-2 text-warm-600">
          <Check className="w-4 h-4 text-green-500" />
          <span className="text-sm">Google Calendar sync</span>
        </div>
      </div>
      
      <Logo size="sm" showText={true} href={undefined} />
    </div>
  );
}

function Ad3Features() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-white">
      <Logo size="md" showText={true} href={undefined} variant="white" className="mb-4" />
      
      <h2 className="text-2xl font-serif font-light mb-8">
        Everything You Need
      </h2>
      
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="flex flex-col items-center p-4">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2">
            <DollarSign className="w-5 h-5" />
          </div>
          <span className="text-xs">Budget</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2">
            <Users className="w-5 h-5" />
          </div>
          <span className="text-xs">Guest List</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs">Timeline</span>
        </div>
        <div className="flex flex-col items-center p-4">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xs">Seating</span>
        </div>
      </div>
      
      <p className="text-warm-300 text-sm">No spreadsheets. No chaos.</p>
    </div>
  );
}

function Ad4Comparison() {
  return (
    <div className="h-full flex flex-col p-6">
      <h2 className="text-xl font-serif text-warm-800 text-center mb-6">
        Why Couples Switch to Aisle
      </h2>
      
      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center text-warm-400 text-xs uppercase tracking-wider pb-2">Others</div>
          <div className="text-center text-warm-600 text-xs uppercase tracking-wider pb-2">Aisle</div>
          
          <div className="flex items-center justify-center gap-1 py-2 border-t border-warm-100">
            <X className="w-4 h-4 text-red-400" />
            <span className="text-warm-500">$20-40/month</span>
          </div>
          <div className="flex items-center justify-center gap-1 py-2 border-t border-warm-100 bg-green-50">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-warm-700 font-medium">$12/mo</span>
          </div>
          
          <div className="flex items-center justify-center gap-1 py-2 border-t border-warm-100">
            <X className="w-4 h-4 text-red-400" />
            <span className="text-warm-500">Vendor ads</span>
          </div>
          <div className="flex items-center justify-center gap-1 py-2 border-t border-warm-100 bg-green-50">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-warm-700 font-medium">Zero ads</span>
          </div>
          
          <div className="flex items-center justify-center gap-1 py-2 border-t border-warm-100">
            <X className="w-4 h-4 text-red-400" />
            <span className="text-warm-500">Cluttered</span>
          </div>
          <div className="flex items-center justify-center gap-1 py-2 border-t border-warm-100 bg-green-50">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-warm-700 font-medium">Minimal</span>
          </div>
          
          <div className="flex items-center justify-center gap-1 py-2 border-t border-warm-100">
            <X className="w-4 h-4 text-red-400" />
            <span className="text-warm-500">Data sold</span>
          </div>
          <div className="flex items-center justify-center gap-1 py-2 border-t border-warm-100 bg-green-50">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-warm-700 font-medium">Private</span>
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-4">
        <Logo size="sm" showText={true} href={undefined} />
      </div>
    </div>
  );
}

function Ad5ProblemSolution() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-8">
        <p className="text-warm-500 text-sm mb-2">Tired of...</p>
        <div className="space-y-1 text-warm-600">
          <p className="line-through opacity-60">Overwhelming planning apps</p>
          <p className="line-through opacity-60">Monthly subscription fees</p>
          <p className="line-through opacity-60">Vendor spam in your inbox</p>
        </div>
      </div>
      
      <div className="w-12 h-px bg-warm-300 mb-8" />
      
      <Logo size="md" showText={true} href={undefined} className="mb-4" />
      
      <p className="text-warm-600 text-sm mb-6 max-w-xs">
        A calm, ad-free wedding planner that&apos;s actually enjoyable to use.
      </p>
      
      <div className="inline-flex items-center gap-2 px-5 py-2 bg-warm-600 text-white text-sm tracking-wider uppercase rounded">
        Start Free
      </div>
    </div>
  );
}

function Ad6SocialProof() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center text-white">
      <div className="flex gap-1 mb-6">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      
      <blockquote className="text-xl font-serif font-light mb-6 leading-relaxed max-w-xs">
        &ldquo;Finally, a wedding planner that doesn&apos;t make me want to pull my hair out.&rdquo;
      </blockquote>
      
      <p className="text-warm-400 text-sm mb-8">— Sarah & James, 2025</p>
      
      <div className="w-12 h-px bg-warm-600 mb-6" />
      
      <Logo size="sm" showText={true} href={undefined} variant="white" />
    </div>
  );
}

// Ad 9: Budget UI Preview
function AdBudgetUI() {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <Logo size="sm" showText={true} href={undefined} />
        <span className="text-[10px] text-warm-400 uppercase tracking-wider">Budget Tracker</span>
      </div>
      
      {/* Mock UI */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-warm-200 p-4 overflow-hidden">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center p-2 bg-warm-50 rounded-lg">
            <p className="text-lg font-medium text-warm-700">$25,000</p>
            <p className="text-[10px] text-warm-400">Total Budget</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-lg font-medium text-green-600">$8,500</p>
            <p className="text-[10px] text-warm-400">Spent</p>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded-lg">
            <p className="text-lg font-medium text-blue-600">$16,500</p>
            <p className="text-[10px] text-warm-400">Remaining</p>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-3 bg-warm-100 rounded-full overflow-hidden">
            <div className="h-full w-[34%] bg-gradient-to-r from-warm-400 to-warm-500 rounded-full" />
          </div>
          <p className="text-[10px] text-warm-400 mt-1 text-right">34% of budget used</p>
        </div>
        
        {/* Budget items */}
        <div className="space-y-2">
          <BudgetCard category="Venue" vendor="The Grand Estate" amount="$5,000" paid={true} />
          <BudgetCard category="Photography" vendor="Jane Smith Photo" amount="$2,500" paid={true} />
          <BudgetCard category="Catering" vendor="Delicious Bites Co" amount="$4,200" paid={false} />
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-warm-600 text-white text-xs tracking-wider uppercase rounded-full">
          Start Free <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

// Ad 10: Guest List UI Preview
function AdGuestListUI() {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <Logo size="sm" showText={true} href={undefined} />
        <span className="text-[10px] text-warm-400 uppercase tracking-wider">Guest List</span>
      </div>
      
      {/* Mock UI */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-warm-200 p-4 overflow-hidden">
        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="text-center p-2 bg-warm-50 rounded-lg">
            <p className="text-lg font-medium text-warm-700">124</p>
            <p className="text-[9px] text-warm-400">Invited</p>
          </div>
          <div className="text-center p-2 bg-green-50 rounded-lg">
            <p className="text-lg font-medium text-green-600">86</p>
            <p className="text-[9px] text-warm-400">Yes</p>
          </div>
          <div className="text-center p-2 bg-red-50 rounded-lg">
            <p className="text-lg font-medium text-red-500">14</p>
            <p className="text-[9px] text-warm-400">No</p>
          </div>
          <div className="text-center p-2 bg-amber-50 rounded-lg">
            <p className="text-lg font-medium text-amber-600">24</p>
            <p className="text-[9px] text-warm-400">Pending</p>
          </div>
        </div>
        
        {/* Guest list */}
        <div className="space-y-2">
          <GuestRow name="Sarah Johnson" email="sarah@email.com" rsvp="yes" />
          <GuestRow name="Michael Chen" email="m.chen@email.com" rsvp="yes" />
          <GuestRow name="Emily Davis" email="emily.d@email.com" rsvp="pending" />
          <GuestRow name="James Wilson" email="jwilson@email.com" rsvp="no" />
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-warm-600 text-white text-xs tracking-wider uppercase rounded-full">
          Start Free <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

// Ad 11: Timeline UI Preview
function AdTimelineUI() {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <Logo size="sm" showText={true} href={undefined} />
        <span className="text-[10px] text-warm-400 uppercase tracking-wider">Day-of Timeline</span>
      </div>
      
      {/* Mock UI */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-warm-200 p-4 overflow-hidden">
        <div className="text-center mb-4">
          <p className="text-xs text-warm-400">Saturday, June 15, 2025</p>
          <h3 className="font-serif text-warm-700">Your Wedding Day</h3>
        </div>
        
        {/* Timeline */}
        <div className="space-y-3 relative">
          <div className="absolute left-[3.25rem] top-3 bottom-3 w-px bg-warm-200" />
          <TimelineItem time="2:00 PM" event="Hair & Makeup begins" icon={Sparkles} />
          <TimelineItem time="4:00 PM" event="Photographer arrives" icon={Calendar} />
          <TimelineItem time="4:30 PM" event="First look photos" icon={Heart} />
          <TimelineItem time="5:00 PM" event="Ceremony begins" icon={Users} />
          <TimelineItem time="5:30 PM" event="Cocktail hour" icon={Clock} />
          <TimelineItem time="6:30 PM" event="Reception & dinner" icon={DollarSign} />
          <TimelineItem time="8:00 PM" event="First dance" icon={Heart} />
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-warm-600 text-white text-xs tracking-wider uppercase rounded-full">
          Start Free <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

// Ad 12: Seating Chart UI Preview
function AdSeatingUI() {
  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex items-center justify-between mb-4">
        <Logo size="sm" showText={true} href={undefined} />
        <span className="text-[10px] text-warm-400 uppercase tracking-wider">Seating Chart</span>
      </div>
      
      {/* Mock UI */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-warm-200 p-4 overflow-hidden">
        <div className="flex gap-2 mb-4">
          <span className="text-[10px] px-2 py-1 bg-green-100 text-green-700 rounded-full">86 seated</span>
          <span className="text-[10px] px-2 py-1 bg-amber-100 text-amber-700 rounded-full">12 unseated</span>
        </div>
        
        {/* Visual seating chart */}
        <div className="grid grid-cols-3 gap-3">
          {/* Head table */}
          <div className="col-span-3 bg-warm-100 rounded-lg p-2 text-center">
            <p className="text-[9px] text-warm-500 mb-1">Head Table</p>
            <div className="flex justify-center gap-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-full bg-warm-400" />
              ))}
            </div>
          </div>
          
          {/* Round tables */}
          {['Table 1', 'Table 2', 'Table 3', 'Table 4', 'Table 5', 'Table 6'].map((table) => (
            <div key={table} className="bg-warm-50 rounded-lg p-2 text-center">
              <p className="text-[8px] text-warm-400 mb-1">{table}</p>
              <div className="w-10 h-10 mx-auto rounded-full border-2 border-warm-200 flex items-center justify-center">
                <div className="flex flex-wrap gap-0.5 justify-center">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="w-2 h-2 rounded-full bg-warm-300" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-4 text-center">
        <div className="inline-flex items-center gap-2 px-5 py-2 bg-warm-600 text-white text-xs tracking-wider uppercase rounded-full">
          Start Free <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

// Ad 13: Full App Preview
function AdFullAppPreview() {
  return (
    <div className="h-full flex flex-col p-4">
      <Logo size="sm" showText={true} href={undefined} className="mb-3" />
      
      {/* Browser chrome mockup */}
      <div className="flex-1 bg-white rounded-lg shadow-lg overflow-hidden border border-warm-200">
        {/* Browser bar */}
        <div className="bg-warm-100 px-3 py-2 flex items-center gap-2 border-b border-warm-200">
          <div className="flex gap-1">
            <div className="w-2 h-2 rounded-full bg-warm-300" />
            <div className="w-2 h-2 rounded-full bg-warm-300" />
            <div className="w-2 h-2 rounded-full bg-warm-300" />
          </div>
          <div className="flex-1 bg-white rounded px-2 py-0.5 text-[8px] text-warm-400 text-center">
            emma-james.aisleboard.com
          </div>
        </div>
        
        {/* App content */}
        <div className="flex h-[calc(100%-28px)]">
          {/* Sidebar */}
          <div className="w-24 bg-warm-50 border-r border-warm-100 p-2">
            <div className="space-y-1">
              {['Dashboard', 'Budget', 'Guests', 'Timeline', 'Seating'].map((item, i) => (
                <div 
                  key={item} 
                  className={`text-[8px] px-2 py-1 rounded ${i === 1 ? 'bg-warm-200 text-warm-700' : 'text-warm-500'}`}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          
          {/* Main content */}
          <div className="flex-1 p-3">
            <p className="text-[9px] text-warm-400 mb-1">Budget Tracker</p>
            <div className="grid grid-cols-3 gap-1 mb-2">
              <div className="bg-warm-50 rounded p-1 text-center">
                <p className="text-[10px] font-medium text-warm-700">$25k</p>
                <p className="text-[7px] text-warm-400">Budget</p>
              </div>
              <div className="bg-green-50 rounded p-1 text-center">
                <p className="text-[10px] font-medium text-green-600">$8.5k</p>
                <p className="text-[7px] text-warm-400">Spent</p>
              </div>
              <div className="bg-blue-50 rounded p-1 text-center">
                <p className="text-[10px] font-medium text-blue-600">$16.5k</p>
                <p className="text-[7px] text-warm-400">Left</p>
              </div>
            </div>
            <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden mb-2">
              <div className="h-full w-[34%] bg-warm-500 rounded-full" />
            </div>
            <div className="space-y-1">
              {[['Venue', '$5,000'], ['Photo', '$2,500'], ['Catering', '$4,200']].map(([name, amt]) => (
                <div key={name} className="flex justify-between items-center bg-warm-50 rounded px-2 py-1">
                  <span className="text-[8px] text-warm-600">{name}</span>
                  <span className="text-[8px] text-warm-700">{amt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-warm-600 text-white text-[10px] tracking-wider uppercase rounded-full">
          Start Free <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LANDSCAPE ADS (16:9)
// ============================================================================

function Ad7LandscapeHero() {
  return (
    <div className="h-full flex items-center justify-between p-8">
      <div className="flex-1">
        <Logo size="sm" showText={true} href={undefined} className="mb-3" />
        <h2 className="text-3xl font-serif font-light text-warm-800 mb-4 leading-tight">
          Plan Your Wedding<br />
          <span className="text-warm-600">Without the Chaos</span>
        </h2>
        <p className="text-warm-600 mb-6 text-sm max-w-sm">
          A calm, beautiful space for you and your partner. No ads, no spam, no stress.
        </p>
        <div className="flex items-center gap-4">
          <div className="inline-flex items-center gap-2 px-5 py-2 bg-warm-600 text-white text-sm tracking-wider uppercase">
            Start Free
          </div>
          <span className="text-warm-500 text-sm">Plans start at $12/mo</span>
        </div>
      </div>
      
      <div className="hidden md:flex flex-col items-center justify-center flex-1">
        <Heart className="w-20 h-20 text-rose-300" />
      </div>
    </div>
  );
}

function Ad8LandscapeFeatures() {
  return (
    <div className="h-full flex items-center p-8 text-white">
      <div className="flex-1">
        <Logo size="sm" showText={true} href={undefined} variant="white" className="mb-3" />
        <h2 className="text-2xl font-serif font-light mb-2">
          Everything in One Place
        </h2>
        <p className="text-warm-300 text-sm">No more scattered spreadsheets</p>
      </div>
      
      <div className="flex gap-6">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
            <DollarSign className="w-6 h-6" />
          </div>
          <span className="text-xs">Budget</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
            <Users className="w-6 h-6" />
          </div>
          <span className="text-xs">Guests</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
            <Calendar className="w-6 h-6" />
          </div>
          <span className="text-xs">Timeline</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
            <Clock className="w-6 h-6" />
          </div>
          <span className="text-xs">Day-of</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-xs">Private</span>
        </div>
      </div>
    </div>
  );
}

// Ad 14: Landscape UI Preview
function AdLandscapeUIPreview() {
  return (
    <div className="h-full flex items-center gap-6 p-6">
      <div className="flex-1">
        <Logo size="sm" showText={true} href={undefined} className="mb-2" />
        <h2 className="text-xl font-serif font-light text-warm-800 mb-2">
          See it in action
        </h2>
        <p className="text-warm-500 text-sm mb-4">
          Budget tracking, guest lists, timelines — all in one beautiful place.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-warm-600 text-white text-xs tracking-wider uppercase rounded">
          Try Free
        </div>
      </div>
      
      {/* Mini app previews */}
      <div className="flex gap-3">
        {/* Budget mini */}
        <div className="w-32 bg-white rounded-lg shadow-sm border border-warm-200 p-2">
          <p className="text-[8px] text-warm-400 mb-1">Budget</p>
          <div className="text-center mb-1">
            <p className="text-sm font-medium text-warm-700">$25k</p>
          </div>
          <div className="h-1.5 bg-warm-100 rounded-full overflow-hidden">
            <div className="h-full w-[34%] bg-warm-500 rounded-full" />
          </div>
        </div>
        
        {/* Guests mini */}
        <div className="w-32 bg-white rounded-lg shadow-sm border border-warm-200 p-2">
          <p className="text-[8px] text-warm-400 mb-1">Guests</p>
          <div className="flex gap-1 mb-1">
            <span className="text-[8px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">86 yes</span>
            <span className="text-[8px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">24 pending</span>
          </div>
          <div className="flex gap-0.5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-warm-200" />
            ))}
          </div>
        </div>
        
        {/* Timeline mini */}
        <div className="w-32 bg-white rounded-lg shadow-sm border border-warm-200 p-2">
          <p className="text-[8px] text-warm-400 mb-1">Timeline</p>
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-warm-200" />
              <span className="text-[7px] text-warm-500">2:00 - Makeup</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-warm-200" />
              <span className="text-[7px] text-warm-500">4:00 - Photos</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-warm-300" />
              <span className="text-[7px] text-warm-500">5:00 - Ceremony</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
