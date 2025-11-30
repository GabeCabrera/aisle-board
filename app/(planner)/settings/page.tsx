import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { getTenantById, getUserByEmail } from "@/lib/db/queries";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    redirect("/login");
  }

  const [user, tenant] = await Promise.all([
    getUserByEmail(session.user.email),
    getTenantById(session.user.tenantId),
  ]);

  if (!user || !tenant) {
    redirect("/login");
  }

  return (
    <SettingsClient
      user={{
        name: user.name,
        email: user.email,
      }}
      tenant={{
        displayName: tenant.displayName,
        weddingDate: tenant.weddingDate,
        plan: tenant.plan ?? "free",
      }}
    />
  );
}
