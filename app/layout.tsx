import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";
import ThemeProvider from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "TCG Pocket League",
  description: "Pokemon TCG Pocket League - Track your trading card game matches and tournaments",
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
          <Navigation />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

