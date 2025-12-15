"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense, useRef } from "react";
import * as stemPixel from "@/lib/analytics/stem-pixel";

function StemPixelTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isInitialized = useRef(false);
  const previousPathname = useRef<string | null>(null);

  // Initialize on mount
  useEffect(() => {
    if (!isInitialized.current) {
      stemPixel.init();
      stemPixel.trackPageView();
      isInitialized.current = true;
      previousPathname.current = pathname;
    }
  }, [pathname]);

  // Track page views on route changes
  useEffect(() => {
    // Only track if path actually changed (not just search params on same page)
    if (previousPathname.current !== null && previousPathname.current !== pathname) {
      stemPixel.trackPageView(pathname);
    }
    previousPathname.current = pathname;
  }, [pathname, searchParams]);

  // Set up global click tracking for elements with data-track attribute
  useEffect(() => {
    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement;
      const trackElement = target.closest("[data-track]") as HTMLElement | null;

      if (trackElement) {
        const trackType = trackElement.getAttribute("data-track");
        const trackName = trackElement.getAttribute("data-track-name") || trackElement.textContent?.trim() || "unknown";
        const trackData = trackElement.getAttribute("data-track-data");

        if (trackType === "click") {
          stemPixel.trackClick(
            trackName,
            trackElement.textContent?.trim(),
            trackData ? JSON.parse(trackData) : undefined
          );
        } else if (trackType === "feature") {
          stemPixel.trackFeatureUse(
            trackName,
            trackData ? JSON.parse(trackData) : undefined
          );
        }
      }
    }

    document.addEventListener("click", handleClick, { capture: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, []);

  // Set up global error tracking
  useEffect(() => {
    function handleError(event: ErrorEvent) {
      stemPixel.trackError("uncaught_error", event.error || event.message, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    }

    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      stemPixel.trackError("unhandled_promise_rejection", String(event.reason));
    }

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}

export function StemPixelTracker() {
  return (
    <Suspense fallback={null}>
      <StemPixelTrackerInner />
    </Suspense>
  );
}
