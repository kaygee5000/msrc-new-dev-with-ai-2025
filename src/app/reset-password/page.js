"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Box, Container, Card, CardContent, Typography, TextField, Button, Alert, Stack
} from "@mui/material";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // Request reset link
  const handleRequest = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      const res = await fetch("/api/users/request-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to send reset link");
      setSuccess("If your email is registered, you will receive a reset link.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const handleReset = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters."); setLoading(false); return;
    }
    if (password !== confirm) {
      setError("Passwords do not match."); setLoading(false); return;
    }
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to reset password");
      setSuccess("Password reset successful. You may now log in.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "grey.50" }}>
      <Container maxWidth="sm">
        <Card elevation={3}>
          <CardContent sx={{ px: 4, py: 5 }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
              {token ? "Set New Password" : "Reset Your Password"}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {token
                ? "Enter your new password below."
                : "Enter your email to receive a password reset link."}
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            {token ? (
              <form onSubmit={handleReset}>
                <Stack spacing={3}>
                  <TextField
                    label="New Password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Confirm Password"
                    type="password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    fullWidth
                    required
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </Button>
                </Stack>
              </form>
            ) : (
              <form onSubmit={handleRequest}>
                <Stack spacing={3}>
                  <TextField
                    label="Email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    fullWidth
                    required
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
                  </Button>
                </Stack>
              </form>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
