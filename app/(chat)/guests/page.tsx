"use client";

export default function GuestsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink mb-1">Guest List</h1>
        <p className="text-ink-soft">Manage your wedding guests</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
        </div>
        <h2 className="font-medium text-ink text-xl mb-2">Guest management coming soon</h2>
        <p className="text-ink-soft mb-6">
          For now, tell me about your guests in chat and I&apos;ll add them to your list.
        </p>
        <a 
          href="/c" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
        >
          Go to chat
        </a>
      </div>
    </div>
  );
}
