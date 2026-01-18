"use client";

import { 
  Calculator, 
  Users, 
  Sparkles,
  CalendarCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Planning Dashboard",
    description: "See your entire wedding at a glance. Budget, guests, tasks—all in one place so nothing falls through the cracks.",
    icon: Sparkles,
    className: "md:col-span-2",
  },
  {
    title: "Guest Logic",
    description: "Advanced RSVP tracking with dietary handling.",
    icon: Users,
    className: "md:col-span-1",
  },
  {
    title: "Smart Budget",
    description: "Dynamic allocation that adapts to spending.",
    icon: Calculator,
    className: "md:col-span-1",
  },
  {
    title: "Timeline & Tasks",
    description: "Keep your checklist and timeline aligned so nothing slips.",
    icon: CalendarCheck,
    className: "md:col-span-2",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="font-serif text-4xl md:text-5xl mb-4 text-foreground">
            Everything you need. <br/>
            <span className="text-muted-foreground italic">Nothing you don&apos;t.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Replaces spreadsheets, disconnected apps, and endless email threads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={i}
              className={cn(
                "rounded-3xl p-8 border border-border bg-white shadow-soft",
                feature.className
              )}
            >
              <div className="h-12 w-12 rounded-full border border-border flex items-center justify-center mb-6">
                <feature.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <h3 className="font-serif text-2xl mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
