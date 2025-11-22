import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LoadingOverlay } from "@/components/loading-overlay";
import { Toaster } from "@/components/ui/toaster";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Gemini File Search - RAG System",
  description:
    "Document storage, indexing, and AI-powered querying using Google's Gemini File Search API",
  keywords: ["Gemini", "File Search", "RAG", "AI", "Document Search"],
  authors: [{ name: "Your Name" }],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <Providers>
          <div className="relative flex min-h-screen flex-col">
            <AppHeader />
            <main className="flex-1">{children}</main>
          </div>
          <LoadingOverlay />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
