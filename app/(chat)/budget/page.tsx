"use client";

export default function BudgetPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink mb-1">Budget</h1>
        <p className="text-ink-soft">Track your wedding expenses</p>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="font-medium text-ink text-xl mb-2">Budget tracking coming soon</h2>
        <p className="text-ink-soft mb-6">
          For now, tell me about your expenses in chat and I&apos;ll track them for you.
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
