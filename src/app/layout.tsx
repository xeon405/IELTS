import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import Script from "next/script";
import { AppErrorBoundary } from "@/components/error-boundary";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Mkg.IELTS.COM",
  description: "Adaptive IELTS examiner and personal tutor powered by an AI Brain.",
};

// The Ideavo developer-analytics script is an intrusive third-party script
// with full page privileges (it runs in every page and can read localStorage,
// where the auth token lives). It is shipped by the scaffolding tooling only
// for preview/analytics; production must NOT load it. Enable via
// NEXT_PUBLIC_IDEAVO=1 in a DEV environment only.
const IDEAVO_ENABLED =
  process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_IDEAVO === "1";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t;try{t=JSON.parse(window.localStorage.getItem("ai-ielts-examiner-settings")||"{}").theme}catch(e){}if(["light","warm","dark","ocean","graphite","royal","mint"].indexOf(t)<0)t="light";document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body
        className={`${plusJakarta.variable} ${fraunces.variable} ${spaceMono.variable} antialiased`}
      >
        <AppErrorBoundary>{children}</AppErrorBoundary>
        {IDEAVO_ENABLED ? (
          <Script src="https://cdn.jsdelivr.net/gh/IdeavoAI/ideavo-scripts@1.0.4/scripts/ideavo.min.js" strategy="afterInteractive" />
        ) : null}
      </body>
    </html>
  );
}
