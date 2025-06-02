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
        setLoading(true);
        const response = await fetch(`/api/auth/reset-password?token=${token}`);
        const data = await response.json();
        
        if (response.ok && data.success) {
          setTokenValid(true);
          setEmail(data.email || '');
        } else {
          setError(data.message || "Invalid or expired reset token");
          setTokenValid(false);
        }
      } catch (err) {
        console.error("Error verifying token:", err);
        setError("Failed to verify reset token");
        setTokenValid(false);
      } finally {
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
    
    // Validate passwords
    if (!password) {
      setError("Please enter a new password");
      return;
    }
    
    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }
    
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          password
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password");
      }
      
      setSuccess("Your password has been reset successfully");
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      console.error("Error resetting password:", err);
      setError(err.message || "Failed to reset password");
    } finally {
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
