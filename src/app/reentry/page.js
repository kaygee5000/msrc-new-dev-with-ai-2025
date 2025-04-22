"use client";

import React, { useEffect } from 'react';
import { Box, Container, Typography, CircularProgress } from '@mui/material';
import ReentryDashboard from '@/components/ReentryDashboard';
import { useSession } from "next-auth/react";
import { useProgramContext } from "@/context/ProgramContext";
import { useRouter } from 'next/navigation';

export default function ReentryPage() {
  const { data: session, status } = useSession();
  const { currentProgram } = useProgramContext();
  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isDataCollector = user?.role === "data_collector" || false;
  const isReentryAuthorized = user?.programRoles?.some(pr => pr.program_code === "reentry") || false;
  
  const router = useRouter();
  
  // Immediately redirect if not authenticated or not a data collector
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (!isDataCollector) {
        // Redirect to dashboard if user is authenticated but not a data collector
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, isLoading, router, isDataCollector]);

  // Show loading while authentication is being checked
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  // Hide content entirely if not authenticated
  if (!isAuthenticated) {
    return null; // This prevents content flash before redirect completes
  }

  // Only check reentry authorization on the client side to avoid hydration mismatch
  const isAuthorizedForReentry = typeof window !== 'undefined' ? isReentryAuthorized : true;
  
  // Hide content if not authorized (client-side only check)
  if (!isAuthorizedForReentry) {
    return null;
  }

  // Only show content if user is authenticated and is a data collector
  if (isDataCollector) {
    return <ReentryDashboard user={user} />;
  }

  return null; // Fallback, should not reach here due to redirects
}
