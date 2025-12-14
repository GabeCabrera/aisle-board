import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { getBoard } from "@/lib/data/stem";
import { BoardDetail } from "@/components/tools/stem/BoardDetail";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function BoardPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const boardData = await getBoard(params.id);

  if (!boardData) {
    notFound();
  }

  // Privacy Check
  const isOwner = session.user.tenantId === boardData.tenantId;
  if (!boardData.isPublic && !isOwner) {
    // If private and not owner, redirect or 404
    // We'll redirect to explore to keep it friendly
    redirect("/planner/stem/explore");
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <BoardDetail 
          board={boardData} 
          ideas={boardData.ideas} 
          isOwner={isOwner} 
        />
      </div>
    </div>
  );
}
