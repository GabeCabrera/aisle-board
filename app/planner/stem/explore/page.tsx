import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/config";
import { getPublicBoards } from "@/lib/data/stem";
import { ExploreFeed } from "@/components/tools/stem/ExploreFeed";

export default async function ExplorePage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const publicBoards = await getPublicBoards();

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <ExploreFeed initialBoards={publicBoards} />
      </div>
    </div>
  );
}
