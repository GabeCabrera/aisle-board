import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPlannerData } from "@/lib/data/planner";
import {
  getVendorsWithSearch,
  getVendorCategories,
  getVendorStates,
  getSavedVendors,
  getWeddingLocation,
  getVendorsForLocation,
} from "@/lib/data/stem";
import { UnifiedVendorPage } from "@/components/tools/UnifiedVendorPage";

export default async function VendorsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId;

  // Fetch wedding location if logged in
  const weddingLocation = tenantId ? await getWeddingLocation(tenantId) : null;

  // Fetch all data in parallel
  const [
    plannerData,
    vendors,
    categories,
    states,
    savedVendors,
    recommendedVendors,
  ] = await Promise.all([
    // My vendors data
    tenantId ? getPlannerData(tenantId, ["vendors", "kernel"]) : Promise.resolve(null),
    // Directory data
    getVendorsWithSearch({ sortBy: "featured" }),
    getVendorCategories(),
    getVendorStates(),
    tenantId ? getSavedVendors(tenantId) : Promise.resolve([]),
    // Recommended vendors based on location
    weddingLocation?.state
      ? getVendorsForLocation({ state: weddingLocation.state, city: weddingLocation.city, limit: 8 })
      : Promise.resolve([]),
  ]);

  const savedVendorIds = savedVendors.map((v) => v.id);

  return (
    <UnifiedVendorPage
      // My vendors props
      plannerData={plannerData ?? undefined}
      // Directory props
      initialVendors={vendors}
      initialCategories={categories}
      initialStates={states}
      savedVendorIds={savedVendorIds}
      savedVendors={savedVendors}
      recommendedVendors={recommendedVendors}
      weddingLocation={weddingLocation}
    />
  );
}
