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
    title: "Sanity Engine",
    description: "A real-time stress score that tracks your planning health. We tell you when to panic (and when to relax).",
    icon: Sparkles,
    className: "md:col-span-2 bg-gradient-to-br from-primary/5 to-transparent",
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
    className: "md:col-span-2 bg-gradient-to-br from-secondary/5 to-transparent",
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-24 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-4xl md:text-5xl mb-4 text-foreground">
            Everything you need. <br/>
            <span className="text-muted-foreground italic">Nothing you don&apos;t.</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Replaces spreadsheets, disconnected apps, and endless email threads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className={cn(
                "group relative overflow-hidden rounded-3xl p-8 border border-border bg-white transition-all hover:shadow-lg hover:-translate-y-1",
                feature.className
              )}
            >
              <div className="h-12 w-12 rounded-2xl bg-background border border-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-6 h-6 text-primary" />
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
