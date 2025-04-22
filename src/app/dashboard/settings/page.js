'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Divider, 
  Button, 
  Switch,
  FormControl,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  Tabs,
  Tab,
  LinearProgress,
  Alert,
  Snackbar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Card,
  CardContent
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useProgramContext } from "@/context/ProgramContext";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { currentProgram } = useProgramContext();
  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Settings state - in a real app, this would be loaded from user preferences
  const [settings, setSettings] = useState({
    appearance: {
      theme: 'light',
      compactMode: false,
      highContrast: false,
      fontSize: 'medium',
    },
    notifications: {
      emailAlerts: true,
      submissionReminders: true,
      weeklyDigest: false,
      soundEffects: true
    },
    dashboard: {
      defaultView: 'overview',
      autoRefresh: true,
      refreshInterval: 5,
      showTips: true
    },
    dataPreferences: {
      exportFormat: 'xlsx',
      dateFormat: 'DD/MM/YYYY',
      defaultChart: 'bar'
    }
  });
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };
  
  const handleSaveSettings = () => {
    // In a real application, this would save to a database
    // For now, just show success message
    setSnackbar({
      open: true,
      message: 'Settings saved successfully!',
      severity: 'success'
    });
  };
  
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading settings...</Typography>
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
            Settings
          </Typography>
          
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSaveSettings}
          >
            Save Changes
          </Button>
        </Box>
        
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Appearance" />
          <Tab label="Notifications" />
          <Tab label="Dashboard" />
          <Tab label="Data & Privacy" />
        </Tabs>
        
        {/* Appearance Settings Tab */}
        {activeTab === 0 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Theme</Typography>
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="theme-select-label">Theme</InputLabel>
                      <Select
                        labelId="theme-select-label"
                        id="theme-select"
                        value={settings.appearance.theme}
                        label="Theme"
                        onChange={(e) => handleSettingChange('appearance', 'theme', e.target.value)}
                      >
                        <MenuItem value="light">Light Mode</MenuItem>
                        <MenuItem value="dark">Dark Mode</MenuItem>
                        <MenuItem value="system">Use System Settings</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>Font Size</Typography>
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="font-size-select-label">Font Size</InputLabel>
                      <Select
                        labelId="font-size-select-label"
                        id="font-size-select"
                        value={settings.appearance.fontSize}
                        label="Font Size"
                        onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
                      >
                        <MenuItem value="small">Small</MenuItem>
                        <MenuItem value="medium">Medium</MenuItem>
                        <MenuItem value="large">Large</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Display Options</Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.appearance.compactMode}
                            onChange={(e) => handleSettingChange('appearance', 'compactMode', e.target.checked)}
                          />
                        }
                        label="Compact Mode"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                        Reduce spacing between elements for more content per screen
                      </Typography>
                      
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.appearance.highContrast}
                            onChange={(e) => handleSettingChange('appearance', 'highContrast', e.target.checked)}
                          />
                        }
                        label="High Contrast Mode"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Increase contrast for better visibility
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Notifications Settings Tab */}
        {activeTab === 1 && (
          <Box>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Email Notifications</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ pl: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.emailAlerts}
                        onChange={(e) => handleSettingChange('notifications', 'emailAlerts', e.target.checked)}
                      />
                    }
                    label="Email Alerts"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Receive important alerts via email
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.submissionReminders}
                        onChange={(e) => handleSettingChange('notifications', 'submissionReminders', e.target.checked)}
                      />
                    }
                    label="Submission Reminders"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                    Get reminded about upcoming submission deadlines
                  </Typography>
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.weeklyDigest}
                        onChange={(e) => handleSettingChange('notifications', 'weeklyDigest', e.target.checked)}
                      />
                    }
                    label="Weekly Digest"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Receive a weekly summary of activities
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
            
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">In-App Notifications</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ pl: 2 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.notifications.soundEffects}
                        onChange={(e) => handleSettingChange('notifications', 'soundEffects', e.target.checked)}
                      />
                    }
                    label="Sound Effects"
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                    Play sound effects for notifications
                  </Typography>
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
        
        {/* Dashboard Settings Tab */}
        {activeTab === 2 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Dashboard Configuration</Typography>
                    
                    <FormControl fullWidth margin="normal">
                      <InputLabel id="default-view-select-label">Default Dashboard View</InputLabel>
                      <Select
                        labelId="default-view-select-label"
                        id="default-view-select"
                        value={settings.dashboard.defaultView}
                        label="Default Dashboard View"
                        onChange={(e) => handleSettingChange('dashboard', 'defaultView', e.target.value)}
                      >
                        <MenuItem value="overview">Overview</MenuItem>
                        <MenuItem value="submissions">Submissions</MenuItem>
                        <MenuItem value="analytics">Analytics</MenuItem>
                        <MenuItem value="reports">Reports</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <Box sx={{ mt: 3 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.dashboard.showTips}
                            onChange={(e) => handleSettingChange('dashboard', 'showTips', e.target.checked)}
                          />
                        }
                        label="Show Dashboard Tips"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                        Display helpful tips and information on the dashboard
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Auto-Refresh Settings</Typography>
                    
                    <Box sx={{ mt: 2 }}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={settings.dashboard.autoRefresh}
                            onChange={(e) => handleSettingChange('dashboard', 'autoRefresh', e.target.checked)}
                          />
                        }
                        label="Auto-Refresh Dashboard"
                      />
                      <Typography variant="body2" color="text.secondary" sx={{ ml: 4, mb: 2 }}>
                        Periodically refresh dashboard data
                      </Typography>
                    </Box>
                    
                    <FormControl fullWidth margin="normal" disabled={!settings.dashboard.autoRefresh}>
                      <InputLabel id="refresh-interval-select-label">Refresh Interval (minutes)</InputLabel>
                      <Select
                        labelId="refresh-interval-select-label"
                        id="refresh-interval-select"
                        value={settings.dashboard.refreshInterval}
                        label="Refresh Interval (minutes)"
                        onChange={(e) => handleSettingChange('dashboard', 'refreshInterval', e.target.value)}
                      >
                        <MenuItem value={1}>1 minute</MenuItem>
                        <MenuItem value={5}>5 minutes</MenuItem>
                        <MenuItem value={10}>10 minutes</MenuItem>
                        <MenuItem value={30}>30 minutes</MenuItem>
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Data & Privacy Settings Tab */}
        {activeTab === 3 && (
          <Box>
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>Data Export Preferences</Typography>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel id="export-format-select-label">Default Export Format</InputLabel>
                  <Select
                    labelId="export-format-select-label"
                    id="export-format-select"
                    value={settings.dataPreferences.exportFormat}
                    label="Default Export Format"
                    onChange={(e) => handleSettingChange('dataPreferences', 'exportFormat', e.target.value)}
                  >
                    <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
                    <MenuItem value="csv">CSV</MenuItem>
                    <MenuItem value="pdf">PDF</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel id="date-format-select-label">Date Format</InputLabel>
                  <Select
                    labelId="date-format-select-label"
                    id="date-format-select"
                    value={settings.dataPreferences.dateFormat}
                    label="Date Format"
                    onChange={(e) => handleSettingChange('dataPreferences', 'dateFormat', e.target.value)}
                  >
                    <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                    <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                    <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                  </Select>
                </FormControl>
                
                <FormControl fullWidth margin="normal">
                  <InputLabel id="default-chart-select-label">Default Chart Type</InputLabel>
                  <Select
                    labelId="default-chart-select-label"
                    id="default-chart-select"
                    value={settings.dataPreferences.defaultChart}
                    label="Default Chart Type"
                    onChange={(e) => handleSettingChange('dataPreferences', 'defaultChart', e.target.value)}
                  >
                    <MenuItem value="bar">Bar Chart</MenuItem>
                    <MenuItem value="line">Line Chart</MenuItem>
                    <MenuItem value="pie">Pie Chart</MenuItem>
                  </Select>
                </FormControl>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent>
                <Typography variant="h6" color="error" gutterBottom>Danger Zone</Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body1" gutterBottom>Download Your Data</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Download a copy of all your data and submissions from the system
                    </Typography>
                    <Button variant="outlined" color="primary" size="small">
                      Export My Data
                    </Button>
                  </Grid>
                  
                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Typography variant="body1" gutterBottom>Clear Cache</Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Clear all locally cached data and preferences
                    </Typography>
                    <Button variant="outlined" color="warning" size="small">
                      Clear Cache
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}
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