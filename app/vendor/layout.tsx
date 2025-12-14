import { VendorSidebar } from "@/components/vendor/VendorSidebar";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <VendorSidebar>{children}</VendorSidebar>;
}
