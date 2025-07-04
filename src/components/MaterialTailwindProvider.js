"use client";

import { ThemeProvider } from "@material-tailwind/react";

// Correct theme structure for @material-tailwind/react
const theme = {
  colors: {
    blue: {
      50: '#e3f2fd',
      100: '#bbdefb',
      200: '#90caf9',
      300: '#64b5f6',
      400: '#42a5f5',
      500: '#2196f3',
      600: '#1e88e5',
      700: '#1976d2',
      800: '#1565c0',
      900: '#0d47a1',
    }
  }
};

export default function MaterialTailwindProvider({ children }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}