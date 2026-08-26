import { Topbar } from "@/components/layout/Topbar";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { AppearanceSection } from "@/components/settings/AppearanceSection";

export default function SettingsPage() {
  return (
    <>
      <Topbar title="Ayarlar" subtitle="Otel profilinizi ve tercihlerinizi yönetin" />

      <main className="flex-1 space-y-6 p-6 lg:p-8">
        <ProfileSection />
        <AppearanceSection />
      </main>
    </>
  );
}
