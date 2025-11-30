import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { getTenantById, getPlannerByTenantId, getPagesByPlannerId } from "@/lib/db/queries";
import { PlannerEditor } from "./planner-editor";

export default async function PlannerPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const tenant = await getTenantById(session.user.tenantId);

  if (!tenant) {
    redirect("/login");
  }

  const planner = await getPlannerByTenantId(tenant.id);

  if (!planner) {
    redirect("/templates");
  }

  const pages = await getPagesByPlannerId(planner.id);

  if (pages.length === 0) {
    redirect("/templates");
  }

  return (
    <PlannerEditor
      plannerId={planner.id}
      initialPages={pages}
      displayName={tenant.displayName}
      userPlan={tenant.plan as "free" | "complete"}
    />
  );
}
