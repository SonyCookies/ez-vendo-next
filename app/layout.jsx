import "./globals.css";
import { inter } from "./components/Fonts";


export const metadata = {
  title: "EZ-Vendo",
  description: "EZ-Vendo - RFID WiFi Management System",
  manifest: "/manifest.json",
  themeColor: "#10b981",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EZ-Vendo",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "EZ-Vendo",
    title: "EZ-Vendo",
    description: "EZ-Vendo - RFID WiFi Management System",
  },
  twitter: {
    card: "summary",
    title: "EZ-Vendo",
    description: "EZ-Vendo - RFID WiFi Management System",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="EZ-Vendo" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${inter.className} antialiased text-sm sm:text-based`}
      >
        {children}
      </body>
    </html>
  );
}
