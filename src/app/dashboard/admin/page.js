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
  Link
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is logged in and is admin
    const userData = localStorage.getItem('msrc_auth');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Redirect if not admin
      if (parsedUser.role !== 'admin') {
        router.push('/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('msrc_auth');
    setUser(null);
    router.push('/login');
  };

  const adminModules = [
    {
      title: 'Regions',
      description: 'Manage regions in the education system',
      icon: <LocationOnIcon sx={{ fontSize: 40 }} color="primary" />,
      path: '/dashboard/admin/regions'
    },
    {
      title: 'Districts',
      description: 'Manage educational districts and their configurations',
      icon: <BusinessIcon sx={{ fontSize: 40 }} color="primary" />,
      path: '/dashboard/admin/districts'
    },
    {
      title: 'Circuits',
      description: 'Manage educational circuits within districts',
      icon: <AccountBalanceIcon sx={{ fontSize: 40 }} color="primary" />,
      path: '/dashboard/admin/circuits'
    },
    {
      title: 'Schools',
      description: 'Manage schools, their details and configurations',
      icon: <SchoolIcon sx={{ fontSize: 40 }} color="primary" />,
      path: '/dashboard/admin/schools'
    },
    {
      title: 'Users',
      description: 'Manage system users and their access levels',
      icon: <PeopleIcon sx={{ fontSize: 40 }} color="primary" />,
      path: '/dashboard/admin/users'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and parameters',
      icon: <SettingsIcon sx={{ fontSize: 40 }} color="primary" />,
      path: '/dashboard/admin/settings'
    },
    {
      title: 'Pregnancy & Re-entry Dashboard',
      description: 'Analytics and submissions for pregnancy & re-entry data',
      icon: <BarChartIcon sx={{ fontSize: 40 }} color="primary" />,
      path: '/dashboard/admin/reentry'
    }
  ];

  if (!user) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <Typography>Loading...</Typography>
    </Box>;
  }

  return (
    <Box sx={{ p: 3, backgroundColor: '#f5f7fa', minHeight: 'calc(100vh - 64px)' }}>
      {/* Logout Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button variant="outlined" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          color="inherit" 
          href="/dashboard" 
          sx={{ display: 'flex', alignItems: 'center' }}
          onClick={(e) => {
            e.preventDefault();
            router.push('/dashboard');
          }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <SettingsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Admin Panel
        </Typography>
      </Breadcrumbs>

      {/* Page Title */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Admin Control Panel
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Manage all aspects of the MSRC system from this central hub
        </Typography>
      </Box>

      {/* Admin Module Cards */}
      <Grid container spacing={3}>
        {adminModules.map((module, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1, textAlign: 'center', pt: 4 }}>
                <Box sx={{ mb: 2 }}>
                  {module.icon}
                </Box>
                <Typography gutterBottom variant="h5" component="h2" sx={{ fontWeight: 'medium' }}>
                  {module.title}
                </Typography>
                <Typography color="text.secondary">
                  {module.description}
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Button 
                  size="medium" 
                  variant="contained" 
                  onClick={() => router.push(module.path)}
                >
                  Manage {module.title}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}