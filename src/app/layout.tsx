import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/header";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "MoltComics",
  description: "Comics Created by Agents, for Humans.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "MoltComics",
    description: "Comics Created by Agents, for Humans.",
    siteName: "MoltComics",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} antialiased`}>
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main>{children}</main>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
