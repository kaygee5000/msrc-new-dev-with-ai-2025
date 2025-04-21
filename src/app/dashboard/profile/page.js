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
  Snackbar
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';

export default function ProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
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
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        title: user.title || 'Education Officer',
        phone: user.phone || '',
      });
    }
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
    if (editing) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        title: user.title || 'Education Officer',
        phone: user.phone || '',
      });
    }
  };
  
  const handleSaveProfile = () => {
    // In a real application, this would save to a database
    // For now, just show success message
    setSnackbar({
      open: true,
      message: 'Profile updated successfully!',
      severity: 'success'
    });
    
    setEditing(false);
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
  
  if (isLoading) {
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
                {getInitials(user.name)}
              </Avatar>
              
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                {user.name || 'User'}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {user.title || 'Education Officer'}
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
                      {user.role === 'admin' ? 'Administrator' : 'User'}
                    </Typography>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Typography variant="body2" color="text.secondary">
                      User Type
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {user.type ? user.type.replace(/_/g, ' ').split(' ').map(word => 
                        word.charAt(0).toUpperCase() + word.slice(1)
                      ).join(' ') : 'Standard User'}
                    </Typography>
                    
                    <Divider sx={{ my: 1.5 }} />
                    
                    <Typography variant="body2" color="text.secondary">
                      Account ID
                    </Typography>
                    <Typography variant="body1">
                      {user.id || 'N/A'}
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
                      disabled={!editing}
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
                      disabled={!editing}
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
                      disabled={!editing}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={!editing}
                    />
                  </Grid>
                  
                  {editing && (
                    <Grid item xs={12}>
                      <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button 
                          variant="contained" 
                          color="primary" 
                          onClick={handleSaveProfile}
                        >
                          Save Changes
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Paper>
            
            <Paper sx={{ p: 3, borderRadius: 2, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Regional Assignment
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {user.regionId && (
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Region
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Region {user.regionId}
                    </Typography>
                  </Grid>
                )}
                
                {user.districtId && (
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      District
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      District {user.districtId}
                    </Typography>
                  </Grid>
                )}
                
                {user.circuitId && (
                  <Grid item xs={12} sm={4}>
                    <Typography variant="body2" color="text.secondary">
                      Circuit
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Circuit {user.circuitId}
                    </Typography>
                  </Grid>
                )}
                
                {!user.regionId && !user.districtId && !user.circuitId && (
                  <Grid item xs={12}>
                    <Typography variant="body1">
                      No regional assignment found.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Paper>
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