"use client";

import { usePlannerData, formatCurrency } from "@/lib/hooks/usePlannerData";
import Link from "next/link";

export default function DashboardPage() {
  const { data, loading } = usePlannerData();

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

  const summary = data?.summary;
  const budget = data?.budget;
  const guests = data?.guests;
  const vendors = data?.vendors;
  const decisions = data?.decisions;
  const kernel = data?.kernel;

  // Calculate alerts/priorities
  const alerts: Array<{ type: "warning" | "info" | "success"; message: string; link?: string }> = [];
  
  // Budget alerts
  if (budget && budget.total > 0 && budget.percentUsed > 100) {
    alerts.push({ 
      type: "warning", 
      message: `You're over budget by ${formatCurrency(budget.spent - budget.total)}`,
      link: "/budget"
    });
  } else if (budget && budget.total > 0 && budget.percentUsed > 90) {
    alerts.push({ 
      type: "warning", 
      message: `Budget is ${budget.percentUsed}% allocated`,
      link: "/budget"
    });
  }

  // Vendor alerts
  const essentialVendors = ["venue", "photographer", "catering", "officiant"];
  const bookedCategories = vendors?.list
    .filter(v => v.status === "booked" || v.status === "confirmed" || v.status === "paid")
    .map(v => v.category.toLowerCase()) || [];
  
  const missingEssentials = essentialVendors.filter(v => !bookedCategories.some(b => b.includes(v)));
  if (missingEssentials.length > 0 && summary?.daysUntil && summary.daysUntil < 180) {
    alerts.push({ 
      type: "warning", 
      message: `Still need to book: ${missingEssentials.join(", ")}`,
      link: "/vendors"
    });
  }

  // Guest alerts
  if (guests && guests.stats.total > 0 && guests.stats.pending > 0 && summary?.daysUntil && summary.daysUntil < 60) {
    alerts.push({ 
      type: "info", 
      message: `${guests.stats.pending} guests haven't RSVP'd yet`,
      link: "/guests"
    });
  }

  // Success alerts
  if (vendors && vendors.stats.booked >= 3) {
    alerts.push({ 
      type: "success", 
      message: `${vendors.stats.booked} vendors booked!`,
      link: "/vendors"
    });
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink mb-2">
          {summary?.coupleNames || "Your Wedding"}
        </h1>
        {summary?.weddingDate && (
          <p className="text-ink-soft">
            {new Date(summary.weddingDate).toLocaleDateString("en-US", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </p>
        )}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2 mb-6">
          {alerts.map((alert, i) => (
            <Link 
              key={i} 
              href={alert.link || "#"}
              className={`block p-4 rounded-xl border transition-colors ${
                alert.type === "warning" 
                  ? "bg-amber-50 border-amber-200 hover:border-amber-300" 
                  : alert.type === "success"
                    ? "bg-green-50 border-green-200 hover:border-green-300"
                    : "bg-blue-50 border-blue-200 hover:border-blue-300"
              }`}
            >
              <div className="flex items-center gap-3">
                {alert.type === "warning" && (
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                )}
                {alert.type === "success" && (
                  <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {alert.type === "info" && (
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                )}
                <span className={`text-sm font-medium ${
                  alert.type === "warning" ? "text-amber-800" 
                    : alert.type === "success" ? "text-green-800"
                    : "text-blue-800"
                }`}>
                  {alert.message}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Countdown */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <p className="text-sm text-ink-soft mb-1">Days to go</p>
          {summary?.daysUntil !== null ? (
            <p className="text-4xl font-serif text-ink">{summary?.daysUntil}</p>
          ) : (
            <p className="text-xl text-ink-faint">Set a date</p>
          )}
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <p className="text-sm text-ink-soft mb-1">Planning progress</p>
          {decisions?.progress ? (
            <>
              <p className="text-4xl font-serif text-ink">{decisions.progress.percentComplete}%</p>
              <div className="mt-2 h-2 bg-stone-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full"
                  style={{ width: `${decisions.progress.percentComplete}%` }}
                />
              </div>
              <p className="text-xs text-ink-faint mt-2">
                {decisions.progress.decided} of {decisions.progress.total} decisions
              </p>
            </>
          ) : (
            <p className="text-xl text-ink-faint">Start planning</p>
          )}
        </div>

        {/* Budget */}
        <Link href="/budget" className="bg-white rounded-2xl border border-stone-200 p-6 hover:border-rose-300 transition-colors">
          <p className="text-sm text-ink-soft mb-1">Budget</p>
          {budget && budget.total > 0 ? (
            <>
              <p className="text-4xl font-serif text-ink">
                {formatCurrency(budget.total)}
              </p>
              <p className="text-xs text-ink-faint mt-2">
                {formatCurrency(budget.spent)} allocated ({budget.percentUsed}%)
              </p>
            </>
          ) : budget && budget.spent > 0 ? (
            <>
              <p className="text-4xl font-serif text-ink">
                {formatCurrency(budget.spent)}
              </p>
              <p className="text-xs text-ink-faint mt-2">allocated so far</p>
            </>
          ) : (
            <p className="text-xl text-ink-faint">Not set</p>
          )}
        </Link>

        {/* Guests */}
        <Link href="/guests" className="bg-white rounded-2xl border border-stone-200 p-6 hover:border-rose-300 transition-colors">
          <p className="text-sm text-ink-soft mb-1">Guests</p>
          {guests && guests.stats.total > 0 ? (
            <>
              <p className="text-4xl font-serif text-ink">{guests.stats.total}</p>
              <p className="text-xs text-ink-faint mt-2">
                {guests.stats.confirmed} confirmed, {guests.stats.pending} pending
              </p>
            </>
          ) : kernel?.guestCount ? (
            <>
              <p className="text-4xl font-serif text-ink">~{kernel.guestCount}</p>
              <p className="text-xs text-ink-faint mt-2">estimated</p>
            </>
          ) : (
            <p className="text-xl text-ink-faint">Not set</p>
          )}
        </Link>
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
          description={decisions?.progress 
            ? `${decisions.progress.notStarted} items to do`
            : "See what's next"
          }
        />
        <QuickAction 
          href="/vendors"
          icon={
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z" />
            </svg>
          }
          title="Track vendors"
          description={vendors?.stats.booked 
            ? `${vendors.stats.booked} booked`
            : "Manage your team"
          }
        />
      </div>

      {/* Vendors booked */}
      {vendors && vendors.list.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-ink">Your Vendors</h3>
            <Link href="/vendors" className="text-sm text-rose-600 hover:text-rose-700">
              View all →
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {vendors.list.slice(0, 8).map((vendor) => {
              const isBooked = vendor.status === "booked" || vendor.status === "confirmed" || vendor.status === "paid";
              return (
                <span 
                  key={vendor.id}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                    isBooked 
                      ? "bg-green-50 text-green-700" 
                      : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {isBooked && "✓ "}{vendor.name}
                </span>
              );
            })}
            {vendors.list.length > 8 && (
              <span className="px-3 py-1.5 text-sm text-ink-faint">
                +{vendors.list.length - 8} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Vibe */}
      {summary?.vibe && summary.vibe.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h3 className="font-medium text-ink mb-4">Your Vibe</h3>
          <div className="flex flex-wrap gap-2">
            {summary.vibe.map((v, i) => (
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

      {/* Empty state prompt */}
      {!summary?.weddingDate && !budget?.spent && !guests?.stats.total && (
        <div className="mt-8 p-6 bg-rose-50 rounded-2xl text-center">
          <h3 className="font-medium text-ink mb-2">Let&apos;s get started!</h3>
          <p className="text-ink-soft mb-4">
            Head to chat and tell me about your wedding plans. I&apos;ll help you organize everything.
          </p>
          <Link 
            href="/c" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
          >
            Start chatting
          </Link>
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
    <Link 
      href={href}
      className="bg-white rounded-2xl border border-stone-200 p-6 hover:border-rose-300 hover:shadow-soft transition-all group"
    >
      <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4 group-hover:bg-rose-100 transition-colors">
        {icon}
      </div>
      <h3 className="font-medium text-ink mb-1">{title}</h3>
      <p className="text-sm text-ink-soft">{description}</p>
    </Link>
  );
}
