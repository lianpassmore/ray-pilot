import type { Metadata, Viewport } from "next";
// We use Inter for a clean, editorial look
import { Inter } from "next/font/google";
import "./globals.css";
import AddToHomeScreen from "@/components/AddToHomeScreen";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Ray - AI Relationship Coach",
  description: "Clarity over comfort. An AI relationship coach designed to help you see patterns clearly.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {/* A subtle vignette effect to focus the eye */}
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(44,44,44,0.03)_100%)] z-50" />
        
        {children}
        <AddToHomeScreen />
      </body>
    </html>
  );
}