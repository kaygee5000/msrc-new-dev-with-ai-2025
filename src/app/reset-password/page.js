'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ResetPasswordRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Using URL API to parse the current URL
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');

    if (token) {
      // Redirect to the new route with token in the path
      router.replace(`/reset-password/${token}`);
    } else {
      // If no token, redirect to forgot password page
      router.replace('/forgot-password');
    }
  }, [router]);

  return null;
}