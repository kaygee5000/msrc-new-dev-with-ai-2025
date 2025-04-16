"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Card, 
  CardContent, 
  Alert,
  Paper,
  Grid
} from '@mui/material';
import { fetchAPI } from '@/utils/api';
import ReentryDashboard from '@/components/ReentryDashboard';

export default function ReentryPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError('');
    try {
      // Call authentication API
      const response = await fetchAPI('users/login', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      // Check if user has Data Collector role
      if (response.user && response.user.type === 'data_collector') {
        setUser(response.user);
        setIsAuthenticated(true);
      } else {
        setLoginError('Unauthorized: Only Data Collectors can access this portal');
      }
    } catch (error) {
      setLoginError(error.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated && user) {
    return <ReentryDashboard user={user} />;
  }

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" bgcolor="#f5f6fa">
      <Container maxWidth="md">
        <Grid container spacing={3} alignItems="center" justifyContent="center">
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0} 
              sx={{
                p: 4,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                bgcolor: 'background.paper',
                borderRadius: 2
              }}
            >
              <Typography variant="h4" component="h1" gutterBottom color="primary">
                Pregnancy & Re-entry Data Collection
              </Typography>
              <Typography variant="body1" paragraph>
                Welcome to the Pregnancy & Re-entry Data Collection portal. This platform enables 
                education officials to record and track pregnancy cases and re-entry of young mothers 
                back to school.
              </Typography>
              <Typography variant="body1" paragraph>
                Your data helps create effective interventions that support young mothers 
                in continuing their education and reducing dropout rates.
              </Typography>
              <Typography variant="body2" sx={{ fontStyle: 'italic', mt: 2 }}>
                For authorized data collectors only. Please login with your provided credentials.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6} display="flex" alignItems="center" justifyContent="center">
            <Card elevation={3} sx={{ width: '100%', maxWidth: 400, mx: 'auto' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" component="h2" gutterBottom align="center">
                  Data Collector Login
                </Typography>
                {loginError && (
                  <Alert severity="error" sx={{ my: 2 }}>
                    {loginError}
                  </Alert>
                )}
                <form onSubmit={handleLogin}>
                  <TextField
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    margin="normal"
                    fullWidth
                    required
                    autoFocus
                  />
                  <TextField
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    margin="normal"
                    fullWidth
                    required
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="large"
                    disabled={isLoading}
                    sx={{ mt: 3 }}
                  >
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}