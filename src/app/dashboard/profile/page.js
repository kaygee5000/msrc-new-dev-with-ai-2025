'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  Avatar, 
  Grid, 
  Divider, 
  Button, 
  TextField, 
  LinearProgress,
  Card,
  CardContent,
  Alert,
  Snackbar,
  CircularProgress
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useProgramContext } from "@/context/ProgramContext";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { currentProgram } = useProgramContext();
  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    title: '',
    phone: '',
  });
  const [profileData, setProfileData] = useState(null);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Fetch full profile data when component mounts
  useEffect(() => {
    const fetchProfileData = async () => {
      if (user?.id) {
        setLoading(true);
        try {
          const response = await fetch(`/api/users/profile?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setProfileData(data.user);
              
              // Initialize form with profile data
              setFormData({
                name: data.user.name || '',
                email: data.user.email || '',
                title: data.user.title || '',
                phone: data.user.phone || '',
              });
            }
          } else {
            console.error('Failed to fetch profile data');
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchProfileData();
  }, [user]);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleEditToggle = () => {
    setEditing(!editing);
    
    // If canceling edit, reset form data
    if (editing && profileData) {
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        title: profileData.title || '',
        phone: profileData.phone || '',
      });
    }
  };
  
  const handleSaveProfile = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.id,
          ...formData
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Update local profile data with the changes
          setProfileData(prev => ({
            ...prev,
            ...data.user
          }));
          
          setSnackbar({
            open: true,
            message: 'Profile updated successfully!',
            severity: 'success'
          });
          
          setEditing(false);
        } else {
          throw new Error(data.message || 'Failed to update profile');
        }
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to update profile',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  if (isLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading profile...</Typography>
      </Container>
    );
  }
  
  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Typography>User not found. Please log in.</Typography>
      </Container>
    );
  }

  // Use profileData if available, otherwise fall back to the user object from auth context
  const displayData = profileData || user;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h4" component="h1">
            My Profile
          </Typography>
          
          <Button 
            variant={editing ? "outlined" : "contained"} 
            color={editing ? "secondary" : "primary"} 
            onClick={handleEditToggle}
            disabled={loading}
          >
            {editing ? "Cancel" : "Edit Profile"}
          </Button>
        </Box>
        
        <Grid container spacing={4}>
          {/* Left column with avatar and basic info */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar 
                sx={{ 
                  width: 150, 
                  height: 150, 
                  fontSize: '3rem', 
                  bgcolor: 'primary.main',
                  mb: 2
                }}
              >
                {getInitials(displayData.name)}
              </Avatar>
              
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {displayData.name || 'User'}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {displayData.title || 'Education Officer'}
              </Typography>
              
              <Card sx={{ width: '100%', mt: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Account Information
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Role
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {displayData.role === 'admin' ? 'Administrator' : 'User'}
                    </Typography>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Typography variant="body2" color="text.secondary">
                      User Type
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {displayData.type ? displayData.type.replace(/_/g, ' ').split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ') : 'Standard User'}
                    </Typography>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Typography variant="body2" color="text.secondary">
                      Account ID
                    </Typography>
                    <Typography variant="body1">
                      {displayData.id || 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Grid>
          
          {/* Right column with profile details */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Personal Information
              </Typography>
              
              <Box component="form" sx={{ mt: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!editing || loading}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!editing || loading}
                      required
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Title / Position"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      disabled={!editing || loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={formData.phone || ''}
                      onChange={handleInputChange}
                      disabled={!editing || loading}
                    />
                  </Grid>
                  
                  {editing && (
                    <Grid item xs={12}>
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={handleSaveProfile}
                          disabled={loading}
                          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Paper>
            
            {/* Regional Assignment section */}
            <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Regional Assignment
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {profileData?.regions && profileData.regions.length > 0 ? (
                  profileData.regions.map(region => (
                    <Grid item xs={12} sm={4} key={`region-${region.id}`}>
                      <Typography variant="body2" color="text.secondary">
                        Region
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {region.name}
                      </Typography>
                    </Grid>
                  ))
                ) : displayData.regionId ? (
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Region
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Region {displayData.regionId}
                    </Typography>
                  </Grid>
                ) : null}
                
                {profileData?.districts && profileData.districts.length > 0 ? (
                  profileData.districts.map(district => (
                    <Grid item xs={12} sm={4} key={`district-${district.id}`}>
                      <Typography variant="body2" color="text.secondary">
                        District
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {district.name}
                      </Typography>
                    </Grid>
                  ))
                ) : displayData.districtId ? (
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      District
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      District {displayData.districtId}
                    </Typography>
                  </Grid>
                ) : null}
                
                {profileData?.circuits && profileData.circuits.length > 0 ? (
                  profileData.circuits.map(circuit => (
                    <Grid item xs={12} sm={4} key={`circuit-${circuit.id}`}>
                      <Typography variant="body2" color="text.secondary">
                        Circuit
                      </Typography>
                      <Typography variant="body1" gutterBottom>
                        {circuit.name}
                      </Typography>
                    </Grid>
                  ))
                ) : displayData.circuitId ? (
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Circuit
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Circuit {displayData.circuitId}
                    </Typography>
                  </Grid>
                ) : null}
                
                {!displayData.regionId && !displayData.districtId && !displayData.circuitId && 
                 (!profileData || !profileData.regions?.length && !profileData.districts?.length && !profileData.circuits?.length) && (
                  <Grid item xs={12}>
                    <Typography variant="body1">
                      No regional assignment found.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
            
            {/* Program Assignment section - show if available in profileData */}
            {profileData?.programRoles && profileData.programRoles.length > 0 && (
              <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Program Assignments
                </Typography>
                
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  {profileData.programRoles.map((pr, index) => (
                    <Grid item xs={12} key={`program-${pr.id || index}`}>
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                        <Typography variant="subtitle1" fontWeight="medium">
                          {pr.program_name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Role: {pr.role_name || pr.role_code}
                        </Typography>
                        {pr.scope_type !== 'global' && (
                          <Typography variant="body2" color="text.secondary">
                            Scope: {pr.scope_type} {pr.scope_id ? `(ID: ${pr.scope_id})` : ''}
                          </Typography>
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Paper>
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
