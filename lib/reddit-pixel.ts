// Reddit Pixel helper functions for Next.js App Router
// Reference: https://advertising.reddithelp.com/en/categories/measurement/install-reddit-pixel

export const REDDIT_PIXEL_ID = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RedditPixelFunction = (...args: any[]) => void;

// Initialize the Reddit Pixel
export const init = () => {
  if (typeof window === 'undefined' || !REDDIT_PIXEL_ID) return;
  
  // Don't initialize if already loaded
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).rdt) return;
  
  // Reddit Pixel base code (from Reddit's official snippet)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (function(w: any, d: Document) {
    if (!w.rdt) {
      const p: RedditPixelFunction & { callQueue?: unknown[]; sendEvent?: RedditPixelFunction } = function() {
        // eslint-disable-next-line prefer-rest-params, @typescript-eslint/no-explicit-any
        p.sendEvent ? p.sendEvent.apply(p, arguments as any) : p.callQueue?.push(arguments);
      };
      p.callQueue = [];
      w.rdt = p;
      const t = d.createElement('script');
      t.src = 'https://www.redditstatic.com/ads/pixel.js';
      t.async = true;
      const s = d.getElementsByTagName('script')[0];
      s.parentNode?.insertBefore(t, s);
    }
  })(window, document);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).rdt('init', REDDIT_PIXEL_ID, { optOut: false, useDecimalCurrencyValues: true });
};

// Get the rdt function safely
const getRdt = (): RedditPixelFunction | null => {
  if (typeof window === 'undefined') return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (window as any).rdt || null;
};

// Track page visits - call this on route changes
export const pageVisit = () => {
  const rdt = getRdt();
  if (!rdt) return;
  rdt('track', 'PageVisit');
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
  | 'SignUp'
  | 'Custom';

// Conversion IDs for custom events
export const CONVERSION_IDS = {
  SIGN_UP: 'signup_001',
  PURCHASE: 'purchase_001', 
  LEAD: 'lead_001',
  // Add more conversion IDs as needed
} as const;

// Track standard events with optional conversion ID
export const track = (
  event: RedditPixelEvent, 
  data?: Record<string, unknown> & { conversionId?: string }
) => {
  const rdt = getRdt();
  if (!rdt) return;
  
  if (data) {
    rdt('track', event, data);
  } else {
    rdt('track', event);
  }
};

// Track conversion with conversion ID
export const trackConversion = (
  event: RedditPixelEvent,
  conversionId: string,
  additionalData?: Record<string, unknown>
) => {
  const rdt = getRdt();
  if (!rdt) return;
  
  rdt('track', event, {
    conversionId,
    ...additionalData,
  });
};

// Track purchase with value and conversion ID
export const trackPurchase = (
  value: number, 
  conversionId?: string,
  currency = 'USD', 
  itemCount = 1
) => {
  const rdt = getRdt();
  if (!rdt) return;
  
  rdt('track', 'Purchase', {
    value,
    currency,
    itemCount,
    ...(conversionId && { conversionId }),
  });
};

// Track sign up conversion
export const trackSignUp = (conversionId?: string) => {
  const rdt = getRdt();
  if (!rdt) return;
  
  rdt('track', 'SignUp', {
    ...(conversionId && { conversionId }),
  });
};

// Track lead generation
export const trackLead = (conversionId?: string) => {
  const rdt = getRdt();
  if (!rdt) return;
  
  rdt('track', 'Lead', {
    ...(conversionId && { conversionId }),
  });
};

// Track custom event with conversion ID
export const trackCustom = (conversionId: string, additionalData?: Record<string, unknown>) => {
  const rdt = getRdt();
  if (!rdt) return;
  
  rdt('track', 'Custom', {
    conversionId,
    ...additionalData,
  });
};
