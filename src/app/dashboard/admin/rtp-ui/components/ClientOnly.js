'use client';
import { useState, useEffect } from 'react';

/**
 * ClientOnly component to prevent hydration errors by only rendering children on the client
 * This is useful for components that use browser-specific APIs or have different rendering between server and client
 */
export default function ClientOnly({ children, fallback = null }) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render children on the client to avoid hydration mismatch
  return isClient ? children : fallback;
}
