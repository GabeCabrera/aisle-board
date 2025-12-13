import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPlannerData } from "@/lib/data/planner";
import ChecklistTool from "@/components/tools/ChecklistTool";

export default async function ChecklistPage() {
  const session = await getServerSession(authOptions);
  
  const data = session?.user?.tenantId 
    ? await getPlannerData(session.user.tenantId, ["decisions"])
    : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <ChecklistTool initialData={data ?? undefined} />
      </div>
    </div>
  );
}