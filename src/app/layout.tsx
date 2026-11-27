import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Nav, TabBar } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lift Log",
  description: "Log your workouts, exercises, sets and reps.",
  applicationName: "Lift Log",
  // Lets "Add to Home Screen" open full screen like an app on iPhone.
  appleWebApp: { capable: true, title: "Lift Log", statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
  // Draw under the notch and home indicator; the header and tab bar pad themselves with safe-area insets.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">
        <Nav />
        <main className="mx-auto w-full max-w-xl px-safe pt-4 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1.5rem)] sm:pb-24">
          {children}
        </main>
        <TabBar />
      </body>
    </html>
  );
}
