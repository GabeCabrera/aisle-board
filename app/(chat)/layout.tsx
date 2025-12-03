import { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { AppShell } from "@/components/layout/AppShell";

export default async function ChatLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/sign-in");
  }
  
  return <AppShell>{children}</AppShell>;
}
