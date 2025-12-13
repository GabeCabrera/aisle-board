import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPlannerData } from "@/lib/data/planner";
import DashboardTool from "@/components/tools/DashboardTool";

export default async function PlannerPage() {
  const session = await getServerSession(authOptions);
  
  // Note: Layout already handles redirect if no session/onboarding
  const data = session?.user?.tenantId
    ? await getPlannerData(session.user.tenantId, [
        "summary", "budget", "guests", "vendors", "decisions", "kernel"
      ])
    : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <DashboardTool initialData={data ?? undefined} />
      </div>
    </div>
  );
}