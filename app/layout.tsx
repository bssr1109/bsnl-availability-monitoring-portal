import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BSNL Availability Monitoring & Improvement Portal",
  description: "Daily BTS outage monitoring, remarks, improvement proposals, and availability analytics."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
