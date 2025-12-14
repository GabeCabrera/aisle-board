import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { getMyBoards, getPublicProfile } from "@/lib/data/stem";
import { ProfileWithBoards } from "@/components/tools/stem/ProfileWithBoards";

export default async function StemPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const tenantId = session.user.tenantId;

  // Fetch both profile and boards data
  const [profileData, initialBoards] = await Promise.all([
    getPublicProfile(tenantId),
    getMyBoards(tenantId),
  ]);

  if (!profileData) {
    redirect("/planner");
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <ProfileWithBoards profile={profileData as any} initialBoards={initialBoards} />
      </div>
    </div>
  );
}