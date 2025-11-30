"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Check, Clock, FileText, Users, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const FREE_TEMPLATES = [
  {
    id: "timeline",
    name: "Wedding Day Timeline",
    description: "A comprehensive hour-by-hour schedule template to keep your big day running smoothly. Includes pre-ceremony, ceremony, cocktail hour, reception, and departure sections.",
    icon: Clock,
    pages: 4,
    downloadUrl: "/templates/wedding-day-timeline.pdf",
  },
  {
    id: "budget",
    name: "Budget Overview",
    description: "Track all your wedding expenses in one place. Includes categories for venue, catering, photography, flowers, attire, and more with running totals.",
    icon: FileText,
    pages: 6,
    downloadUrl: "/templates/budget-overview.pdf",
  },
  {
    id: "guests",
    name: "Guest List Tracker",
    description: "Manage your entire guest list with columns for RSVPs, meal preferences, plus-ones, table assignments, and gift tracking.",
    icon: Users,
    pages: 8,
    downloadUrl: "/templates/guest-list-tracker.pdf",
  },
];

const UPGRADE_BENEFITS = [
  "20+ additional templates",
  "Interactive web-based planner",
  "Vendor comparison tools",
  "Seating chart builder",
  "Real-time collaboration",
  "Ceremony & vow planner",
];

export default function FreeTemplatesPage() {
  const [downloaded, setDownloaded] = useState<Set<string>>(new Set());

  const handleDownload = (templateId: string) => {
    setDownloaded((prev) => new Set([...prev, templateId]));
    // In production, this would trigger the actual PDF download
    // For now, we'll just mark it as downloaded
  };

  const allDownloaded = downloaded.size === FREE_TEMPLATES.length;

  return (
    <main className="min-h-screen py-16 px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-12 h-px bg-warm-400 mx-auto mb-6" />
          <h1 className="text-3xl font-serif font-light tracking-widest uppercase mb-4">
            Your Free Templates
          </h1>
          <p className="text-warm-600">
            Download these essential planning templates to get started on your wedding journey.
          </p>
          <div className="w-12 h-px bg-warm-400 mx-auto mt-6" />
        </div>

        {/* Templates */}
        <div className="space-y-6 mb-16">
          {FREE_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="p-6 border border-warm-200 rounded-sm bg-white"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-sm bg-warm-100 flex items-center justify-center flex-shrink-0">
                    <template.icon className="w-6 h-6 text-warm-500" />
                  </div>
                  <div>
                    <h3 className="font-serif text-lg text-warm-800 mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-warm-600 mb-2">
                      {template.description}
                    </p>
                    <p className="text-xs text-warm-400">
                      {template.pages} pages • PDF format
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownload(template.id)}
                  disabled={downloaded.has(template.id)}
                  className="flex-shrink-0"
                >
                  {downloaded.has(template.id) ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Downloaded
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Upgrade CTA */}
        <div className="p-8 border border-warm-300 rounded-sm bg-gradient-to-br from-warm-50 to-white">
          <div className="text-center mb-6">
            <Sparkles className="w-8 h-8 text-warm-500 mx-auto mb-4" />
            <h2 className="text-xl font-serif tracking-wider uppercase mb-2">
              Want the Full Experience?
            </h2>
            <p className="text-warm-600">
              Upgrade to Complete for the interactive web planner and 20+ more templates.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-8">
            {UPGRADE_BENEFITS.map((benefit) => (
              <div key={benefit} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-warm-500 flex-shrink-0" />
                <span className="text-sm text-warm-700">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/choose-plan">
              <Button className="bg-warm-600 hover:bg-warm-700 text-white px-8">
                Upgrade to Complete — $29
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <p className="mt-3 text-xs text-warm-500">
              One-time payment • Lifetime access
            </p>
          </div>
        </div>

        {/* Continue with Free */}
        {allDownloaded && (
          <div className="mt-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="text-warm-600 mb-4">
              All templates downloaded! You're ready to start planning.
            </p>
            <p className="text-sm text-warm-500">
              We hope these templates help you plan your perfect day. 
              You can always come back to upgrade if you'd like the full interactive experience.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
