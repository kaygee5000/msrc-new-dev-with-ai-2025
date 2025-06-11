import "./globals.css";
import { Inter, Roboto_Mono } from "next/font/google";
import MUIProvider from "@/components/MUIProvider";
import EmotionCache from "@/components/EmotionCache";
import ClientProviders from "@/components/ClientProviders";
import AppShell from '../components/AppShell';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';

// Use Inter as a replacement for Geist (as Geist is not available in Google Fonts)
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "mSRC - Mobile School Report Card",
  description: "A platform for Ghana Education Service to collect and analyze school-level indicators",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        <EmotionCache>
          <MUIProvider>
            <ClientProviders>
              <ServiceWorkerRegistration />
              <AppShell>{children}</AppShell>
            </ClientProviders>
          </MUIProvider>
        </EmotionCache>
      </body>
    </html>
  );
}