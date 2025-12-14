import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getVendorsWithSearch, getVendorCategories, getVendorStates, getSavedVendors } from "@/lib/data/stem";
import { VendorFeed } from "@/components/tools/stem/VendorFeed";

export default async function VendorsPage() {
  const session = await getServerSession(authOptions);
  const tenantId = session?.user?.tenantId;

  const [vendors, categories, states, savedVendors] = await Promise.all([
    getVendorsWithSearch({ sortBy: "featured" }),
    getVendorCategories(),
    getVendorStates(),
    tenantId ? getSavedVendors(tenantId) : Promise.resolve([]),
  ]);

  const savedVendorIds = savedVendors.map((v) => v.id);

  return (
    <VendorFeed
      initialVendors={vendors}
      initialCategories={categories}
      initialStates={states}
      savedVendorIds={savedVendorIds}
    />
  );
}
