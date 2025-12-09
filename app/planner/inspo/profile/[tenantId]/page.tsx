import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { getPublicProfile } from "@/lib/data/inspo";
import { UserProfile } from "@/components/tools/inspo-tool/UserProfile";

interface PageProps {
  params: {
    tenantId: string;
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const profileData = await getPublicProfile(params.tenantId);

  if (!profileData) {
    notFound();
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <UserProfile profile={profileData} />
      </div>
    </div>
  );
}
