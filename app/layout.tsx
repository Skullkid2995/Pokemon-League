import type { Metadata } from "next";
import "./globals.css";
import NavigationWrapper from "@/components/NavigationWrapper";
import ThemeProvider from "@/components/ThemeProvider";
import { GameProvider } from "@/components/layout/GameSelectorDropdown";

export const metadata: Metadata = {
  title: "GG",
  description: "GG - Multi-game competitive platform. Track your matches and tournaments across multiple games",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <GameProvider>
            <NavigationWrapper />
            {children}
          </GameProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

