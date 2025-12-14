import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { EditProfile } from "@/components/tools/stem/EditProfile";

export default async function EditProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    redirect("/login");
  }

  // Get full tenant profile data
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, session.user.tenantId),
    columns: {
      id: true,
      displayName: true,
      weddingDate: true,
      slug: true,
      bio: true,
      socialLinks: true,
      profileImage: true,
      messagingEnabled: true,
      profileVisibility: true,
    },
  });

  if (!tenant) {
    redirect("/planner");
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <EditProfile
          profile={{
            ...tenant,
            socialLinks: (tenant.socialLinks as {
              instagram?: string;
              website?: string;
              tiktok?: string;
            }) || {},
          }}
        />
      </div>
    </div>
  );
}
