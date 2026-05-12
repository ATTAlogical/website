import { prisma } from "@/lib/db";
import SettingsManager from "./SettingsManager";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const row = await prisma.siteSettings.findUnique({ where: { id: 1 } });
  return (
    <SettingsManager
      initial={{
        spotifyProfile: row?.spotifyProfile ?? "",
      }}
    />
  );
}
