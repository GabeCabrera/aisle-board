import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Star, ArrowRight, ImageIcon, BadgeCheck, Sparkles } from "lucide-react";
import { getPublicVendors, getVendorCategories, getVendorStates, getVendorCount } from "@/lib/data/stem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Wedding Vendors Directory | Find Trusted Professionals | Scribe & Stem",
  description: "Discover trusted wedding vendors in your area. Browse photographers, florists, venues, caterers, DJs, planners, and more. Read reviews and find the perfect professionals for your special day.",
  keywords: [
    "wedding vendors",
    "wedding photographer",
    "wedding florist",
    "wedding venue",
    "wedding caterer",
    "wedding DJ",
    "wedding planner",
    "wedding vendors near me",
    "wedding professionals",
    "wedding vendor directory",
  ],
  openGraph: {
    type: "website",
    title: "Wedding Vendors Directory | Scribe & Stem",
    description: "Discover trusted wedding vendors in your area. Browse photographers, florists, venues, caterers, and more.",
    url: "https://scribeandstem.com/vendors",
    images: [
      {
        url: "/og-vendors.png",
        width: 1200,
        height: 630,
        alt: "Scribe & Stem Wedding Vendor Directory",
      },
    ],
  },
  alternates: {
    canonical: "https://scribeandstem.com/vendors",
  },
};

const CATEGORY_LABELS: Record<string, string> = {
  photographer: "Photographers",
  videographer: "Videographers",
  venue: "Venues",
  caterer: "Caterers",
  florist: "Florists",
  dj: "DJs",
  musician: "Musicians",
  "wedding-planner": "Planners",
  "hair-makeup": "Hair & Makeup",
  officiant: "Officiants",
  rentals: "Rentals",
  bakery: "Bakeries",
  stationery: "Stationery",
  transportation: "Transportation",
};

const PRICE_LABELS: Record<string, string> = {
  "$": "$",
  "$$": "$$",
  "$$$": "$$$",
  "$$$$": "$$$$",
};

interface PageProps {
  searchParams: Promise<{
    category?: string;
    state?: string;
    page?: string;
  }>;
}

