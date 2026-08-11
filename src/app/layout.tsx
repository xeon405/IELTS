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

export const metadata: Metadata = {
  title: "AI Duolingo Examiner",
  description: "Adaptive Duolingo English Test examiner powered by an AI Brain.",
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
