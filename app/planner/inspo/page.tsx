import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { getMyBoards } from "@/lib/data/inspo";
import MyBoardsTool from "@/components/tools/MyBoardsTool"; // Renamed from InspoTool

export default async function InspoPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const initialBoards = session.user.tenantId 
    ? await getMyBoards(session.user.tenantId)
    : [];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <MyBoardsTool initialBoards={initialBoards} />
      </div>
    </div>
  );
}