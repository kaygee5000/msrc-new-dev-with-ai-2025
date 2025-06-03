'use client';

import { useState, useEffect } from 'react';
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
import { Visibility, VisibilityOff, Email, Phone } from '@mui/icons-material';
import ProgramSelectionDialog from '@/components/ProgramSelectionDialog';
import { useAuth } from '@/context/AuthContext';

// Mark this page as statically generated
export const dynamic = 'force-static';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading: authLoading, error: authError, login, isAuthenticated, setSelectedProgram } = useAuth();

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
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  
  // Common states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Program selection dialog state
  const [showProgramDialog, setShowProgramDialog] = useState(false);
  
  // Check if user is already authenticated on component mount
  useEffect(() => {
    if (isAuthenticated) {
      // If user has multiple program roles, show program selection
      if (user.programRoles && user.programRoles.length > 1) {
        setShowProgramDialog(true);
      } else {
        // If single or no program role, redirect to dashboard
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, user, router]);

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
  
  // Handle password login submission
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login('credentials', {
        email: credentials.email,
        password: credentials.password,
      });
      
      // If we get here, login was successful
      // The useEffect will handle redirection based on program roles
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
      
      await login('email', { email });
      setVerificationSent(true);
    } catch (err) {
      console.error('Magic link error:', err);
      const message = friendlyErrors[err.message] || err.message || friendlyErrors.default;
      setError(message);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle sending OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setOtpLoading(true);
    
    try {
      if (!phoneOrEmail) {
        throw new Error('Please enter your phone number or email');
      }
      
      const response = await fetch('/api/users/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneOrEmail }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send verification code');
      }
      const data = await response.json();
      setOtpSuccess(data.message || 'Verification code sent successfully');
      setOtpSent(true);
      
      // Clear any previous errors
      setOtpError('');
    } catch (err) {
      console.error('OTP error:', err);
      setOtpError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setOtpLoading(false);
    }
  };
  
  // Handle verifying OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setVerifyLoading(true);
    
    try {
      if (!otp) {
        throw new Error('Please enter the verification code');
      }
      
      await login('otp', { phoneOrEmail, otp });
      
      // If we get here, login was successful
      // The useEffect will handle redirection based on program roles
    } catch (err) {
      console.error('Verification error:', err);
      const message = friendlyErrors[err.message] || err.message || friendlyErrors.default;
      setOtpError(message);
    } finally {
      setVerifyLoading(false);
    }
  };
  
  // Handle program selection
  const handleProgramSelect = (programId) => {
    // Update the selected program in the auth context
    setSelectedProgram(programId);
    
    // Close the dialog and redirect to dashboard
    setShowProgramDialog(false);
    router.push('/dashboard');
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
      <TextField
        fullWidth
        variant="outlined"
        margin="normal"
        label={otpSent ? "Verification Code" : "Phone number or email"}
        value={otpSent ? otp : phoneOrEmail}
        onChange={(e) => otpSent ? setOtp(e.target.value) : setPhoneOrEmail(e.target.value)}
        disabled={loading || (otpSent ? verifyLoading : otpLoading)}
        InputProps={!otpSent ? {
          startAdornment: (
            <InputAdornment position="start">
              {phoneOrEmail.includes('@') ? <Email /> : <Phone />}
            </InputAdornment>
          ),
        } : {}}
        placeholder={otpSent ? "Enter 6-digit code" : "e.g. 0244123456 or user@example.com"}
        autoComplete={otpSent ? "one-time-code" : (phoneOrEmail.includes('@') ? "email" : "tel")}
        type={otpSent ? "number" : (phoneOrEmail.includes('@') ? "email" : "tel")}
      />
      
      {otpError && (
        <Alert severity="error" sx={{ mt: 2 }}>{otpError}</Alert>
      )}
      {otpSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>{otpSuccess}</Alert>
      )}
      
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
        disabled={loading || (otpSent ? verifyLoading : otpLoading) || !(otpSent ? otp : phoneOrEmail)}
      >
        {otpSent 
          ? (verifyLoading ? 'Verifying...' : 'Verify Code') 
          : (otpLoading ? 'Sending...' : 'Send Verification Code')}
      </Button>
      
      {otpSent && (
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            setOtpSent(false);
            setOtp('');
            setOtpError('');
          }}
          disabled={verifyLoading}
          sx={{ mt: 1 }}
        >
          Use a different {phoneOrEmail.includes('@') ? 'email' : 'number'}
        </Button>
      )}
    </Box>
  );

  return (
    <Container component="main" maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
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
            <Tab label="OTP Code" id="login-tab-2" />
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
            <MuiLink component={Link} href="/forgot-password" variant="body2">
              Forgot password?
            </MuiLink>
          </Box>
        </Paper>
      </Box>
      
      {/* Program Selection Dialog */}
      <ProgramSelectionDialog
        open={showProgramDialog}
        user={user}
        onClose={() => setShowProgramDialog(false)}
        onSelect={handleProgramSelect}
      />
    </Container>
  );
}