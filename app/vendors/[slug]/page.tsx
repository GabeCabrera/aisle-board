import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  BadgeCheck,
  Sparkles,
  ImageIcon,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { getPublicVendorBySlug, getAllVendorSlugs } from "@/lib/data/stem";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const CATEGORY_LABELS: Record<string, string> = {
  photographer: "Photographer",
  videographer: "Videographer",
  venue: "Venue",
  caterer: "Caterer",
  florist: "Florist",
  dj: "DJ",
  musician: "Musician",
  "wedding-planner": "Wedding Planner",
  "hair-makeup": "Hair & Makeup",
  officiant: "Officiant",
  rentals: "Rentals",
  bakery: "Bakery",
  stationery: "Stationery",
  transportation: "Transportation",
};

const PRICE_LABELS: Record<string, string> = {
  "$": "Budget-Friendly",
  "$$": "Moderate",
  "$$$": "Premium",
  "$$$$": "Luxury",
};

interface VendorPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllVendorSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: VendorPageProps): Promise<Metadata> {
  const { slug } = await params;
  const vendor = await getPublicVendorBySlug(slug);

  if (!vendor) {
    return {
      title: "Vendor Not Found | Scribe & Stem",
    };
  }

  const categoryLabel = CATEGORY_LABELS[vendor.category] || vendor.category;
  const location = [vendor.city, vendor.state].filter(Boolean).join(", ");
  const title = `${vendor.name} | ${categoryLabel}${location ? ` in ${location}` : ""} | Scribe & Stem`;
  const description = vendor.description || `${vendor.name} is a ${categoryLabel.toLowerCase()}${location ? ` based in ${location}` : ""}. View their profile, portfolio, and reviews on Scribe & Stem.`;

  return {
    title,
    description,
    keywords: [
      vendor.name,
      categoryLabel,
      `wedding ${categoryLabel.toLowerCase()}`,
      location,
      `${categoryLabel.toLowerCase()} ${location}`,
      "wedding vendor",
    ].filter(Boolean),
    openGraph: {
      type: "profile",
      title: `${vendor.name} | ${categoryLabel}`,
      description,
      url: `https://scribeandstem.com/vendors/${vendor.slug}`,
      images: vendor.coverImage || vendor.profileImage
        ? [
            {
              url: vendor.coverImage || vendor.profileImage || "",
              width: 1200,
              height: 630,
              alt: vendor.name,
            },
          ]
        : undefined,
    },
    alternates: {
      canonical: `https://scribeandstem.com/vendors/${vendor.slug}`,
    },
  };
}

