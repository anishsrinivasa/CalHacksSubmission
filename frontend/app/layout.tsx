import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
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
      <body className={`${GeistSans.className} antialiased min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
