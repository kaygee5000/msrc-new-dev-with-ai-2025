"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  Divider,
  Alert,
  Stack,
  Link as MuiLink
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Link from 'next/link';
import { setAuthUser, isAuthenticated, getAuthUser } from '@/utils/auth';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user is already authenticated
  useEffect(() => {
    const user = isAuthenticated() ? getAuthUser() : null;
    if (user) {
      const ADMIN_TYPES = [
        'national_admin',
        'regional_admin',
        'district_admin',
        'circuit_supervisor'
      ];
      if (user.type === 'data_collector') {
        router.push('/reentry');
      } else if (ADMIN_TYPES.includes(user.type)) {
        router.push('/dashboard');
      } else {
        router.push('/unauthorized');
      }
    }
  }, [router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        setIsLoading(false);
        return;
      }

      // Make API call to verify credentials
      const response = await fetch('/api/users/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Authentication failed');
      }

      const userData = await response.json();
      
      // Normalize type for app logic
      const normalizedUser = {
        ...userData.user,
        type: userData.user.type || userData.user.role
      };
      setAuthUser(normalizedUser);
      const ADMIN_TYPES = [
        'national_admin',
        'regional_admin',
        'district_admin',
        'circuit_supervisor'
      ];
      if (normalizedUser.type === 'data_collector') {
        router.push('/reentry');
      } else if (ADMIN_TYPES.includes(normalizedUser.type)) {
        router.push('/dashboard');
      } else {
        router.push('/unauthorized');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials and try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // For demo/development purposes
  const handleDemoLogin = async (role) => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create demo user based on selected role
      const demoUser = {
        id: role === 'admin' ? 1 : 2,
        email: role === 'admin' ? 'admin@msrc.edu' : 'datacollector@msrc.edu',
        name: role === 'admin' ? 'Admin User' : 'Data Collector',
        type: role === 'admin' ? 'national_admin' : 'data_collector',
        regionId: role === 'admin' ? null : 3,
        districtId: role === 'admin' ? null : 2,
        circuitId: role === 'admin' ? null : 5,
      };
      setAuthUser(demoUser);
      if (demoUser.type === 'data_collector') {
        router.push('/reentry');
      } else if (['national_admin','regional_admin','district_admin','circuit_supervisor'].includes(demoUser.type)) {
        router.push('/dashboard');
      } else {
        router.push('/unauthorized');
      }
    } catch (err) {
      setError('Demo login failed.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: 'calc(100vh - 64px)', 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center',
      py: 8,
      backgroundColor: 'grey.50'
    }}>
      <Container maxWidth="sm">
        <Card elevation={3}>
          <CardContent sx={{ px: 4, py: 5 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box 
                sx={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: '50%', 
                  bgcolor: 'primary.main', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2
                }}
              >
                <LockOutlinedIcon fontSize="large" sx={{ color: 'white' }} />
              </Box>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                Sign In
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                Enter your credentials to access your account
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={3}>
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  fullWidth
                  required
                  autoComplete="email"
                />

                <TextField
                  label="Password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  fullWidth
                  required
                  autoComplete="current-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={togglePasswordVisibility} edge="end">
                          {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ textAlign: 'right' }}>
                  <MuiLink component={Link} href="/reset-password" variant="body2" sx={{ textDecoration: 'none' }}>
                    Forgot password?
                  </MuiLink>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Button>

                {process.env.NODE_ENV === 'development' && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, textAlign: 'center' }}>
                      Demo Quick Access
                    </Typography>
                    <Stack direction="row" spacing={2}>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        fullWidth 
                        onClick={() => handleDemoLogin('admin')}
                        disabled={isLoading}
                      >
                        Admin Demo
                      </Button>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        fullWidth
                        onClick={() => handleDemoLogin('datacollector')}
                        disabled={isLoading}
                      >
                        Data Collector Demo
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </form>

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Divider sx={{ mb: 3 }} />
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <MuiLink component={Link} href="#" sx={{ fontWeight: 500, textDecoration: 'none' }}>
                  Contact your administrator
                </MuiLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}