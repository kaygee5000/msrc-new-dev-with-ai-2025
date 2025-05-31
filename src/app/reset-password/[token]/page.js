'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Container, Card, CardContent, Typography, TextField, Button, Alert, Stack, CircularProgress
} from "@mui/material";

export default function ResetPasswordPage({ params }) {
  const router = useRouter();
  const token = params?.token;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Verify token on component mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Replace with your actual token verification API call
        // const response = await fetch(`/api/auth/verify-reset-token?token=${token}`);
        // const data = await response.json();
        
        // Simulate API call
        setTimeout(() => {
          // Set to true for demo purposes - in real app, set based on API response
          setTokenValid(!!token);
          if (!token) {
            setError("Invalid or expired reset token");
          }
          setLoading(false);
        }, 500);
      } catch (err) {
        console.error("Error verifying token:", err);
        setError("Failed to verify reset token");
        setLoading(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setLoading(false);
      setError("No reset token provided");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Replace with your actual password reset API call
      // const response = await fetch("/api/auth/reset-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ token, email, password }),
      // });
      
      // Simulate API call
      setTimeout(() => {
        // const data = await response.json();
        // if (!response.ok) throw new Error(data.message || "Failed to reset password");
        
        setSuccess("Your password has been reset successfully!");
        setLoading(false);
        
        // Redirect to login after successful password reset
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }, 1000);
    } catch (err) {
      console.error("Error resetting password:", err);
      setError(err.message || "Failed to reset password. Please try again.");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container component="main" maxWidth="xs">
        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <CircularProgress />
          <Typography variant="body1" sx={{ mt: 2 }}>Verifying reset token...</Typography>
        </Box>
      </Container>
    );
  }

  if (!tokenValid) {
    return (
      <Container component="main" maxWidth="xs">
        <Box sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error || "Invalid or expired reset token. Please request a new password reset link."}
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => router.push("/forgot-password")}
          >
            Request New Reset Link
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Card sx={{ width: "100%" }}>
          <CardContent sx={{ p: 4 }}>
            <Typography component="h1" variant="h5" align="center" gutterBottom>
              Reset Your Password
            </Typography>

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="New Password"
                type="password"
                id="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="confirmPassword"
                label="Confirm New Password"
                type="password"
                id="confirmPassword"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                disabled={loading}
                error={!!error && password !== confirm}
                helperText={password !== confirm ? "Passwords do not match" : ""}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Reset Password"}
              </Button>
              <Stack direction="row" justifyContent="flex-end">
                <Button
                  onClick={() => router.push("/login")}
                  sx={{ textTransform: 'none' }}
                >
                  Back to Login
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
