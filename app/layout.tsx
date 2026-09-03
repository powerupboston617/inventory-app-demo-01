import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
import { Header } from "@/components/Header";
import { getCurrentUser } from "@/lib/guards";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Power Up Boston Inventory",
    template: "%s · PUB Inventory",
  },
  description:
    "Visual inventory for Power Up Boston — shop, van, and jobsite.",
  applicationName: "Power Up Boston Inventory",
};

export const viewport: Viewport = {
  themeColor: "#03005D",
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAuthPage = pathname.startsWith("/login");
  const user = isAuthPage ? null : await getCurrentUser();
  if (!isAuthPage && !user) {
    redirect("/login");
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-page font-sans text-navy">
        {isAuthPage || !user ? (
          children
        ) : (
          <>
            <Header user={{ name: user.name, role: user.role }} />
            <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-4 md:px-6 md:pb-10 md:pt-6">
              {children}
            </main>
            <BottomNav />
          </>
        )}
      </body>
    </html>
  );
}
