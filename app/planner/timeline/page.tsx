import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPlannerData } from "@/lib/data/planner";
import TimelineTool from "@/components/tools/TimelineTool";

export default async function TimelinePage() {
  const session = await getServerSession(authOptions);
  
  const data = session?.user?.tenantId 
    ? await getPlannerData(session.user.tenantId, ["timeline", "kernel", "summary"])
    : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <TimelineTool initialData={data} />
      </div>
    </div>
  );
}