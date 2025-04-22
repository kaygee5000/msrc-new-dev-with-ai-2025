'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Divider,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  Tab,
  Tabs
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SchoolIcon from '@mui/icons-material/School';
import BadgeIcon from '@mui/icons-material/Badge';
import ProgramRoleAssignment from '@/components/ProgramRoleAssignment';

export default function UserDetail() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/users/${params.id}?includeProgramRoles=true`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setUser(data.user);
        } else {
          throw new Error(data.message || 'Failed to fetch user');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError(err.message || 'An error occurred while fetching user');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUser();
  }, [params.id]);
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Handle program roles change from ProgramRoleAssignment component
  const handleProgramRolesChange = (roles) => {
    setUser(prevUser => ({
      ...prevUser,
      program_roles: roles
    }));
  };
  
  // Format user type 
  const formatUserType = (type) => {
    if (!type) return 'Unknown';
    
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get color for user type chip
  const getUserTypeColor = (type) => {
    if (!type) return 'default';
    
    const typeMap = {
      'national_admin': 'primary',
      'district_admin': 'primary',
      'data_collector': 'success',
      'rtp_collector': 'warning',
      'super_admin': 'error'
    };
    
    return typeMap[type] || 'default';
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }
  
  if (!user) {
    return (
      <Alert severity="warning" sx={{ my: 2 }}>
        User not found
      </Alert>
    );
  }
  
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          User Details
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            sx={{ mr: 2 }}
            onClick={() => router.back()}
          >
            Back
          </Button>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => router.push(`/dashboard/admin/users/${params.id}/edit`)}
          >
            Edit User
          </Button>
        </Box>
      </Box>
      
      <Paper sx={{ mb: 4, p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 100,
              height: 100,
              bgcolor: 'primary.main',
              fontSize: '2rem',
              mr: 3
            }}
          >
            {(user.first_name?.[0] || '') + (user.last_name?.[0] || '')}
          </Avatar>
          
          <Box>
            <Typography variant="h5" component="h2">
              {(user.first_name + " " + user.last_name) || "No Name"}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 2 }}>
              <Chip 
                label={formatUserType(user.type)} 
                color={getUserTypeColor(user.type)} 
                size="small" 
                sx={{ mr: 1 }}
              />
              
              <Chip 
                label={user.status === 'active' ? 'Active' : 'Inactive'} 
                color={user.status === 'active' ? 'success' : 'error'} 
                size="small" 
                variant="outlined"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Last login: {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
            </Typography>
          </Box>
        </Box>
      </Paper>
      
      <Box sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="Basic Information" />
          <Tab label="Program Access" />
        </Tabs>
      </Box>
      
      {tabValue === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" component="h3" sx={{ mb: 3 }}>
            Basic Information
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Email
                </Typography>
                <Typography variant="body1">
                  {user.email}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Phone Number
                </Typography>
                <Typography variant="body1">
                  {user.phone_number || '-'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  User Type
                </Typography>
                <Typography variant="body1">
                  {formatUserType(user.type)}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  User Status
                </Typography>
                <Typography variant="body1">
                  {user.status === 'active' ? 'Active' : 'Inactive'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Created At
                </Typography>
                <Typography variant="body1">
                  {user.created_at ? new Date(user.created_at).toLocaleString() : '-'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Updated
                </Typography>
                <Typography variant="body1">
                  {user.updated_at ? new Date(user.updated_at).toLocaleString() : '-'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {tabValue === 1 && (
        <Paper sx={{ p: 3 }}>
          <ProgramRoleAssignment 
            userId={user.id}
            initialProgramRoles={user.program_roles || []}
            onProgramRolesChange={handleProgramRolesChange}
          />
        </Paper>
      )}
    </Box>
  );
}