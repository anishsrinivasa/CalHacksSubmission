import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SOW Analyzer - AI-Powered Contract Analysis",
  description: "Analyze government Statements of Work for waste, weak KPIs, and scope creep",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
