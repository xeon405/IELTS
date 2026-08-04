import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import Script from "next/script";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ielts-examiner.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "AI IELTS Examiner — Adaptive IELTS Trainer & Personal AI Tutor",
    template: "%s | AI IELTS Examiner",
  },
  description:
    "AI IELTS Examiner is an adaptive IELTS practice platform powered by an AI Brain. It runs a diagnostic, generates original exam-style questions, evaluates your answers against official band descriptors, and personalizes your practice until you reach your target band.",
  keywords: [
    "IELTS practice",
    "IELTS band score",
    "IELTS online test",
    "AI IELTS examiner",
    "IELTS reading practice",
    "IELTS listening practice",
    "IELTS writing feedback",
    "IELTS speaking practice",
    "adaptive learning",
    "IELTS tutor",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "AI IELTS Examiner",
    title: "AI IELTS Examiner — Adaptive IELTS Trainer & Personal AI Tutor",
    description:
      "A professional AI examiner that remembers your weaknesses, generates original IELTS questions, and personalizes every practice session until you reach your target band.",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI IELTS Examiner — Adaptive IELTS Trainer & Personal AI Tutor",
    description:
      "A professional AI examiner that remembers your weaknesses, generates original IELTS questions, and personalizes every practice session.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.variable} ${fraunces.variable} ${spaceMono.variable} antialiased`}
      >
        {children}
        {/* WARNING FOR AGENT: DO NOT REMOVE THIS SCRIPT */}
        <Script src="https://cdn.jsdelivr.net/gh/IdeavoAI/ideavo-scripts@latest/scripts/ideavo.min.js" />
      </body>
    </html>
  );
}
