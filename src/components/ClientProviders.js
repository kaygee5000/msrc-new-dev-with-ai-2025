"use client";

import { SessionProvider } from "next-auth/react";
import { ProgramProvider } from "@/context/ProgramContext";
import { ConnectionProvider } from "@/context/ConnectionContext";
import { NotificationProvider } from "./NotificationProvider";
import { AuthProvider } from "@/context/AuthContext";

export default function ClientProviders({ children }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <ConnectionProvider>
          <ProgramProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </ProgramProvider>
        </ConnectionProvider>
      </AuthProvider>
    </SessionProvider>
  );
}