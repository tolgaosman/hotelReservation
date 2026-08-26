import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import { ScaleWrapper } from "@/components/layout/ScaleWrapper";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Otel Yönetim Paneli",
  description: "Rezervasyon ve konaklama yönetim sistemi",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="tr" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        <ScaleWrapper>
          <ToastProvider>{children}</ToastProvider>
        </ScaleWrapper>
      </body>
    </html>
  );
}
