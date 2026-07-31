import "./globals.css";

export const metadata = {
  title: "GitDesign — Git for Figma. Version Control for Designers.",
  description: "GitDesign brings repos, commits, branches, and pull requests to Figma. Track every design change, review with structured pull requests, and never lose a version again. Free Figma plugin.",
  openGraph: {
    title: "GitDesign — Git for Figma. Version Control for Designers.",
    description: "Track every design change, review with pull requests, and never lose a version again. Free Figma plugin.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Geist:wght@400;500&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen flex flex-col text-black">
        {children}
      </body>
    </html>
  );
}
