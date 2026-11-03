import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

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
  themeColor: "#f7f2ea",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
