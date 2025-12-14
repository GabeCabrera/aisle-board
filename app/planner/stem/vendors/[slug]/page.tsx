import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getVendorBySlugWithStatus, getVendorReviews, getVendorQuestions } from "@/lib/data/stem";
import { VendorProfile } from "@/components/tools/stem/VendorProfile";

interface VendorPageProps {
  params: Promise<{ slug: string }>;
}

export default async function VendorPage({ params }: VendorPageProps) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId;

  const vendor = await getVendorBySlugWithStatus(slug, tenantId);

  if (!vendor) {
    notFound();
  }

  // Fetch reviews and questions in parallel
  const [reviews, questions] = await Promise.all([
    getVendorReviews(vendor.id, { sortBy: "newest" }),
    getVendorQuestions(vendor.id, { sortBy: "newest" }),
  ]);

  // Check if current user is the vendor owner
  const isVendorOwner = !!(tenantId && vendor.claimedByTenantId === tenantId);

  return (
    <VendorProfile
      vendor={vendor}
      reviews={reviews}
      questions={questions}
      isVendorOwner={isVendorOwner}
    />
  );
}
