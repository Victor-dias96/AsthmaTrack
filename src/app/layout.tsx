import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f2044",
};

export const metadata: Metadata = {
  title: {
    default: "AsthmaTrack",
    template: "%s | AsthmaTrack",
  },
  description:
    "Registre seus sintomas diários e medições de PEF. Acompanhe sua evolução e compartilhe dados com seu médico de forma segura.",
  keywords: ["asma", "PEF", "peak flow", "sintomas", "saúde"],
  applicationName: "AsthmaTrack",
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[var(--at-bg-app)] text-[var(--at-text-primary)]">
        {children}
      </body>
    </html>
  );
}
