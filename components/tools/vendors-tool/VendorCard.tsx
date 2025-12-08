"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, Vendor } from "@/lib/hooks/usePlannerData"; // Assuming Vendor type is also exported or defined globally
import {
  Home,
  Utensils,
  Camera,
  Video, // Changed from Videocam to Video
  Flower, // Changed from LocalFlorist to Flower
  Music, // Changed from MusicNote to Music
  Cake,
  Heart, // Changed from Favorite to Heart
  Scissors, // Changed from ContentCut to Scissors
  Sparkles, // Changed from AutoAwesome to Sparkles
  Armchair,
  Car, // Changed from DirectionsCar to Car
  FileText, // Changed from Assignment to FileText
  Mail, // Changed from Email to Mail
  Phone,
  Link, // Changed from LinkIcon to Link
  Store // Default for unknown category
} from "lucide-react";

// Helper function and config for category icons (extracted from original VendorsTool)
const categoryConfig: Record<string, { Icon: React.ElementType; colorClass: string }> = {
    venue: { Icon: Home, colorClass: "text-primary" },
    catering: { Icon: Utensils, colorClass: "text-secondary" },
    photographer: { Icon: Camera, colorClass: "text-info" }, // info is not defined, will use blue
    photography: { Icon: Camera, colorClass: "text-blue-500" },
    videographer: { Icon: Video, colorClass: "text-destructive" },
    videography: { Icon: Video, colorClass: "text-destructive" },
    florist: { Icon: Flower, colorClass: "text-green-500" },
    flowers: { Icon: Flower, colorClass: "text-green-500" },
    dj: { Icon: Music, colorClass: "text-yellow-500" },
    band: { Icon: Music, colorClass: "text-yellow-500" },
    music: { Icon: Music, colorClass: "text-yellow-500" },
    cake: { Icon: Cake, colorClass: "text-primary-foreground" }, // will use a darker primary
    bakery: { Icon: Cake, colorClass: "text-primary-foreground" },
    officiant: { Icon: Heart, colorClass: "text-red-500" },
    hair: { Icon: Scissors, colorClass: "text-secondary-foreground" }, // will use a lighter secondary
    makeup: { Icon: Sparkles, colorClass: "text-secondary-foreground" },
    beauty: { Icon: Sparkles, colorClass: "text-secondary-foreground" },
    rentals: { Icon: Armchair, colorClass: "text-blue-500" },
    transportation: { Icon: Car, colorClass: "text-blue-600" },
    planner: { Icon: FileText, colorClass: "text-green-600" },
    coordinator: { Icon: FileText, colorClass: "text-green-600" },
    invitations: { Icon: Mail, colorClass: "text-purple-500" },
    stationery: { Icon: Mail, colorClass: "text-purple-500" },
  };
  
export function getCategoryConfig(category: string) {
    const key = (category || "").toLowerCase();
    for (const [k, v] of Object.entries(categoryConfig)) {
      if (key.includes(k)) return v;
    }
    return { Icon: Store, colorClass: "text-muted-foreground" };
}

export default function VendorCard({ vendor }: { vendor: Vendor }) {
  const config = getCategoryConfig(vendor.category);
  const IconComponent = config.Icon;

  const statusClass = () => {
    switch (vendor.status) {
      case "booked":
      case "confirmed":
        return "bg-green-100 text-green-700";
      case "paid":
        return "bg-green-200 text-green-800";
      case "contacted":
        return "bg-blue-100 text-blue-700";
      case "researching":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const statusLabel = () => {
    switch (vendor.status) {
      case "booked":
      case "confirmed":
        return "Booked";
      case "paid":
        return "Paid";
      case "contacted":
        return "Contacted";
      case "researching":
        return "Researching";
      default:
        return "Researching";
    }
  };

  return (
    <Card className="rounded-3xl shadow-soft h-full flex flex-col hover:shadow-medium hover:translate-y-[-2px] transition-all duration-300">
      <CardHeader className="flex flex-row items-center space-x-4 p-4 border-b border-border/70">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", config.colorClass === "text-primary" && "bg-primary/10", config.colorClass === "text-secondary" && "bg-secondary/10", config.colorClass === "text-blue-500" && "bg-blue-100", config.colorClass === "text-destructive" && "bg-destructive/10", config.colorClass === "text-green-500" && "bg-green-100", config.colorClass === "text-yellow-500" && "bg-yellow-100", config.colorClass === "text-primary-foreground" && "bg-primary/10", config.colorClass === "text-red-500" && "bg-red-100", config.colorClass === "text-secondary-foreground" && "bg-secondary/10", config.colorClass === "text-blue-600" && "bg-blue-100", config.colorClass === "text-green-600" && "bg-green-100", config.colorClass === "text-purple-500" && "bg-purple-100", config.colorClass === "text-muted-foreground" && "bg-muted/10")}>
          <IconComponent className={cn("h-6 w-6", config.colorClass)} />
        </div>
        <div className="flex-1">
          <CardTitle className="font-serif text-lg leading-tight mb-0.5">{vendor.name}</CardTitle>
          <p className="text-sm text-muted-foreground">{vendor.category}</p>
        </div>
        <span className={cn("px-3 py-1 rounded-full text-xs font-medium shrink-0", statusClass())}>
          {statusLabel()}
        </span>
      </CardHeader>
      <CardContent className="p-4 flex-1">
        {vendor.cost && (
          <div className="mb-3">
            <p className="text-sm text-muted-foreground">Total Cost</p>
            <p className="font-sans text-lg font-medium text-foreground">{formatCurrency(vendor.cost)}</p>
          </div>
        )}
        <div className="space-y-2 text-sm text-muted-foreground">
          {vendor.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{vendor.phone}</span>
            </div>
          )}
          {vendor.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" />
              <span>{vendor.email}</span>
            </div>
          )}
          {vendor.website && (
            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline text-primary">
              <Link className="h-4 w-4 shrink-0" />
              <span>{vendor.website}</span>
            </a>
          )}
        </div>
        {vendor.notes && (
            <div className="mt-4 text-xs text-muted-foreground line-clamp-2">
                {vendor.notes}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
