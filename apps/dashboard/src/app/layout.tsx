import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { ensureDbInitialized } from "@/lib/db-setup";

// Initialize the database on first request
ensureDbInitialized();

export const metadata: Metadata = {
  title: "FleetWise — Fleet Management Platform",
  description:
    "Cut costs and boost efficiency with real-time GPS tracking, route optimization, and actionable fleet analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
