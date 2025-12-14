import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { getActivityFeed } from "@/lib/data/stem";
import { ActivityFeed } from "@/components/tools/stem/ActivityFeed";

export default async function ActivityPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const { activities } = await getActivityFeed(session.user.tenantId, { limit: 30 });

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <ActivityFeed
          initialActivities={activities}
          currentTenantId={session.user.tenantId}
        />
      </div>
    </div>
  );
}
