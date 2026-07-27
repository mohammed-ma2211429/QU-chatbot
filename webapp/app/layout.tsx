import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "QU Schedule Planning Assistant",
  description: "Build a realistic, prerequisite-aware next-term schedule for Qatar University.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
