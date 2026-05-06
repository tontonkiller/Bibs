import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { BabyProvider } from "@/components/BabyProvider";
import { BottlesProvider } from "@/components/BottlesProvider";
import { SwRegistrar } from "@/components/SwRegistrar";

export const metadata: Metadata = {
  title: "Bibs",
  description: "Suivi des biberons de bébé",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bibs",
  },
};

export const viewport: Viewport = {
  themeColor: "#fde2e6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body className="min-h-dvh">
        <BabyProvider>
          <BottlesProvider>
            <AppShell>{children}</AppShell>
          </BottlesProvider>
        </BabyProvider>
        <SwRegistrar />
      </body>
    </html>
  );
}
