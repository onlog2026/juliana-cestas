import type { Metadata } from "next";
import { Figtree, Young_Serif } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/loja/site-header";
import { SiteFooter } from "@/components/loja/site-footer";
import { BottomNav } from "@/components/loja/bottom-nav";
import { LocalBusinessJsonLd } from "@/components/loja/json-ld";
import { getSeoSettings } from "@/modules/seo/service";
import { GoogleAnalytics } from "@/components/analytics/google-analytics";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

const youngSerif = Young_Serif({
  variable: "--font-young-serif",
  weight: "400",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://juliana-cestas-loja.vercel.app";

export async function generateMetadata(): Promise<Metadata> {
  const seo = await getSeoSettings();
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: seo.siteTitle,
      template: `%s | Juliana Cestas`,
    },
    description: seo.siteDescription,
    keywords: seo.keywords,
    openGraph: {
      title: seo.siteTitle,
      description: seo.siteDescription,
      siteName: "Juliana Cestas",
      locale: "pt_BR",
      type: "website",
      images: seo.ogImageUrl ? [{ url: seo.ogImageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.siteTitle,
      description: seo.siteDescription,
    },
    alternates: { canonical: "/" },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${figtree.variable} ${youngSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background text-foreground">
        <noscript>
          <style>{`.jc-reveal{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        <GoogleAnalytics />
        <LocalBusinessJsonLd />
        <SiteHeader />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <SiteFooter />
        <BottomNav />
      </body>
    </html>
  );
}
