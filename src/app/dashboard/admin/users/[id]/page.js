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
  const [entityLoading, setEntityLoading] = useState(false);
  const [entityData, setEntityData] = useState(null);
  
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
  
  useEffect(() => {
    const fetchEntityData = async () => {
      if (user?.type !== 'national_admin' && user?.scope_id) {
        setEntityLoading(true);
        
        try {
          const entityType = 
          user.type === 'district_admin' ? 'district' : 
          user.type === 'circuit_supervisor' ? 'circuit' : 
          user.type === 'head_teacher' ? 'school' : 
          user.type === 'regional_admin' ? 'region' : 
          'undefined';
          const response = await fetch(`/api/${entityType}s/${user.scope_id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch entity data');
          }
          
          const data = await response.json();
          
          if (data.success) {
            setEntityData(data[entityType]);
          } else {
            throw new Error(data.message || 'Failed to fetch entity data');
          }
        } catch (err) {
          console.error('Error fetching entity data:', err);
        } finally {
          setEntityLoading(false);
        }
      }
    };
    
    fetchEntityData();
  }, [user]);
  
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
      'circuit_supervisor': 'success',
      'head_teacher': 'warning',
      // 'rtp_collector': 'warning',
      'super_admin': 'error'
    };
    
    return typeMap[type] || 'default';
  };
  
  // Get label for user type chip
  const getUserTypeLabel = (type) => {
    if (!type) return 'Unknown';
    
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
              
              {/* <Chip 
                label={user.status === 'active' ? 'Active' : 'Inactive'} 
                color={user.status === 'active' ? 'success' : 'error'} 
                size="small" 
                variant="outlined"
              /> */}
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              Last login: {user.birth_date ? new Date(user.birth_date).toLocaleString() : 'N/A'}
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
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Grid container spacing={3}>
                {/* User Avatar and Name Section */}
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                    <Avatar 
                      sx={{ width: 120, height: 120, mb: 2, bgcolor: getUserTypeColor(user?.type) }}
                    >
                      {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                    </Avatar>
                    <Typography variant="h5" align="center" gutterBottom>
                      {user?.first_name} {user?.other_names ? user.other_names + ' ' : ''}{user?.last_name}
                    </Typography>
                    <Chip 
                      label={getUserTypeLabel(user?.type)} 
                      color={getUserTypeColor(user?.type)}
                      sx={{ mb: 1 }}
                    />
                    <Typography variant="body2" color="textSecondary" align="center">
                      User ID: {user?.id}
                    </Typography>
                  </Box>
                </Grid>

                {/* User Details Section */}
                <Grid size={{ xs: 12, md: 8 }}>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    Personal Information
                  </Typography>
                  
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          First Name
                        </Typography>
                        <Typography variant="body1">
                          {user?.first_name || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Last Name
                        </Typography>
                        <Typography variant="body1">
                          {user?.last_name || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Other Names
                        </Typography>
                        <Typography variant="body1">
                          {user?.other_names || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Gender
                        </Typography>
                        <Typography variant="body1">
                          {user?.gender === 'M' ? 'Male' : user?.gender === 'F' ? 'Female' : 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Email
                        </Typography>
                        <Typography variant="body1">
                          {user?.email || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Phone Number
                        </Typography>
                        <Typography variant="body1">
                          {user?.phone_number || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          ID Number
                        </Typography>
                        <Typography variant="body1">
                          {user?.identification_number || 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Last Login
                        </Typography>
                        <Typography variant="body1">
                          {user?.birth_date ? new Date(user.birth_date).toLocaleDateString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Created At
                        </Typography>
                        <Typography variant="body1">
                          {user?.created_at ? new Date(user.created_at).toLocaleString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                          Last Updated
                        </Typography>
                        <Typography variant="body1">
                          {user?.updated_at ? new Date(user.updated_at).toLocaleString() : 'N/A'}
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
                
                {/* Entity Information Section */}
                {user?.type !== 'national_admin' && user?.scope_id && (
                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                      {user?.type === 'head_teacher' ? 'School Information' : 
                       user?.type === 'circuit_supervisor' ? 'Circuit Information' :
                       user?.type === 'district_admin' ? 'District Information' :
                       user?.type === 'regional_admin' ? 'Region Information' : 'User Information'}
                    </Typography>
                    
                    {entityLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    ) : entityData ? (
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                              Name
                            </Typography>
                            <Typography variant="body1">
                              {entityData.name || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        {user?.type === 'head_teacher' && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                          <Box sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary">
                              GES Code
                            </Typography>
                            <Typography variant="body1">
                              {entityData.ges_code}
                            </Typography>
                          </Box>
                        </Grid>
                        )}

                        {user?.type === 'head_teacher' && (
                          <>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  Circuit
                                </Typography>
                                <Typography variant="body1">
                                  {entityData.circuit_name || 'N/A'}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  District
                                </Typography>
                                <Typography variant="body1">
                                  {entityData.district_name || 'N/A'}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  Region
                                </Typography>
                                <Typography variant="body1">
                                  {entityData.region_name || 'N/A'}
                                </Typography>
                              </Box>
                            </Grid>
                          </>
                        )}
                        
                        {user?.type === 'circuit_supervisor' && (
                          <>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  District
                                </Typography>
                                <Typography variant="body1">
                                  {entityData.district_name || 'N/A'}
                                </Typography>
                              </Box>
                            </Grid>
                            
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="subtitle2" color="textSecondary">
                                  Region
                                </Typography>
                                <Typography variant="body1">
                                  {entityData.region_name || 'N/A'}
                                </Typography>
                              </Box>
                            </Grid>
                          </>
                        )}
                        
                        {user?.type === 'district_admin' && (
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="subtitle2" color="textSecondary">
                                Region
                              </Typography>
                              <Typography variant="body1">
                                {entityData.region_name || 'N/A'}
                              </Typography>
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        No entity information available
                      </Typography>
                    )}
                  </Grid>
                )}
              </Grid>
            </>
          )}
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