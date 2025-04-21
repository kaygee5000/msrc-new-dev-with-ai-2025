'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  Grid,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Breadcrumbs,
  IconButton,
  Snackbar,
  Tooltip
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SaveIcon from '@mui/icons-material/Save';
import HomeIcon from '@mui/icons-material/Home';
import TuneIcon from '@mui/icons-material/Tune';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import InfoIcon from '@mui/icons-material/Info';
import BuildIcon from '@mui/icons-material/Build';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function RTPSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    generalSettings: {
      defaultResponseWindow: 14,
      emailNotifications: true,
      reminderFrequency: 3,
      automaticArchiving: true,
    },
    schoolOutputIndicators: {
      enabled: true,
      requiredFields: ['student_attendance', 'teacher_attendance', 'sports_activities'],
      minSubmissionsRequired: 1
    },
    districtOutputIndicators: {
      enabled: true,
      requiredFields: ['budget_allocation', 'implementation_status'],
      minSubmissionsRequired: 1
    },
    consolidatedChecklist: {
      enabled: true,
      requiredFields: ['training_completed', 'resources_available'],
      minSubmissionsRequired: 1
    },
    partnersInPlay: {
      enabled: true,
      requiredFields: ['partner_type', 'contribution_type', 'participation_level'],
      minSubmissionsRequired: 1
    }
  });

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        // In a real implementation, fetch settings from API
        // const response = await fetch('/api/rtp/settings');
        // const data = await response.json();
        // setSettings(data.settings);
        
        // For now, we just simulate loading
        setTimeout(() => {
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error(err);
        setError('Failed to load settings');
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);

  const handleSettingChange = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError(null);
    
    try {
      // In a real implementation, save to API
      // await fetch('/api/rtp/settings', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ settings })
      // });
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSnackbar({
        open: true,
        message: 'Settings saved successfully',
        severity: 'success'
      });
    } catch (err) {
      console.error(err);
      setError('Failed to save settings');
      setSnackbar({
        open: true,
        message: 'Failed to save settings',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Link href="/dashboard/admin/rtp" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <SportsSoccerIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Right to Play
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <TuneIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Configuration
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <TuneIcon sx={{ mr: 2, fontSize: 35, color: 'primary.main' }} />
          RTP Configuration
        </Typography>
        <Box>
          <Button 
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            component={Link}
            href="/dashboard/admin/rtp"
            sx={{ mr: 2 }}
          >
            Back to Overview
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<SaveIcon />}
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* General Settings */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h5" component="h2" gutterBottom>
                General Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure general RTP settings that apply to all categories and itineraries.
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Default Response Window (days)"
                    type="number"
                    fullWidth
                    value={settings.generalSettings.defaultResponseWindow}
                    onChange={(e) => handleSettingChange('generalSettings', 'defaultResponseWindow', parseInt(e.target.value))}
                    InputProps={{
                      endAdornment: (
                        <Tooltip title="The default number of days schools have to respond to an itinerary">
                          <InfoIcon color="action" sx={{ ml: 1 }} />
                        </Tooltip>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Reminder Frequency</InputLabel>
                    <Select
                      value={settings.generalSettings.reminderFrequency}
                      onChange={(e) => handleSettingChange('generalSettings', 'reminderFrequency', e.target.value)}
                      label="Reminder Frequency"
                    >
                      <MenuItem value={1}>Daily</MenuItem>
                      <MenuItem value={3}>Every 3 days</MenuItem>
                      <MenuItem value={7}>Weekly</MenuItem>
                      <MenuItem value={0}>No reminders</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.generalSettings.emailNotifications}
                        onChange={(e) => handleSettingChange('generalSettings', 'emailNotifications', e.target.checked)}
                      />
                    }
                    label="Enable Email Notifications"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.generalSettings.automaticArchiving}
                        onChange={(e) => handleSettingChange('generalSettings', 'automaticArchiving', e.target.checked)}
                      />
                    }
                    label="Automatically Archive Completed Itineraries"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>
          
          {/* Category Settings */}
          <Grid item xs={12}>
            <Typography variant="h5" component="h2" gutterBottom>
              Category Settings
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure settings for each RTP category.
            </Typography>
            
            {/* School Output Indicators */}
            <Accordion defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">School Output Indicators</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.schoolOutputIndicators.enabled}
                          onChange={(e) => handleSettingChange('schoolOutputIndicators', 'enabled', e.target.checked)}
                        />
                      }
                      label="Enable School Output Indicators"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Minimum Submissions Required"
                      type="number"
                      fullWidth
                      value={settings.schoolOutputIndicators.minSubmissionsRequired}
                      onChange={(e) => handleSettingChange('schoolOutputIndicators', 'minSubmissionsRequired', parseInt(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Required Fields
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {['student_attendance', 'teacher_attendance', 'sports_activities', 'equipment_usage', 'student_engagement'].map(field => (
                        <FormControlLabel
                          key={field}
                          control={
                            <Switch
                              size="small"
                              checked={settings.schoolOutputIndicators.requiredFields.includes(field)}
                              onChange={(e) => {
                                const currentFields = settings.schoolOutputIndicators.requiredFields;
                                const newFields = e.target.checked
                                  ? [...currentFields, field]
                                  : currentFields.filter(f => f !== field);
                                handleSettingChange('schoolOutputIndicators', 'requiredFields', newFields);
                              }}
                            />
                          }
                          label={field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        />
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
            
            {/* District Output Indicators */}
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">District Output Indicators</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.districtOutputIndicators.enabled}
                          onChange={(e) => handleSettingChange('districtOutputIndicators', 'enabled', e.target.checked)}
                        />
                      }
                      label="Enable District Output Indicators"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Minimum Submissions Required"
                      type="number"
                      fullWidth
                      value={settings.districtOutputIndicators.minSubmissionsRequired}
                      onChange={(e) => handleSettingChange('districtOutputIndicators', 'minSubmissionsRequired', parseInt(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Required Fields
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {['budget_allocation', 'implementation_status', 'district_coordination', 'monitoring_visits', 'resource_distribution'].map(field => (
                        <FormControlLabel
                          key={field}
                          control={
                            <Switch
                              size="small"
                              checked={settings.districtOutputIndicators.requiredFields.includes(field)}
                              onChange={(e) => {
                                const currentFields = settings.districtOutputIndicators.requiredFields;
                                const newFields = e.target.checked
                                  ? [...currentFields, field]
                                  : currentFields.filter(f => f !== field);
                                handleSettingChange('districtOutputIndicators', 'requiredFields', newFields);
                              }}
                            />
                          }
                          label={field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        />
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
            
            {/* Consolidated Checklist */}
            <Accordion sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Consolidated Checklist</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.consolidatedChecklist.enabled}
                          onChange={(e) => handleSettingChange('consolidatedChecklist', 'enabled', e.target.checked)}
                        />
                      }
                      label="Enable Consolidated Checklist"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Minimum Submissions Required"
                      type="number"
                      fullWidth
                      value={settings.consolidatedChecklist.minSubmissionsRequired}
                      onChange={(e) => handleSettingChange('consolidatedChecklist', 'minSubmissionsRequired', parseInt(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Required Fields
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {['training_completed', 'resources_available', 'implementation_plan', 'monitoring_mechanism', 'stakeholder_engagement'].map(field => (
                        <FormControlLabel
                          key={field}
                          control={
                            <Switch
                              size="small"
                              checked={settings.consolidatedChecklist.requiredFields.includes(field)}
                              onChange={(e) => {
                                const currentFields = settings.consolidatedChecklist.requiredFields;
                                const newFields = e.target.checked
                                  ? [...currentFields, field]
                                  : currentFields.filter(f => f !== field);
                                handleSettingChange('consolidatedChecklist', 'requiredFields', newFields);
                              }}
                            />
                          }
                          label={field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        />
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
            
            {/* Partners in Play */}
            <Accordion sx={{ mb: 4 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">Partners in Play</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={settings.partnersInPlay.enabled}
                          onChange={(e) => handleSettingChange('partnersInPlay', 'enabled', e.target.checked)}
                        />
                      }
                      label="Enable Partners in Play"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Minimum Submissions Required"
                      type="number"
                      fullWidth
                      value={settings.partnersInPlay.minSubmissionsRequired}
                      onChange={(e) => handleSettingChange('partnersInPlay', 'minSubmissionsRequired', parseInt(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Required Fields
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      {['partner_type', 'contribution_type', 'participation_level', 'engagement_frequency', 'resource_commitment'].map(field => (
                        <FormControlLabel
                          key={field}
                          control={
                            <Switch
                              size="small"
                              checked={settings.partnersInPlay.requiredFields.includes(field)}
                              onChange={(e) => {
                                const currentFields = settings.partnersInPlay.requiredFields;
                                const newFields = e.target.checked
                                  ? [...currentFields, field]
                                  : currentFields.filter(f => f !== field);
                                handleSettingChange('partnersInPlay', 'requiredFields', newFields);
                              }}
                            />
                          }
                          label={field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        />
                      ))}
                    </Stack>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
          
          {/* Advanced Settings */}
          <Grid item xs={12}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BuildIcon sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="h5" component="h2">
                  Advanced Settings
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                These settings require technical knowledge and can affect system performance.
              </Typography>
              <Alert severity="warning" sx={{ mb: 3 }}>
                Changes to these settings may require system restart and can affect data integrity. 
                Proceed with caution.
              </Alert>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch />
                    }
                    label="Enable Development Mode"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch />
                    }
                    label="Allow Bulk Data Import"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth disabled>
                    <InputLabel>Data Retention Period</InputLabel>
                    <Select
                      value={365}
                      label="Data Retention Period"
                    >
                      <MenuItem value={90}>90 days</MenuItem>
                      <MenuItem value={180}>180 days</MenuItem>
                      <MenuItem value={365}>1 year</MenuItem>
                      <MenuItem value={730}>2 years</MenuItem>
                      <MenuItem value={0}>Indefinite</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Button variant="outlined" color="warning" fullWidth>
                    Reset to Default Settings
                  </Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Container>
  );
}