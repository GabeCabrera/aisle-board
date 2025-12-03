"use client";

import { useEffect, useState } from "react";

interface KernelData {
  names?: string[];
  weddingDate?: string;
  guestCount?: number;
  budgetTotal?: number;
  vibe?: string[];
  vendorsBooked?: string[];
}

interface DecisionProgress {
  total: number;
  decided: number;
  locked: number;
  percentComplete: number;
}

export default function DashboardPage() {
  const [kernel, setKernel] = useState<KernelData | null>(null);
  const [progress, setProgress] = useState<DecisionProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/chat/debug");
        const data = await res.json();
        if (data.kernel) {
          setKernel(data.kernel);
        }
        // TODO: Load progress from decisions API
        setProgress({ total: 35, decided: 4, locked: 1, percentComplete: 11 });
      } catch (e) {
        console.error("Failed to load dashboard data:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-2 text-ink-soft">
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  const daysUntil = kernel?.weddingDate 
    ? Math.ceil((new Date(kernel.weddingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  const coupleNames = kernel?.names?.length === 2 
    ? `${kernel.names[0]} & ${kernel.names[1]}` 
    : "Your Wedding";

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink mb-2">{coupleNames}</h1>
        {kernel?.weddingDate && (
          <p className="text-ink-soft">
            {new Date(kernel.weddingDate).toLocaleDateString("en-US", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Countdown */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <p className="text-sm text-ink-soft mb-1">Days to go</p>
          {daysUntil !== null ? (
            <p className="text-4xl font-serif text-ink">{daysUntil}</p>
          ) : (
            <p className="text-xl text-ink-faint">Set a date</p>
          )}
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <p className="text-sm text-ink-soft mb-1">Planning progress</p>
          {progress ? (
            <>
              <p className="text-4xl font-serif text-ink">{progress.percentComplete}%</p>
              <div className="mt-2 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
                  style={{ width: `${progress.percentComplete}%` }}
                />
              </div>
              <p className="text-xs text-ink-faint mt-2">{progress.decided} of {progress.total} decisions</p>
            </>
          ) : (
            <p className="text-xl text-ink-faint">Loading...</p>
          )}
        </div>

        {/* Budget */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <p className="text-sm text-ink-soft mb-1">Budget</p>
          {kernel?.budgetTotal ? (
            <p className="text-4xl font-serif text-ink">
              ${(kernel.budgetTotal / 100).toLocaleString()}
            </p>
          ) : (
            <p className="text-xl text-ink-faint">Not set</p>
          )}
        </div>

        {/* Guests */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <p className="text-sm text-ink-soft mb-1">Guest count</p>
          {kernel?.guestCount ? (
            <p className="text-4xl font-serif text-ink">{kernel.guestCount}</p>
          ) : (
            <p className="text-xl text-ink-faint">Not set</p>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <QuickAction 
          href="/c"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          }
          title="Chat with Aisle"
          description="Get help with anything"
        />
        <QuickAction 
          href="/checklist"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="View checklist"
          description="See what's next"
        />
        <QuickAction 
          href="/budget"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Track budget"
          description="Manage expenses"
        />
      </div>

      {/* Vendors booked */}
      {kernel?.vendorsBooked && kernel.vendorsBooked.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="font-medium text-ink mb-4">Vendors Booked</h3>
          <div className="flex flex-wrap gap-2">
            {kernel.vendorsBooked.map((vendor, i) => (
              <span 
                key={i}
                className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium"
              >
                ✓ {vendor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Vibe */}
      {kernel?.vibe && kernel.vibe.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mt-4">
          <h3 className="font-medium text-ink mb-4">Your Vibe</h3>
          <div className="flex flex-wrap gap-2">
            {kernel.vibe.map((v, i) => (
              <span 
                key={i}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full text-sm"
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickAction({ 
  href, 
  icon, 
  title, 
  description 
}: { 
  href: string; 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) {
  return (
    <a 
      href={href}
      className="bg-white rounded-2xl border border-stone-200 p-6 hover:border-rose-300 hover:shadow-soft transition-all group"
    >
      <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 group-hover:bg-rose-100 transition-colors">
        {icon}
      </div>
      <h3 className="font-medium text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-soft">{description}</p>
    </a>
  );
}
