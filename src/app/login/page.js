'use client';

import { useState } from 'react';
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Alert, 
  Link as MuiLink,
  CircularProgress,
  Tab,
  Tabs,
  InputAdornment,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";
import { Visibility, VisibilityOff, Email, Phone } from '@mui/icons-material';
import ProgramSelectionDialog from '@/components/ProgramSelectionDialog';

export default function LoginPage() {
  const router = useRouter();

  // Map NextAuth error codes to user-friendly messages
  const friendlyErrors = {
    CredentialsSignin: 'Invalid email or password',
    SessionRequired: 'Please sign in to continue',
    EmailSignin: 'Failed to send verification email',
    OAuthSignin: 'Error signing in with OAuth provider',
    OAuthCallback: 'Error during OAuth callback',
    default: 'An unexpected error occurred. Please try again.',
  };

  // State for tab selection (0 = password login, 1 = magic link login, 2 = sms login)
  const [tabValue, setTabValue] = useState(0);
  
  // State for password login
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // State for magic link login
  const [email, setEmail] = useState('');
  
  // State for SMS OTP login
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  
  // Common states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Program selection dialog state
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState(null);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Reset states when switching tabs
    setError('');
    setVerificationSent(false);
    setOtpSent(false);
    setOtp('');
    setOtpError('');
  };
  
  // Handle input change for password login
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle successful authentication
  const handleSuccessfulAuth = (user) => {
    // If user has multiple program roles, show the program selection dialog
    if (user.programRoles && user.programRoles.length > 1) {
      setAuthenticatedUser(user);
      setShowProgramDialog(true);
    } else {
      // If user has only one program role or none, redirect to dashboard
      router.push('/dashboard');
    }
  };
  
  // Handle password login submission
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: credentials.email,
        password: credentials.password,
      });
      
      if (result.error) {
        throw new Error(result.error || 'Invalid email or password');
      }
      
      // Get user data from the session
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        throw new Error('Failed to get user data');
      }
      
      const userData = await response.json();
      handleSuccessfulAuth(userData.user);
    } catch (err) {
      console.error('Login error:', err);
      const message = friendlyErrors[err.message] || err.message || friendlyErrors.default;
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle magic link submission
  const handleMagicLinkLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (!email) {
        throw new Error('Please enter your email address');
      }
      
      const result = await signIn('email', {
        redirect: false,
        email: email,
        callbackUrl: `${window.location.origin}/dashboard`,
      });
      
      if (result.error) {
        throw new Error(result.error || 'Failed to send verification email');
      }
      
      // Show verification sent message
      setVerificationSent(true);
    } catch (err) {
      console.error('Magic link request error:', err);
      const message = friendlyErrors[err.message] || err.message || friendlyErrors.default;
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sending OTP for SMS login
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);
    
    try {
      if (!phoneNumber) {
        throw new Error('Please enter your phone number');
      }
      
      // Call the send-otp API to send the verification code
      const response = await fetch('/api/users/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: phoneNumber,
          type: 'phone',
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send verification code');
      }
      
      setOtpSent(true);
    } catch (err) {
      console.error('OTP request error:', err);
      setOtpError(err.message || 'Failed to send verification code');
    } finally {
      setOtpLoading(false);
    }
  };
  
  // Handle OTP verification for SMS login
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setVerifyLoading(true);
    
    try {
      if (!otp) {
        throw new Error('Please enter the verification code');
      }
      
      // Attempt to sign in with OTP credentials
      const result = await signIn('otp-login', {
        redirect: false,
        phoneOrEmail: phoneNumber,
        otp: otp,
        type: 'phone',
      });
      
      if (result.error) {
        throw new Error(result.error || 'Invalid verification code');
      }
      
      // Get user data from the session
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        throw new Error('Failed to get user data');
      }
      
      const userData = await response.json();
      handleSuccessfulAuth(userData.user);
    } catch (err) {
      console.error('OTP verification error:', err);
      setOtpError(err.message || 'Failed to verify code. Please try again.');
    } finally {
      setVerifyLoading(false);
    }
  };
  
  // Render password login form
  const renderPasswordLogin = () => (
    <Box component="form" onSubmit={handlePasswordLogin} sx={{ mt: 2 }}>
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
        autoFocus
        value={credentials.email}
        onChange={handleInputChange}
        disabled={loading}
      />
      
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="current-password"
        value={credentials.password}
        onChange={handleInputChange}
        disabled={loading}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
              >
                {showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
      />
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </Button>
    </Box>
  );
  
  // Render magic link login form
  const renderMagicLinkLogin = () => (
    <Box component="form" onSubmit={handleMagicLinkLogin} sx={{ mt: 2 }}>
      {!verificationSent ? (
        <>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter your email to receive a secure login link.
          </Typography>
          
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
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </>
      ) : (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="body2">
            A login link has been sent to your email address. Please check your inbox and click the link to sign in.
          </Typography>
        </Alert>
      )}
    </Box>
  );
  
  // Render SMS OTP login form
  const renderSmsOtpLogin = () => (
    <Box component="form" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} sx={{ mt: 2 }}>
      {!otpSent ? (
        <>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Enter your phone number to receive a verification code.
          </Typography>
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="phone"
            label="Phone Number"
            name="phone"
            autoComplete="tel"
            placeholder="+233201234567"
            autoFocus
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={otpLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Phone fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={otpLoading}
            startIcon={otpLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {otpLoading ? 'Sending...' : 'Send Verification Code'}
          </Button>
        </>
      ) : (
        <>
          <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
            <Typography variant="body2">
              A verification code has been sent to {phoneNumber}.
            </Typography>
          </Alert>
          
          <TextField
            margin="normal"
            required
            fullWidth
            id="otp"
            label="Verification Code"
            name="otp"
            autoComplete="one-time-code"
            autoFocus
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={verifyLoading}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={verifyLoading}
            startIcon={verifyLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {verifyLoading ? 'Verifying...' : 'Verify Code'}
          </Button>
          
          <Box sx={{ textAlign: 'center', mt: 1 }}>
            <Button
              variant="text"
              color="primary"
              size="small"
              onClick={() => {
                setOtpSent(false);
                setOtp('');
              }}
              disabled={otpLoading || verifyLoading}
            >
              Use a different phone number
            </Button>
          </Box>
        </>
      )}
      
      {otpError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {otpError}
        </Alert>
      )}
    </Box>
  );
  
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            borderRadius: 2,
          }}
        >
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography component="h1" variant="h5" gutterBottom>
              Welcome to mSRC
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to continue to the dashboard
            </Typography>
          </Box>
          
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            variant="fullWidth" 
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Password" id="login-tab-0" />
            <Tab label="Magic Link" id="login-tab-1" />
            <Tab label="SMS Code" id="login-tab-2" />
          </Tabs>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box role="tabpanel" hidden={tabValue !== 0}>
            {tabValue === 0 && renderPasswordLogin()}
          </Box>
          
          <Box role="tabpanel" hidden={tabValue !== 1}>
            {tabValue === 1 && renderMagicLinkLogin()}
          </Box>
          
          <Box role="tabpanel" hidden={tabValue !== 2}>
            {tabValue === 2 && renderSmsOtpLogin()}
          </Box>
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <MuiLink component={Link} href="/reset-password" variant="body2">
              Forgot password?
            </MuiLink>
          </Box>
        </Paper>
      </Box>
      
      {/* Program Selection Dialog */}
      <ProgramSelectionDialog
        open={showProgramDialog}
        user={authenticatedUser}
        onClose={() => setShowProgramDialog(false)}
      />
    </Container>
  );
}