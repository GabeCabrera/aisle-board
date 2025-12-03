"use client";

import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-serif text-3xl text-ink mb-1">Settings</h1>
        <p className="text-ink-soft">Manage your account and preferences</p>
      </div>

      {/* Account section */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-6">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-100">
          <h2 className="font-medium text-ink">Account</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center text-white text-xl font-medium">
              {session?.user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
            </div>
            <div>
              <p className="font-medium text-ink text-lg">{session?.user?.name || "Unknown"}</p>
              <p className="text-ink-soft">{session?.user?.email || "No email"}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Plan section */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-6">
        <div className="px-6 py-4 bg-stone-50 border-b border-stone-100">
          <h2 className="font-medium text-ink">Plan</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink">Free Plan</p>
              <p className="text-sm text-ink-soft">Basic features included</p>
            </div>
            <button className="px-4 py-2 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors text-sm font-medium">
              Upgrade
            </button>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-200 overflow-hidden">
        <div className="px-6 py-4 bg-red-50 border-b border-red-100">
          <h2 className="font-medium text-red-700">Danger Zone</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-ink">Delete Account</p>
              <p className="text-sm text-ink-soft">Permanently delete your account and all data</p>
            </div>
            <button className="px-4 py-2 border border-red-300 text-red-600 rounded-xl hover:bg-red-50 transition-colors text-sm font-medium">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
