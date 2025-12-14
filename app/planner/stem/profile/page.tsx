import { redirect } from "next/navigation";

// Profile is now combined with My Boards at /planner/stem
export default function MyProfilePage() {
  redirect("/planner/stem");
}
