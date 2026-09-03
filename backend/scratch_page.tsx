import { Hero } from "@/components/home/Hero";
import { BookingWidget } from "@/components/home/BookingWidget";
import { AboutSection } from "@/components/home/AboutSection";
import { ReviewSection } from "@/components/home/ReviewSection";
import { getRooms, getSettings } from "@/lib/api";

export default async function Home() {
  const [rooms, settings] = await Promise.all([getRooms(), getSettings()]);

  return (
    <main>
      <Hero />
      <BookingWidget />
      <AboutSection rooms={rooms} settings={settings} />
      <ReviewSection />
    </main>
  );
}
