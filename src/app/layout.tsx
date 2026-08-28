import type { Metadata, Viewport } from "next";
import { Libre_Baskerville, Nunito_Sans } from "next/font/google";
import "./globals.css";

const display = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display",
});

const sans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-sans",
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  title: "FLAME University Reprographics Portal",
  description:
    "FLAME University Reprographics Portal – Submit print requests, manage job queues, process billing, and access administrative dashboards.",
  icons: {
    icon: "/flame-university.png",
    apple: "/flame-university.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A456F",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="bg-flame-ivory text-flame-ink antialiased min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
