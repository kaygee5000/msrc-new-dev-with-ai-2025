"use client";

import { SessionProvider } from "next-auth/react";
import { ProgramProvider } from "@/context/ProgramContext";

export default function ClientProviders({ children }) {
  return (
    <SessionProvider>
      <ProgramProvider>
        {children}
      </ProgramProvider>
    </SessionProvider>
  );
}