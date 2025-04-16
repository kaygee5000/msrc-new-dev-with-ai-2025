import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";
import MUIProvider from "@/components/MUIProvider";
import EmotionCache from "@/components/EmotionCache";
import { AuthProvider } from "@/components/AuthProvider";
import AppShell from '../components/AppShell';

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
  title: "MSRC - Mobile School Report Card",
  description: "A platform for Ghana Education Service to collect and analyze school-level indicators",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased`}>
        <EmotionCache>
          <MUIProvider>
            <AuthProvider>
              <AppShell>
                {children}
              </AppShell>
            </AuthProvider>
          </MUIProvider>
        </EmotionCache>
      </body>
    </html>
  );
}