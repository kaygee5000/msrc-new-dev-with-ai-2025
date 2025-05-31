"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Breadcrumbs,
  Link,
  CircularProgress
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import { useAuth } from '@/context/AuthContext';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // If authentication check is complete and user is not authenticated
    if (!loading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // Check if user is admin
    if (!loading && isAuthenticated && user?.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router, user]);

  // Show loading while checking authentication
  if (loading || !isAuthenticated) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const adminCards = [
    {
      title: 'Schools',
      description: 'Manage school information and settings',
      icon: <SchoolIcon sx={{ fontSize: 40 }} />,
      link: '/dashboard/admin/schools',
      color: '#4caf50'
    },
    {
      title: 'Districts',
      description: 'Manage district information and settings',
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      link: '/dashboard/admin/districts',
      color: '#2196f3'
    },
    {
      title: 'Regions',
      description: 'Manage region information and settings',
      icon: <LocationOnIcon sx={{ fontSize: 40 }} />,
      link: '/dashboard/admin/regions',
      color: '#ff9800'
    },
    {
      title: 'Circuits',
      description: 'Manage circuit information and settings',
      icon: <AccountBalanceIcon sx={{ fontSize: 40 }} />,
      link: '/dashboard/admin/circuits',
      color: '#9c27b0'
    },
    {
      title: 'Users',
      description: 'Manage user accounts and permissions',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      link: '/dashboard/admin/users',
      color: '#f44336'
    },
    {
      title: 'Settings',
      description: 'Configure system settings and preferences',
      icon: <SettingsIcon sx={{ fontSize: 40 }} />,
      link: '/dashboard/admin/settings',
      color: '#607d8b'
    },
    {
      title: 'Reports',
      description: 'View and generate system reports',
      icon: <BarChartIcon sx={{ fontSize: 40 }} />,
      link: '/dashboard/admin/reports',
      color: '#795548'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link
            underline="hover"
            sx={{ display: 'flex', alignItems: 'center' }}
            color="inherit"
            href="/dashboard"
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Typography
            sx={{ display: 'flex', alignItems: 'center' }}
            color="text.primary"
          >
            Admin
          </Typography>
        </Breadcrumbs>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2 }}>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Welcome to the administration dashboard. From here, you can manage all aspects of the system.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {adminCards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.title}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 6
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mb: 2,
                    p: 2,
                    borderRadius: '50%',
                    width: 80,
                    height: 80,
                    backgroundColor: `${card.color}20`,
                    color: card.color,
                    margin: '0 auto 16px'
                  }}
                >
                  {card.icon}
                </Box>
                <Typography gutterBottom variant="h5" component="h2" align="center">
                  {card.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  {card.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button 
                  size="small" 
                  fullWidth 
                  variant="contained" 
                  sx={{ backgroundColor: card.color }}
                  onClick={() => router.push(card.link)}
                >
                  Manage
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}