export default async function VendorsDirectoryPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const category = params.category;
  const state = params.state;
  const page = parseInt(params.page || "1", 10);
  const limit = 24;
  const offset = (page - 1) * limit;

  const [vendors, categories, states, totalCount] = await Promise.all([
    getPublicVendors({ category, state, limit, offset, sortBy: "featured" }),
    getVendorCategories(),
    getVendorStates(),
    getVendorCount(),
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  // ItemList structured data for vendor directory
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Wedding Vendors Directory",
    description: "Browse trusted wedding vendors and professionals",
    numberOfItems: vendors.length,
    itemListElement: vendors.map((vendor, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "LocalBusiness",
        name: vendor.name,
        url: `https://scribeandstem.com/vendors/${vendor.slug}`,
        image: vendor.profileImage || vendor.coverImage,
        address: vendor.city && vendor.state ? {
          "@type": "PostalAddress",
          addressLocality: vendor.city,
          addressRegion: vendor.state,
        } : undefined,
        priceRange: vendor.priceRange,
        aggregateRating: vendor.averageRating && vendor.reviewCount ? {
          "@type": "AggregateRating",
          ratingValue: (vendor.averageRating / 10).toFixed(1),
          reviewCount: vendor.reviewCount,
        } : undefined,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/50">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <Link href="/" className="font-serif text-2xl font-medium tracking-tight">
              Scribe & Stem
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/blog"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors hidden sm:block"
              >
                Blog
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-6">
            {/* Header */}
            <div className="border-b border-border/50 pb-8 mb-8">
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-foreground tracking-tight mb-4">
                Wedding Vendors
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Discover trusted wedding professionals in your area. Browse {totalCount.toLocaleString()} vendors across {categories.length} categories.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 mb-8">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <Link href="/vendors">
                  <Badge
                    variant={!category ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/90"
                  >
                    All Categories
                  </Badge>
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat}
                    href={`/vendors?category=${cat}${state ? `&state=${state}` : ""}`}
                  >
                    <Badge
                      variant={category === cat ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/90"
                    >
                      {CATEGORY_LABELS[cat] || cat}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>

            {/* State Filter */}
            {states.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="text-sm text-muted-foreground mr-2 self-center">
                  Location:
                </span>
                <Link href={`/vendors${category ? `?category=${category}` : ""}`}>
                  <Badge
                    variant={!state ? "secondary" : "outline"}
                    className="cursor-pointer"
                  >
                    All States
                  </Badge>
                </Link>
                {states.slice(0, 10).map((s) => (
                  <Link
                    key={s}
                    href={`/vendors?${category ? `category=${category}&` : ""}state=${s}`}
                  >
                    <Badge
                      variant={state === s ? "secondary" : "outline"}
                      className="cursor-pointer"
                    >
                      {s}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}

            {/* Vendor Grid */}
            {vendors.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border-2 border-dashed border-border/50 rounded-3xl">
                <p className="text-lg font-medium text-foreground">No vendors found</p>
                <p className="text-sm mt-2">
                  Try adjusting your filters or{" "}
                  <Link href="/vendors" className="text-primary underline">
                    view all vendors
                  </Link>
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {vendors.map((vendor) => (
                  <Link
                    key={vendor.id}
                    href={`/vendors/${vendor.slug}`}
                    className="group"
                  >
                    <div className="rounded-3xl overflow-hidden bg-card border border-border/50 shadow-soft transition-all duration-300 hover:translate-y-[-4px] hover:shadow-lifted h-full">
                      {/* Image */}
                      <div className="relative h-48 bg-muted">
                        {vendor.coverImage || vendor.profileImage ? (
                          <Image
                            src={vendor.coverImage || vendor.profileImage || ""}
                            alt={vendor.name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                            unoptimized
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                            <ImageIcon className="h-12 w-12 text-primary/30" />
                          </div>
                        )}

                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-70 group-hover:opacity-50 transition-opacity" />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {vendor.isVerified && (
                            <Badge className="bg-white/90 text-primary backdrop-blur-sm gap-1">
                              <BadgeCheck className="h-3 w-3" />
                              Verified
                            </Badge>
                          )}
                          {vendor.isFeatured && (
                            <Badge className="bg-amber-500/90 text-white backdrop-blur-sm gap-1">
                              <Sparkles className="h-3 w-3" />
                              Featured
                            </Badge>
                          )}
                        </div>

                        {/* Category */}
                        <div className="absolute bottom-3 left-3">
                          <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground">
                            {CATEGORY_LABELS[vendor.category] || vendor.category}
                          </Badge>
                        </div>

                        {/* Price */}
                        {vendor.priceRange && (
                          <div className="absolute bottom-3 right-3">
                            <Badge variant="outline" className="bg-white/90 backdrop-blur-sm border-0 font-semibold">
                              {PRICE_LABELS[vendor.priceRange] || vendor.priceRange}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h2 className="font-serif text-xl leading-tight mb-1 text-foreground group-hover:text-primary transition-colors">
                          {vendor.name}
                        </h2>

                        {(vendor.city || vendor.state) && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                            <MapPin className="h-3.5 w-3.5" />
                            <span>
                              {[vendor.city, vendor.state].filter(Boolean).join(", ")}
                            </span>
                          </div>
                        )}

                        {/* Rating */}
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center gap-1.5">
                            {vendor.averageRating && vendor.averageRating > 0 ? (
                              <>
                                <div className="flex items-center gap-0.5">
                                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                  <span className="font-medium text-sm">
                                    {(vendor.averageRating / 10).toFixed(1)}
                                  </span>
                                </div>
                                <span className="text-muted-foreground text-sm">
                                  ({vendor.reviewCount} {vendor.reviewCount === 1 ? "review" : "reviews"})
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground text-sm">No reviews yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {page > 1 && (
                  <Link
                    href={`/vendors?${category ? `category=${category}&` : ""}${state ? `state=${state}&` : ""}page=${page - 1}`}
                  >
                    <Button variant="outline">Previous</Button>
                  </Link>
                )}
                <span className="flex items-center px-4 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={`/vendors?${category ? `category=${category}&` : ""}${state ? `state=${state}&` : ""}page=${page + 1}`}
                  >
                    <Button variant="outline">Next</Button>
                  </Link>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="mt-16 text-center bg-primary/5 rounded-3xl p-8 md:p-12">
              <h2 className="font-serif text-3xl md:text-4xl mb-4">
                Planning your wedding?
              </h2>
              <p className="text-muted-foreground text-lg mb-6 max-w-xl mx-auto">
                Sign up for Scribe & Stem to save your favorite vendors, get personalized recommendations, and plan your perfect wedding with AI.
              </p>
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Get Started Free
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-border py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <Link href="/" className="font-serif text-xl font-medium tracking-tight">
              Scribe & Stem
            </Link>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Scribe & Stem
            </p>
          </div>
        </footer>
      </div>
    </>
  );
}
