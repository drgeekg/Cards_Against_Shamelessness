import type { Metadata } from "next";
import "./globals.css";
import { ToastContainer } from "@/components/ui/Toast";
import { ThemeInitializer } from "@/components/ui/ThemeInitializer";

export const metadata: Metadata = {
  title: "Cards Against Shamelessness — The Party Card Game",
  description:
    "Cards Against Shamelessness (Decency & Sanskaar editions) — real-time multiplayer party card game. No account needed. Just a room code and your friends.",
  openGraph: {
    title: "Cards Against Shamelessness — The Party Card Game",
    description: "Play Cards Against Shamelessness with friends, no account needed.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-edition="decency" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeInitializer />
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
