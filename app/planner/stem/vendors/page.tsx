import { redirect } from "next/navigation";

// Redirect to unified vendor page
export default function StemVendorsRedirect() {
  redirect("/planner/vendors");
}
