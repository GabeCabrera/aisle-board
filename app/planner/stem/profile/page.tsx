import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { getPublicProfile } from "@/lib/data/stem";
import { MyProfile } from "@/components/tools/stem/MyProfile";

export default async function MyProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  const profileData = await getPublicProfile(session.user.tenantId);

  if (!profileData) {
    redirect("/planner");
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <MyProfile profile={profileData as any} />
      </div>
    </div>
  );
}
