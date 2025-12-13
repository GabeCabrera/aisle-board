"use client";

import { useState } from "react";
import { Image, Twitter, Store } from "lucide-react";
import { Logo, LogoIcon } from "@/components/logo";

// Pinterest icon since lucide doesn't have one
function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
  );
}

export default function MediaKitPage() {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-serif text-warm-800 mb-2">Media Kit</h1>
        <p className="text-warm-500">Profile photos and banners for social media platforms. Click to view full-size for download.</p>
      </div>

      {/* Profile Photos */}
      <h2 className="text-xl font-serif text-warm-800 mb-6 flex items-center gap-2">
        <Image className="w-5 h-5 text-warm-400" />
        Profile Photos
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
        {/* Light Profile - Square */}
        <div 
          onClick={() => setSelectedAsset('profile-light')}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-gradient-to-br from-warm-50 to-warm-100 rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <ProfilePhotoLight />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Light (400×400)</p>
        </div>

        {/* Dark Profile - Square */}
        <div 
          onClick={() => setSelectedAsset('profile-dark')}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-warm-800 rounded-lg shadow-lg overflow-hidden">
            <ProfilePhotoDark />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Dark (400×400)</p>
        </div>

        {/* Logo Only - Light */}
        <div 
          onClick={() => setSelectedAsset('logo-only-light')}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-white rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <LogoOnlyLight />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Icon Only - Light</p>
        </div>

        {/* Logo Only - Dark */}
        <div 
          onClick={() => setSelectedAsset('logo-only-dark')}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-warm-800 rounded-lg shadow-lg overflow-hidden">
            <LogoOnlyDark />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Icon Only - Dark</p>
        </div>
      </div>

      {/* X/Twitter Banners */}
      <h2 className="text-xl font-serif text-warm-800 mb-6 flex items-center gap-2">
        <Twitter className="w-5 h-5 text-warm-400" />
        X / Twitter Banners (1500×500)
      </h2>
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div 
          onClick={() => setSelectedAsset('twitter-light')}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-[3/1] bg-gradient-to-r from-warm-50 via-rose-50 to-warm-100 rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <TwitterBannerLight />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Light Banner</p>
        </div>

        <div 
          onClick={() => setSelectedAsset('twitter-dark')}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-[3/1] bg-warm-800 rounded-lg shadow-lg overflow-hidden">
            <TwitterBannerDark />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Dark Banner</p>
        </div>
      </div>

      {/* Pinterest */}
      <h2 className="text-xl font-serif text-warm-800 mb-6 flex items-center gap-2">
        <PinterestIcon className="w-5 h-5 text-warm-400" />
        Pinterest
      </h2>
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {/* Pinterest Pin */}
        <div 
          onClick={() => setSelectedAsset('pinterest-pin')}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-[2/3] bg-gradient-to-b from-warm-50 via-rose-50 to-warm-100 rounded-lg shadow-lg overflow-hidden border border-warm-200 max-h-80">
            <PinterestPin />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Pin (1000×1500)</p>
        </div>

        {/* Pinterest Board Cover */}
        <div 
          onClick={() => setSelectedAsset('pinterest-board')}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-gradient-to-br from-warm-100 to-rose-50 rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <PinterestBoardCover />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Board Cover (600×600)</p>
        </div>

        {/* Pinterest Profile */}
        <div 
          onClick={() => setSelectedAsset('pinterest-profile')}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-square bg-warm-50 rounded-lg shadow-lg overflow-hidden border border-warm-200 w-32 mx-auto">
            <ProfilePhotoLight />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Profile (165×165)</p>
        </div>
      </div>

      {/* Etsy */}
      <h2 className="text-xl font-serif text-warm-800 mb-6 flex items-center gap-2">
        <Store className="w-5 h-5 text-warm-400" />
        Etsy
      </h2>
      <div className="space-y-6 mb-12">
        {/* Etsy Big Banner */}
        <div 
          onClick={() => setSelectedAsset('etsy-big-banner')}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-[4/1] bg-gradient-to-r from-warm-100 via-rose-50 to-warm-50 rounded-lg shadow-lg overflow-hidden border border-warm-200">
            <EtsyBigBanner />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Big Banner (3360×840)</p>
        </div>

        {/* Etsy Mini Banner */}
        <div 
          onClick={() => setSelectedAsset('etsy-mini-banner')}
          className="cursor-pointer hover:scale-[1.02] transition-transform"
        >
          <div className="aspect-[4/1] bg-warm-800 rounded-lg shadow-lg overflow-hidden">
            <EtsyMiniBanner />
          </div>
          <p className="text-sm text-warm-500 mt-2 text-center">Mini Banner (1200×300)</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Etsy Shop Icon */}
          <div 
            onClick={() => setSelectedAsset('etsy-icon')}
            className="cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <div className="aspect-square bg-warm-50 rounded-lg shadow-lg overflow-hidden border border-warm-200 w-32 mx-auto">
              <ProfilePhotoLight />
            </div>
            <p className="text-sm text-warm-500 mt-2 text-center">Shop Icon (500×500)</p>
          </div>

          {/* Etsy Listing Image */}
          <div 
            onClick={() => setSelectedAsset('etsy-listing')}
            className="cursor-pointer hover:scale-[1.02] transition-transform"
          >
            <div className="aspect-square bg-white rounded-lg shadow-lg overflow-hidden border border-warm-200 max-w-xs mx-auto">
              <EtsyListingImage />
            </div>
            <p className="text-sm text-warm-500 mt-2 text-center">Listing Image (2000×2000)</p>
          </div>
        </div>
      </div>

      {/* Full Screen Modal */}
      {selectedAsset && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedAsset(null)}
        >
          <div onClick={(e) => e.stopPropagation()} className="max-w-full max-h-full">
            {/* Profile Photos */}
            {selectedAsset === 'profile-light' && (
              <div className="w-[400px] max-w-[90vw] aspect-square bg-gradient-to-br from-warm-50 to-warm-100 rounded-lg overflow-hidden">
                <ProfilePhotoLight />
              </div>
            )}
            {selectedAsset === 'profile-dark' && (
              <div className="w-[400px] max-w-[90vw] aspect-square bg-warm-800 rounded-lg overflow-hidden">
                <ProfilePhotoDark />
              </div>
            )}
            {selectedAsset === 'logo-only-light' && (
              <div className="w-[400px] max-w-[90vw] aspect-square bg-white rounded-lg overflow-hidden">
                <LogoOnlyLight />
              </div>
            )}
            {selectedAsset === 'logo-only-dark' && (
              <div className="w-[400px] max-w-[90vw] aspect-square bg-warm-800 rounded-lg overflow-hidden">
                <LogoOnlyDark />
              </div>
            )}

            {/* Twitter Banners */}
            {selectedAsset === 'twitter-light' && (
              <div className="w-[900px] max-w-[95vw] aspect-[3/1] bg-gradient-to-r from-warm-50 via-rose-50 to-warm-100 rounded-lg overflow-hidden">
                <TwitterBannerLight />
              </div>
            )}
            {selectedAsset === 'twitter-dark' && (
              <div className="w-[900px] max-w-[95vw] aspect-[3/1] bg-warm-800 rounded-lg overflow-hidden">
                <TwitterBannerDark />
              </div>
            )}

            {/* Pinterest */}
            {selectedAsset === 'pinterest-pin' && (
              <div className="h-[90vh] max-h-[750px] aspect-[2/3] bg-gradient-to-b from-warm-50 via-rose-50 to-warm-100 rounded-lg overflow-hidden">
                <PinterestPin />
              </div>
            )}
            {selectedAsset === 'pinterest-board' && (
              <div className="w-[600px] max-w-[90vw] aspect-square bg-gradient-to-br from-warm-100 to-rose-50 rounded-lg overflow-hidden">
                <PinterestBoardCover />
              </div>
            )}
            {selectedAsset === 'pinterest-profile' && (
              <div className="w-[400px] max-w-[90vw] aspect-square bg-gradient-to-br from-warm-50 to-warm-100 rounded-lg overflow-hidden">
                <ProfilePhotoLight />
              </div>
            )}

            {/* Etsy */}
            {selectedAsset === 'etsy-big-banner' && (
              <div className="w-[95vw] max-w-[1200px] aspect-[4/1] bg-gradient-to-r from-warm-100 via-rose-50 to-warm-50 rounded-lg overflow-hidden">
                <EtsyBigBanner />
              </div>
            )}
            {selectedAsset === 'etsy-mini-banner' && (
              <div className="w-[95vw] max-w-[900px] aspect-[4/1] bg-warm-800 rounded-lg overflow-hidden">
                <EtsyMiniBanner />
              </div>
            )}
            {selectedAsset === 'etsy-icon' && (
              <div className="w-[500px] max-w-[90vw] aspect-square bg-gradient-to-br from-warm-50 to-warm-100 rounded-lg overflow-hidden">
                <ProfilePhotoLight />
              </div>
            )}
            {selectedAsset === 'etsy-listing' && (
              <div className="w-[600px] max-w-[90vw] aspect-square bg-white rounded-lg overflow-hidden">
                <EtsyListingImage />
              </div>
            )}

            <p className="text-white text-center mt-4 text-sm">Right-click → Save Image As... to download</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROFILE PHOTOS
