"use client";
import { usePathname } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function AppShell({ children }) {
  const pathname = usePathname();
  const hideMainNav = pathname && pathname.startsWith('/reentry');
  return (
    <>
      {!hideMainNav && <Navbar />}
      <main className="min-h-screen">{children}</main>
      {!hideMainNav && <Footer />}
    </>
  );
}
