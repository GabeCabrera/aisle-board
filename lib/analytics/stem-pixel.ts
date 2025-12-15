/**
 * Stem Pixel - Custom Analytics Tracking Library
 *
 * Tracks user behavior events and sends them in batches to the server.
 */

type EventType =
  | "page_view"
  | "click"
  | "feature_use"
  | "ai_message"
  | "form_submit"
  | "error"
  | "session_start"
  | "session_end";

interface AnalyticsEvent {
  eventType: EventType;
  eventName: string;
  eventData?: Record<string, unknown>;
  pagePath: string;
  pageTitle?: string;
  timestamp: number;
  timeOnPage?: number;
}

interface UTMParams {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
}

// Session storage keys
const SESSION_ID_KEY = "stem_session_id";
const SESSION_START_KEY = "stem_session_start";
const UTM_PARAMS_KEY = "stem_utm_params";
const PAGE_ENTER_TIME_KEY = "stem_page_enter";

// Event queue
let eventQueue: AnalyticsEvent[] = [];
let flushTimer: NodeJS.Timeout | null = null;
let isInitialized = false;
let sessionId: string = "";
let sessionStart: number = 0;
let utmParams: UTMParams = {};

// Configuration
const FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_QUEUE_SIZE = 50;

/**
 * Generate a random session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Get device type based on screen width
 */
function getDeviceType(): "mobile" | "tablet" | "desktop" {
  if (typeof window === "undefined") return "desktop";
  const width = window.innerWidth;
  if (width < 768) return "mobile";
  if (width < 1024) return "tablet";
  return "desktop";
}

/**
 * Extract UTM parameters from URL
 */
function extractUTMParams(): UTMParams {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
    utmContent: params.get("utm_content") || undefined,
    utmTerm: params.get("utm_term") || undefined,
  };
}

/**
 * Send events to server
 */
async function sendEvents(events: AnalyticsEvent[]): Promise<void> {
  if (events.length === 0) return;

  try {
    const payload = {
      events,
      sessionId,
      sessionStart,
      referrer: typeof document !== "undefined" ? document.referrer : undefined,
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      screenWidth: typeof window !== "undefined" ? window.screen.width : undefined,
      screenHeight: typeof window !== "undefined" ? window.screen.height : undefined,
      deviceType: getDeviceType(),
      ...utmParams,
    };

    await fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      // Use keepalive for page unload scenarios
      keepalive: true,
    });
  } catch (error) {
    // Silently fail - analytics should not break the app
    console.debug("[StemPixel] Failed to send events:", error);
  }
}

/**
 * Flush the event queue
 */
function flush(): void {
  if (eventQueue.length === 0) return;

  const eventsToSend = [...eventQueue];
  eventQueue = [];
  sendEvents(eventsToSend);
}

/**
 * Schedule next flush
 */
function scheduleFlush(): void {
  if (flushTimer) return;

  flushTimer = setTimeout(() => {
    flush();
    flushTimer = null;
    if (eventQueue.length > 0) {
      scheduleFlush();
    }
  }, FLUSH_INTERVAL);
}

/**
 * Add event to queue
 */
function queueEvent(event: AnalyticsEvent): void {
  eventQueue.push(event);

  // Flush immediately if queue is full
  if (eventQueue.length >= MAX_QUEUE_SIZE) {
    flush();
  } else {
    scheduleFlush();
  }
}

/**
 * Initialize the pixel
 */
