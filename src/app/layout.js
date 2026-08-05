import { Geist, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata = {
  title: "Oleidian - Git for Figma. Version Control for Designers.",
  description: "Oleidian brings repos, commits, branches, and pull requests to Figma. Track every design change, review with structured pull requests, and never lose a version again. Free Figma plugin.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Oleidian - Git for Figma. Version Control for Designers.",
    description: "Track every design change, review with pull requests, and never lose a version again. Free Figma plugin.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geist.variable} ${inter.variable} ${playfair.variable} antialiased`}>
      <head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/logo.svg" />
      </head>
      <body className={`${geist.className} min-h-screen flex flex-col text-black`}>
        {children}
      </body>
    </html>
  );
}
