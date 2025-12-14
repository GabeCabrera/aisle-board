import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { getFollowersList } from "@/lib/data/stem";
import { FollowersList } from "@/components/tools/stem/FollowersList";

export default async function FollowersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const followers = await getFollowersList(session.user.tenantId, session.user.tenantId);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <FollowersList
          users={followers}
          type="followers"
          currentTenantId={session.user.tenantId}
        />
      </div>
    </div>
  );
}
