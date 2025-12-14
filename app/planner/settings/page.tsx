import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import SettingsTool from "@/components/tools/SettingsTool";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <SettingsTool />
      </div>
    </div>
  );
}