export default async function VendorProfilePage({ params }: VendorPageProps) {
  const { slug } = await params;
  const vendor = await getPublicVendorBySlug(slug);

  if (!vendor) {
    notFound();
  }

  const categoryLabel = CATEGORY_LABELS[vendor.category] || vendor.category;
  const priceLabel = vendor.priceRange ? PRICE_LABELS[vendor.priceRange] : null;
  const location = [vendor.city, vendor.state].filter(Boolean).join(", ");
  const portfolioImages = (vendor.portfolioImages as string[]) || [];

  // LocalBusiness structured data
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `https://scribeandstem.com/vendors/${vendor.slug}`,
    name: vendor.name,
    description: vendor.description || `${vendor.name} is a wedding ${categoryLabel.toLowerCase()}.`,
    image: vendor.coverImage || vendor.profileImage || undefined,
    url: vendor.website || `https://scribeandstem.com/vendors/${vendor.slug}`,
    telephone: vendor.phone || undefined,
    email: vendor.email || undefined,
    address: vendor.city || vendor.state ? {
      "@type": "PostalAddress",
      addressLocality: vendor.city || undefined,
      addressRegion: vendor.state || undefined,
      addressCountry: "US",
    } : undefined,
    priceRange: vendor.priceRange || undefined,
    aggregateRating: vendor.averageRating && vendor.reviewCount ? {
      "@type": "AggregateRating",
      ratingValue: (vendor.averageRating / 10).toFixed(1),
      bestRating: "5",
      worstRating: "1",
      reviewCount: vendor.reviewCount,
    } : undefined,
    review: vendor.reviews?.length ? vendor.reviews.map((review) => ({
      "@type": "Review",
      author: {
        "@type": "Person",
        name: review.tenant?.displayName || "Anonymous",
      },
      datePublished: review.createdAt?.toISOString().split("T")[0],
      reviewRating: {
        "@type": "Rating",
        ratingValue: review.rating,
        bestRating: "5",
        worstRating: "1",
      },
      reviewBody: review.content || undefined,
    })) : undefined,
    sameAs: vendor.instagram ? [`https://instagram.com/${vendor.instagram.replace("@", "")}`] : undefined,
  };

  // BreadcrumbList structured data
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://scribeandstem.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Vendors",
        item: "https://scribeandstem.com/vendors",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: vendor.name,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
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
                href="/vendors"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                All Vendors
              </Link>
              <Link href="/register">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </header>

        <main className="pt-24 pb-16">
          <div className="max-w-5xl mx-auto px-6">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-muted-foreground">
              <Link href="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link href="/vendors" className="hover:text-foreground transition-colors">
                Vendors
              </Link>
              <span className="mx-2">/</span>
              <span className="text-foreground">{vendor.name}</span>
            </nav>

            {/* Cover Image */}
            <div className="relative h-64 md:h-96 rounded-3xl overflow-hidden mb-8">
              {vendor.coverImage ? (
                <Image
                  src={vendor.coverImage}
                  alt={vendor.name}
                  fill
                  className="object-cover"
                  priority
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                  <ImageIcon className="h-16 w-16 text-primary/30" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex gap-2">
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
            </div>

            {/* Profile Header */}
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {/* Profile Image */}
              {vendor.profileImage && (
                <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-2xl overflow-hidden flex-shrink-0 border-4 border-background shadow-lg -mt-16 md:-mt-20 ml-4 bg-background">
                  <Image
                    src={vendor.profileImage}
                    alt={vendor.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <Badge variant="secondary">{categoryLabel}</Badge>
                  {priceLabel && (
                    <Badge variant="outline">{priceLabel}</Badge>
                  )}
                </div>

                <h1 className="font-serif text-3xl md:text-4xl tracking-tight mb-2">
                  {vendor.name}
                </h1>

                {location && (
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>{location}</span>
                  </div>
                )}

                {/* Rating */}
                {vendor.averageRating && vendor.averageRating > 0 ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < Math.round(vendor.averageRating! / 10)
                              ? "fill-amber-400 text-amber-400"
                              : "text-muted-foreground/30"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">
                      {(vendor.averageRating / 10).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">
                      ({vendor.reviewCount} {vendor.reviewCount === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">No reviews yet</span>
                )}
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <h2 className="font-serif text-xl">About</h2>
                {vendor.description ? (
                  <p className="text-muted-foreground leading-relaxed">
                    {vendor.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">
                    No description available.
                  </p>
                )}

                {vendor.bio && (
                  <p className="text-muted-foreground leading-relaxed">
                    {vendor.bio}
                  </p>
                )}
              </div>

              <div className="space-y-4">
                <h2 className="font-serif text-xl">Contact</h2>
                <div className="space-y-3">
                  {vendor.phone && (
                    <a
                      href={`tel:${vendor.phone}`}
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Phone className="h-4 w-4" />
                      <span>{vendor.phone}</span>
                    </a>
                  )}
                  {vendor.email && (
                    <a
                      href={`mailto:${vendor.email}`}
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Mail className="h-4 w-4" />
                      <span>{vendor.email}</span>
                    </a>
                  )}
                  {vendor.website && (
                    <a
                      href={vendor.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Globe className="h-4 w-4" />
                      <span>Visit Website</span>
                    </a>
                  )}
                  {vendor.instagram && (
                    <a
                      href={`https://instagram.com/${vendor.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Instagram className="h-4 w-4" />
                      <span>{vendor.instagram}</span>
                    </a>
                  )}

                  {!vendor.phone && !vendor.email && !vendor.website && !vendor.instagram && (
                    <p className="text-muted-foreground italic">
                      Contact information not available.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Portfolio */}
            {portfolioImages.length > 0 && (
              <div className="mb-8">
                <h2 className="font-serif text-xl mb-4">Portfolio</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {portfolioImages.slice(0, 8).map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl overflow-hidden"
                    >
                      <Image
                        src={image}
                        alt={`${vendor.name} portfolio ${index + 1}`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {vendor.reviews && vendor.reviews.length > 0 && (
              <div className="mb-8">
                <h2 className="font-serif text-xl mb-4">Reviews</h2>
                <div className="space-y-4">
                  {vendor.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-muted/30 rounded-2xl p-6"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-medium text-sm">
                              {(review.tenant?.displayName || "A")
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {review.tenant?.displayName || "Anonymous"}
                            </p>
                            {review.createdAt && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(review.createdAt).toLocaleDateString("en-US", {
                                  month: "long",
                                  year: "numeric",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < review.rating
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.title && (
                        <p className="font-medium mb-2">{review.title}</p>
                      )}
                      {review.content && (
                        <p className="text-muted-foreground">{review.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            <div className="bg-primary/5 rounded-3xl p-8 md:p-12 text-center">
              <h2 className="font-serif text-2xl md:text-3xl mb-4">
                Interested in {vendor.name}?
              </h2>
              <p className="text-muted-foreground text-lg mb-6 max-w-xl mx-auto">
                Sign up for Scribe & Stem to save this vendor, request quotes, and manage all your wedding vendors in one place.
              </p>
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Sign Up to Save
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
              <Link href="/vendors" className="hover:text-foreground transition-colors">
                Vendors
              </Link>
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
