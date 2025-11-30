// Reddit Pixel helper functions for Next.js App Router
// Reference: https://advertising.reddithelp.com/en/categories/measurement/install-reddit-pixel

export const REDDIT_PIXEL_ID = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID;

declare global {
  interface Window {
    rdt: (...args: unknown[]) => void;
  }
}

// Initialize the Reddit Pixel
export const init = () => {
  if (typeof window === 'undefined' || !REDDIT_PIXEL_ID) return;
  
  // Don't initialize if already loaded
  if (window.rdt) return;
  
  // Reddit Pixel base code
  (function(w: Window, d: Document) {
    if (!w.rdt) {
      const p = w.rdt = function(...args: unknown[]) {
        // @ts-expect-error - Reddit pixel pattern
        p.sendEvent ? p.sendEvent.apply(p, args) : p.callQueue.push(args);
      };
      // @ts-expect-error - Reddit pixel pattern
      p.callQueue = [];
      const t = d.createElement('script');
      t.src = 'https://www.redditstatic.com/ads/pixel.js';
      t.async = true;
      const s = d.getElementsByTagName('script')[0];
      s.parentNode?.insertBefore(t, s);
    }
  })(window, document);
  
  window.rdt('init', REDDIT_PIXEL_ID);
};

// Track page visits - call this on route changes
export const pageVisit = () => {
  if (typeof window === 'undefined' || !window.rdt) return;
  window.rdt('track', 'PageVisit');
};

// Standard Reddit Pixel events
export type RedditPixelEvent = 
  | 'PageVisit'
  | 'ViewContent'
  | 'Search'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'Purchase'
  | 'Lead'
  | 'SignUp';

// Track standard events
export const track = (event: RedditPixelEvent, data?: Record<string, unknown>) => {
  if (typeof window === 'undefined' || !window.rdt) return;
  
  if (data) {
    window.rdt('track', event, data);
  } else {
    window.rdt('track', event);
  }
};

// Track purchase with value
export const trackPurchase = (value: number, currency = 'USD', itemCount = 1) => {
  if (typeof window === 'undefined' || !window.rdt) return;
  
  window.rdt('track', 'Purchase', {
    value,
    currency,
    itemCount,
  });
};

// Track sign up conversion
export const trackSignUp = () => {
  track('SignUp');
};

// Track lead generation
export const trackLead = () => {
  track('Lead');
};