// ============================================================================

function ProfilePhotoLight() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <Logo size="xl" showText={true} href={undefined} />
      <p className="text-xs text-warm-500 mt-3 tracking-wider">Wedding Planning App</p>
    </div>
  );
}

function ProfilePhotoDark() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6">
      <Logo size="xl" showText={true} href={undefined} variant="white" />
      <p className="text-xs text-warm-400 mt-3 tracking-wider">Wedding Planning App</p>
    </div>
  );
}

function LogoOnlyLight() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <LogoIcon size="lg" />
    </div>
  );
}

function LogoOnlyDark() {
  return (
    <div className="h-full flex items-center justify-center p-8">
      <LogoIcon size="lg" variant="white" />
    </div>
  );
}

// ============================================================================
// TWITTER BANNERS
// ============================================================================

function TwitterBannerLight() {
  return (
    <div className="h-full flex items-center justify-between px-12">
      <div className="flex items-center gap-6">
        <Logo size="lg" showText={true} href={undefined} />
      </div>
      <div className="text-right">
        <p className="text-xl font-serif text-warm-700 mb-1">Plan Your Wedding Without the Stress</p>
        <p className="text-sm text-warm-500">Free wedding planner • aisleboard.com</p>
      </div>
    </div>
  );
}

function TwitterBannerDark() {
  return (
    <div className="h-full flex items-center justify-between px-12 text-white">
      <div className="flex items-center gap-6">
        <Logo size="lg" showText={true} href={undefined} variant="white" />
      </div>
      <div className="text-right">
        <p className="text-xl font-serif mb-1">Plan Your Wedding Without the Stress</p>
        <p className="text-sm text-warm-400">Free wedding planner • aisleboard.com</p>
      </div>
    </div>
  );
}

