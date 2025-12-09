import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPlannerData } from "@/lib/data/planner";
import BudgetTool from "@/components/tools/BudgetTool";

export default async function BudgetPage() {
  const session = await getServerSession(authOptions);
  
  const data = session?.user?.tenantId 
    ? await getPlannerData(session.user.tenantId, ["budget", "kernel", "summary"])
    : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <BudgetTool initialData={data} />
      </div>
    </div>
  );
}