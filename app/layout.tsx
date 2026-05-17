import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IBM Bob Lazarus Swarm",
  description: "Multi-agent backend audit dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
