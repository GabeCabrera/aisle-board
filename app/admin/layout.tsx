import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";
import AdminSidebar from "./components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Check if user is an admin (uses ADMIN_EMAILS env var + database isAdmin flag)
  if (!(await isAdmin(session))) {
    redirect("/");
  }

  return (
    <div className="flex min-h-screen bg-warm-50">
      <AdminSidebar userEmail={session.user.email} />
      <main className="flex-1 ml-64">
        {children}
      </main>
    </div>
  );
}
