import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import "./globals.css";

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "(HOME)WISE NETWORK — Smart Home Services Since 2016",
  description:
    "HomeWise Network turns your residence into an intelligent sanctuary — security, energy, automation, concierge and analytics, all controlled from one calm interface.",
};

export const viewport: Viewport = {
  themeColor: "#120f13",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${interTight.variable} antialiased`}>
      <body>{children}</body>
    </html>
  );
}