export function init(): void {
  if (typeof window === "undefined") return;
  if (isInitialized) return;

  // Restore or create session
  const storedSessionId = sessionStorage.getItem(SESSION_ID_KEY);
  const storedSessionStart = sessionStorage.getItem(SESSION_START_KEY);

  if (storedSessionId && storedSessionStart) {
    sessionId = storedSessionId;
    sessionStart = parseInt(storedSessionStart, 10);
  } else {
    sessionId = generateSessionId();
    sessionStart = Date.now();
    sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    sessionStorage.setItem(SESSION_START_KEY, sessionStart.toString());

    // Track session start
    queueEvent({
      eventType: "session_start",
      eventName: "session_started",
      pagePath: window.location.pathname,
      pageTitle: document.title,
      timestamp: sessionStart,
    });
  }

  // Get UTM params (only on first page of session)
  const storedUTM = sessionStorage.getItem(UTM_PARAMS_KEY);
  if (storedUTM) {
    utmParams = JSON.parse(storedUTM);
  } else {
    utmParams = extractUTMParams();
    if (Object.values(utmParams).some(Boolean)) {
      sessionStorage.setItem(UTM_PARAMS_KEY, JSON.stringify(utmParams));
    }
  }

  // Track page enter time
  sessionStorage.setItem(PAGE_ENTER_TIME_KEY, Date.now().toString());

  // Flush on page unload
  window.addEventListener("beforeunload", () => {
    const pageEnterTime = sessionStorage.getItem(PAGE_ENTER_TIME_KEY);
    const timeOnPage = pageEnterTime ? Date.now() - parseInt(pageEnterTime, 10) : undefined;

    // Track session end
    queueEvent({
      eventType: "session_end",
      eventName: "page_exit",
      pagePath: window.location.pathname,
      pageTitle: document.title,
      timestamp: Date.now(),
      timeOnPage,
    });

    flush();
  });

  // Flush on visibility change (tab switch)
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flush();
    }
  });

  isInitialized = true;
}

/**
 * Track a page view
 */
export function trackPageView(path?: string, title?: string): void {
  if (!isInitialized) init();

  // Calculate time on previous page
  const pageEnterTime = sessionStorage.getItem(PAGE_ENTER_TIME_KEY);
  const timeOnPage = pageEnterTime ? Date.now() - parseInt(pageEnterTime, 10) : undefined;

  // Update page enter time for new page
  sessionStorage.setItem(PAGE_ENTER_TIME_KEY, Date.now().toString());

  queueEvent({
    eventType: "page_view",
    eventName: "page_viewed",
    pagePath: path || (typeof window !== "undefined" ? window.location.pathname : "/"),
    pageTitle: title || (typeof document !== "undefined" ? document.title : undefined),
    timestamp: Date.now(),
    timeOnPage,
  });
}

/**
 * Track a click event
 */
export function trackClick(elementId: string, elementText?: string, data?: Record<string, unknown>): void {
  if (!isInitialized) init();

  queueEvent({
    eventType: "click",
    eventName: elementId,
    eventData: { elementText, ...data },
    pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
    pageTitle: typeof document !== "undefined" ? document.title : undefined,
    timestamp: Date.now(),
  });
}

/**
 * Track feature usage
 */
export function trackFeatureUse(featureName: string, data?: Record<string, unknown>): void {
  if (!isInitialized) init();

  queueEvent({
    eventType: "feature_use",
    eventName: featureName,
    eventData: data,
    pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
    pageTitle: typeof document !== "undefined" ? document.title : undefined,
    timestamp: Date.now(),
  });
}

/**
 * Track AI message interaction
 */
export function trackAIMessage(messageType: "sent" | "received" | "tool_used", data?: Record<string, unknown>): void {
  if (!isInitialized) init();

  queueEvent({
    eventType: "ai_message",
    eventName: `ai_message_${messageType}`,
    eventData: data,
    pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
    pageTitle: typeof document !== "undefined" ? document.title : undefined,
    timestamp: Date.now(),
  });
}

/**
 * Track form submission
 */
export function trackFormSubmit(formName: string, data?: Record<string, unknown>): void {
  if (!isInitialized) init();

  queueEvent({
    eventType: "form_submit",
    eventName: formName,
    eventData: data,
    pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
    pageTitle: typeof document !== "undefined" ? document.title : undefined,
    timestamp: Date.now(),
  });
}

/**
 * Track an error
 */
export function trackError(errorName: string, error?: Error | string, data?: Record<string, unknown>): void {
  if (!isInitialized) init();

  queueEvent({
    eventType: "error",
    eventName: errorName,
    eventData: {
      message: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      ...data,
    },
    pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
    pageTitle: typeof document !== "undefined" ? document.title : undefined,
    timestamp: Date.now(),
  });
}

/**
 * Get current session ID
 */
export function getSessionId(): string {
  return sessionId;
}

/**
 * Manually flush events
 */
export function forceFlush(): void {
  flush();
}

// Export as stemPixel object for convenient usage
export const stemPixel = {
  init,
  trackPageView,
  trackClick,
  trackFeatureUse,
  trackAIMessage,
  trackFormSubmit,
  trackError,
  getSessionId,
  forceFlush,
};

export default stemPixel;
