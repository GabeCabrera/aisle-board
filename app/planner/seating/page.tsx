import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPlannerData } from "@/lib/data/planner";
import SeatingTool from "@/components/tools/SeatingTool";

export default async function SeatingPage() {
  const session = await getServerSession(authOptions);
  
  const data = session?.user?.tenantId 
    ? await getPlannerData(session.user.tenantId, ["seating", "guests", "kernel"])
    : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <SeatingTool initialData={data ?? undefined} />
      </div>
    </div>
  );
}