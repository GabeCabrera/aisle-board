"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "invalid">("loading");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const unsubscribe = async () => {
      try {
        const response = await fetch("/api/email/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (response.ok) {
          setStatus("success");
        } else {
          const data = await response.json();
          if (data.error === "Invalid token") {
            setStatus("invalid");
          } else {
            setStatus("error");
          }
        }
      } catch {
        setStatus("error");
      }
    };

    unsubscribe();
  }, [token]);

  return (
    <div className="w-full max-w-md text-center">
      <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
      <h1 className="text-3xl font-serif font-light tracking-widest uppercase mb-2">
        Aisle
      </h1>
      <div className="w-12 h-px bg-warm-400 mx-auto mt-6 mb-12" />

      {status === "loading" && (
        <div>
          <p className="text-warm-600 mb-4">Processing your request...</p>
          <div className="w-8 h-8 border-2 border-warm-300 border-t-warm-600 rounded-full animate-spin mx-auto" />
        </div>
      )}

      {status === "success" && (
        <div>
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-light text-warm-800 mb-4">
            You&apos;ve been unsubscribed
          </h2>
          <p className="text-warm-600 mb-8">
            You won&apos;t receive any more emails from us. If this was a mistake, you can update your preferences in your account settings.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-warm-600 text-white text-sm tracking-widest uppercase hover:bg-warm-700 transition-colors"
          >
            Return Home
          </Link>
        </div>
      )}

      {status === "invalid" && (
        <div>
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-light text-warm-800 mb-4">
            Invalid Link
          </h2>
          <p className="text-warm-600 mb-8">
            This unsubscribe link is invalid or has expired. If you&apos;re still receiving unwanted emails, please contact us at hello@aisleboard.com.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-warm-600 text-white text-sm tracking-widest uppercase hover:bg-warm-700 transition-colors"
          >
            Return Home
          </Link>
        </div>
      )}

      {status === "error" && (
        <div>
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-light text-warm-800 mb-4">
            Something went wrong
          </h2>
          <p className="text-warm-600 mb-8">
            We couldn&apos;t process your request. Please try again or contact us at hello@aisleboard.com.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-warm-600 text-white text-sm tracking-widest uppercase hover:bg-warm-700 transition-colors"
          >
            Return Home
          </Link>
        </div>
      )}
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-md text-center">
      <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
      <h1 className="text-3xl font-serif font-light tracking-widest uppercase mb-2">
        Aisle
      </h1>
      <div className="w-12 h-px bg-warm-400 mx-auto mt-6 mb-12" />
      <p className="text-warm-600 mb-4">Loading...</p>
      <div className="w-8 h-8 border-2 border-warm-300 border-t-warm-600 rounded-full animate-spin mx-auto" />
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-warm-50">
      <Suspense fallback={<LoadingFallback />}>
        <UnsubscribeContent />
      </Suspense>
    </main>
  );
}
