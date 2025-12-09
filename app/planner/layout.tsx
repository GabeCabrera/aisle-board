import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { SidebarShell } from "@/components/layout/SidebarShell";

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  if (!session.user.onboardingComplete) {
    redirect("/welcome");
  }
  
  return <SidebarShell>{children}</SidebarShell>;
}
