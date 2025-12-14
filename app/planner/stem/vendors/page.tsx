import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  getVendorsWithSearch,
  getVendorCategories,
  getVendorStates,
  getSavedVendors,
  getWeddingLocation,
  getVendorsForLocation,
} from "@/lib/data/stem";
import { VendorFeed } from "@/components/tools/stem/VendorFeed";

export default async function VendorsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId;

  // Fetch wedding location if logged in
  const weddingLocation = tenantId ? await getWeddingLocation(tenantId) : null;

  const [vendors, categories, states, savedVendors, recommendedVendors] = await Promise.all([
    getVendorsWithSearch({ sortBy: "featured" }),
    getVendorCategories(),
    getVendorStates(),
    tenantId ? getSavedVendors(tenantId) : Promise.resolve([]),
    // Fetch recommended vendors based on location
    weddingLocation?.state
      ? getVendorsForLocation({ state: weddingLocation.state, city: weddingLocation.city, limit: 8 })
      : Promise.resolve([]),
  ]);

  const savedVendorIds = savedVendors.map((v) => v.id);

  return (
    <VendorFeed
      initialVendors={vendors}
      initialCategories={categories}
      initialStates={states}
      savedVendorIds={savedVendorIds}
      recommendedVendors={recommendedVendors}
      weddingLocation={weddingLocation}
    />
  );
}
