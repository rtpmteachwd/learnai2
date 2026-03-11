import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LearnAI - AI-Powered Inclusive Learning",
  description: "An AI-powered Learning Management System designed for SPED students of Dumaguete City National High School. Supporting visual, hearing, and speech impairments with cutting-edge assistive technology.",
  keywords: ["LearnAI", "SPED", "Inclusive Education", "DepEd", "SDG 4", "AI Learning", "Assistive Technology"],
  authors: [{ name: "LearnAI Team" }],
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: "/logo.svg",
  },
  openGraph: {
    title: "LearnAI - Inclusive Learning Platform",
    description: "AI-powered Learning Management System for Special Education",
    type: "website",
    images: ["/logo.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
