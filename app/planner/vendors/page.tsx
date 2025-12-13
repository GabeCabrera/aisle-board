import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPlannerData } from "@/lib/data/planner";
import VendorsTool from "@/components/tools/VendorsTool";

export default async function VendorsPage() {
  const session = await getServerSession(authOptions);
  
  const data = session?.user?.tenantId 
    ? await getPlannerData(session.user.tenantId, ["vendors", "kernel"])
    : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <VendorsTool initialData={data ?? undefined} />
      </div>
    </div>
  );
}