// ============================================================================
// PINTEREST
// ============================================================================

function PinterestPin() {
  return (
    <div className="h-full flex flex-col items-center justify-between p-8 py-12 text-center">
      <Logo size="md" showText={true} href={undefined} />
      
      <div className="flex-1 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-serif font-light text-warm-800 mb-4 leading-tight">
          Free Wedding
          <br />
          Planning App
        </h2>
        <p className="text-warm-600 text-sm mb-6 max-w-[200px]">
          Budget tracker, guest list, seating charts, timeline & more
        </p>
        <div className="space-y-2 text-left text-sm text-warm-600">
          <p className="flex items-center gap-2"><svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> No monthly fees</p>
          <p className="flex items-center gap-2"><svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> No vendor ads</p>
          <p className="flex items-center gap-2"><svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Plan together</p>
        </div>
      </div>
      
      <div>
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-warm-600 text-white text-sm tracking-wider uppercase rounded-full">
          Try Free
        </div>
        <p className="text-xs text-warm-400 mt-3">aisleboard.com</p>
      </div>
    </div>
  );
}

function PinterestBoardCover() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 text-center">
      <Logo size="lg" showText={true} href={undefined} />
      <p className="text-sm text-warm-600 mt-4">Wedding Planning Templates</p>
    </div>
  );
}

// ============================================================================
// ETSY
// ============================================================================

function EtsyBigBanner() {
  return (
    <div className="h-full flex items-center justify-between px-16">
      <div className="flex items-center gap-8">
        <Logo size="lg" showText={true} href={undefined} />
        <div className="h-12 w-px bg-warm-300" />
        <div>
          <p className="text-lg font-serif text-warm-700">Wedding Planning Templates</p>
          <p className="text-sm text-warm-500">Printable PDFs for your perfect day</p>
        </div>
      </div>
      <div className="flex gap-4 text-sm text-warm-600">
        <span className="px-3 py-1 bg-white/60 rounded-full">Budget Tracker</span>
        <span className="px-3 py-1 bg-white/60 rounded-full">Guest List</span>
        <span className="px-3 py-1 bg-white/60 rounded-full">Seating Chart</span>
        <span className="px-3 py-1 bg-white/60 rounded-full">Timeline</span>
      </div>
    </div>
  );
}

function EtsyMiniBanner() {
  return (
    <div className="h-full flex items-center justify-center gap-8 text-white">
      <Logo size="md" showText={true} href={undefined} variant="white" />
      <div className="h-8 w-px bg-warm-600" />
      <p className="text-lg font-serif">Wedding Planning Templates</p>
    </div>
  );
}

function EtsyListingImage() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <Logo size="lg" showText={true} href={undefined} className="mb-6" />
      
      <h2 className="text-2xl font-serif text-warm-800 mb-2">
        Wedding Budget
        <br />
        Tracker
      </h2>
      <p className="text-warm-500 text-sm mb-6">Printable PDF Template</p>
      
      {/* Mock template preview */}
      <div className="w-full max-w-[200px] bg-warm-50 rounded-lg p-4 border border-warm-200">
        <div className="h-3 bg-warm-200 rounded mb-2 w-3/4" />
        <div className="h-2 bg-warm-100 rounded mb-1" />
        <div className="h-2 bg-warm-100 rounded mb-1 w-5/6" />
        <div className="h-2 bg-warm-100 rounded w-4/6" />
        <div className="mt-3 grid grid-cols-3 gap-1">
          <div className="h-6 bg-warm-200 rounded" />
          <div className="h-6 bg-warm-200 rounded" />
          <div className="h-6 bg-warm-200 rounded" />
        </div>
      </div>
      
      <p className="text-xs text-warm-400 mt-6">Instant Download • Fillable PDF</p>
    </div>
  );
}
