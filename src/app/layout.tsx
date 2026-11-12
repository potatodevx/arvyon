import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const techMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-tech",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://xyzinnovations.com"),
  title: "XYZ Innovations — Ideas, given form.",
  description: "XYZ Innovations turns ambitious concepts into clear, capable digital products and experiences.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "XYZ Innovations — Ideas, given form.",
    description: "XYZ Innovations turns ambitious concepts into clear, capable digital products and experiences.",
    type: "website",
  },
};

export const viewport = {
  themeColor: "#f4ede3",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={techMono.variable}>
      <body>{children}</body>
    </html>
  );
}
