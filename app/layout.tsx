import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Makeup Artist Web App",
  description: "Luxury quotation and booking assistant for makeup artists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen pb-24">{children}</div>
        <BottomNav />
      </body>
    </html>
  );
}