import type { Metadata } from "next";
import { Literata } from "next/font/google";
import "./globals.css";
import ThemeToggle from "./components/ThemeToggle";

// Configure Literata font
const literata = Literata({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-literata",
});

export const metadata: Metadata = {
  title: "Writefully - AI Story Generation",
  description: "Craft beautiful stories with AI assistance",
  keywords: ["AI writing", "story generation", "creative writing", "AI stories"],
  authors: [{ name: "Writefully Team" }],
  openGraph: {
    title: "Writefully - AI Story Generation",
    description: "Craft beautiful stories with AI assistance",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={literata.variable}>
      <body className="font-serif antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-[var(--background)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--background)]/80 border-b border-[var(--border)]">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              {/* Logo/Title */}
              <div className="flex items-center space-x-2">
                <span className="text-2xl">✍️</span>
                <h1 className="text-2xl font-serif font-bold text-[var(--foreground)]">
                  Writefully
                </h1>
              </div>
              
              {/* Right side items */}
              <div className="flex items-center space-x-4">
                <p className="text-sm text-[var(--muted)] hidden sm:block font-serif italic">
                  AI-powered story generation
                </p>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 min-h-[calc(100vh-8rem)]">
          {children}
        </main>

        {/* Footer */}
        <footer className="mt-auto border-t border-[var(--border)] bg-[var(--card)]/50">
          {/* <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
              <p className="text-sm text-[var(--muted)] font-serif">
                © 2025 Writefully. Crafting stories with care.
              </p>
              <div className="flex space-x-6 text-sm text-[var(--muted)]">
                <a href="#" className="hover:text-[var(--foreground)] transition-colors duration-200">
                  About
                </a>
                <a href="#" className="hover:text-[var(--foreground)] transition-colors duration-200">
                  Privacy
                </a>
                <a href="#" className="hover:text-[var(--foreground)] transition-colors duration-200">
                  Contact
                </a>
              </div>
            </div>
          </div> */}
        </footer>
      </body>
    </html>
  );
}