"use client";
import { usePathname } from 'next/navigation';
import { Box } from '@mui/material';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ConnectionStatus from '@/components/ConnectionStatus';

export default function AppShell({ children }) {
  const pathname = usePathname();
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh'  // Ensure the container takes at least the full viewport height
    }}>
      <Navbar />
      <ConnectionStatus />
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,  // This will make the main content grow to fill available space
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
