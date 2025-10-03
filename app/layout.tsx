import type React from "react";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import ThemeToggle from "@/components/theme-toggle";
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Separator } from "@/components/ui/separator";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: process.env.NEXT_PUBLIC_BRAND_NAME || "Link Gallery",
    template: `%s | ${process.env.NEXT_PUBLIC_BRAND_NAME || "Link Gallery"}`,
  },
  description:
    "A clean directory of curated links. Submit your site and explore approved listings.",
  applicationName: process.env.NEXT_PUBLIC_BRAND_NAME || "Link Gallery",
  openGraph: {
    title: process.env.NEXT_PUBLIC_BRAND_NAME || "Link Gallery",
    description:
      "A clean directory of curated links. Submit your site and explore approved listings.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    siteName: process.env.NEXT_PUBLIC_BRAND_NAME || "Link Gallery",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: process.env.NEXT_PUBLIC_BRAND_NAME || "Link Gallery",
    description:
      "A clean directory of curated links. Submit your site and explore approved listings.",
  },
  robots: {
    index: true,
    follow: true,
  },
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1220" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const brand = process.env.NEXT_PUBLIC_BRAND_NAME || "Link Gallery";
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var stored = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
  } catch (e) {}
})();`,
          }}
        />
      </head>
      <body className="h-screen w-screen bg-background text-foreground antialiased flex flex-col">
        <header className="sticky top-0 z-40 border-b border-border/50 bg-elevated/80 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-lg text-balance"
            >
              <Image
                src="/logo.png" // or your logo URL
                alt="Logo"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
              {brand}
            </Link>
            {/* Navbar */}
            <NavigationMenu
              aria-label="Main"
              className=" sm:flex"
              viewport={false}
            >
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link href="/" className="px-3 py-2 rounded-md text-sm">
                      Home
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink asChild>
                    <Link
                      href="/submit"
                      className="px-3 py-2 rounded-md text-sm"
                    >
                      Submit
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            {/* Theme toggle lives client-side */}
            {/* @ts-expect-error Server Component importing client child is OK */}
            <Suspense fallback={null}>
              <ThemeToggle />
            </Suspense>
          </div>
        </header>
        <div role="main" className="flex-1">
          {children}
          <Toaster richColors closeButton position="top-right" />
        </div>
        <footer className="border-t border-border/50 bg-elevated">
          <div className="mx-auto max-w-7xl px-4 py-4 text-sm text-muted-foreground flex items-center justify-between">
            <span>
              © {new Date().getFullYear()} {brand}. All rights reserved.
            </span>
            <nav className="flex items-center gap-4">
              <Link
                className="hover:text-foreground transition-colors"
                href="/"
              >
                Home
              </Link>
              <Link
                className="hover:text-foreground transition-colors"
                href="/admin/login"
              >
                Admin
              </Link>
            </nav>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
