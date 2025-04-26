"use client";

import { SessionProvider } from "next-auth/react";
import { ProgramProvider } from "@/context/ProgramContext";
import { ConnectionProvider } from "@/context/ConnectionContext";
import { NotificationProvider } from "./NotificationProvider";

export default function ClientProviders({ children }) {
  return (
    <SessionProvider>
      <ConnectionProvider>
        <ProgramProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </ProgramProvider>
      </ConnectionProvider>
    </SessionProvider>
  );
}