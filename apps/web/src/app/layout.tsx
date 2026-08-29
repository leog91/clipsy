import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clipsy - YouTube Bookmarking App",
  description: "Save and organize YouTube videos for fast retrieval",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster theme="dark" richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
