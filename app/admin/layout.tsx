import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { getUserByEmail } from "@/lib/db/queries";
import AdminSidebar from "./components/AdminSidebar";

// Admin emails that have access to the admin panel
const ADMIN_EMAILS = [
  "gabecabr@gmail.com",
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/login");
  }

  // Check if user is an admin
  const user = await getUserByEmail(session.user.email);
  
  if (!user?.isAdmin && !ADMIN_EMAILS.includes(session.user.email)) {
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
