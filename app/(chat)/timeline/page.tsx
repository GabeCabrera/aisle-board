"use client";

export default function TimelinePage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink mb-1">Timeline</h1>
        <p className="text-ink-soft">Plan your wedding day schedule</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
        </div>
        <h2 className="font-medium text-ink text-xl mb-2">Timeline planning coming soon</h2>
        <p className="text-ink-soft mb-6">
          For now, tell me about your wedding day schedule in chat and I&apos;ll help plan it.
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
