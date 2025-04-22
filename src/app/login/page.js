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
  IconButton
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from "next-auth/react";
import { Visibility, VisibilityOff, Email, Phone } from '@mui/icons-material';

export default function LoginPage() {
  const router = useRouter();

  // State for tab selection (0 = password login, 1 = magic link login)
  const [tabValue, setTabValue] = useState(0);
  
  // State for password login
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  
  // State for magic link login
  const [email, setEmail] = useState('');
  
  // Common states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    // Reset states when switching tabs
    setError('');
    setVerificationSent(false);
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
      const result = await signIn('credentials', {
        redirect: false,
        email: credentials.email,
        password: credentials.password,
      });
      
      if (result.error) {
        throw new Error(result.error || 'Invalid email or password');
      }
      
      // Successfully authenticated
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
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
      setError(err.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
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
              Welcome to MSRC
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
          
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <MuiLink component={Link} href="/reset-password" variant="body2">
              Forgot password?
            </MuiLink>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}