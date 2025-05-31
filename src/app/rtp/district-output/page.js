'use client';

import { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  TextField, 
  Button, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { useProgramContext } from "@/context/ProgramContext";

export default function DistrictOutputForm() {
  const { data: session, status } = useSession();
const { currentProgram } = useProgramContext();
const user = session?.user;
const isAuthenticated = status === "authenticated";
const isLoading = status === "loading";
  const router = useRouter();
  
  // Form state
  const [formData, setFormData] = useState({
    district_id: '',
    itinerary_id: '',
    supportedTeamsCount: '',
    trainingsProvidedCount: '',
    teamMembersTrainedCount: '',
    districtsWithCoachingPlansCount: '',
    dtstTrainedCount: '',
    dtstMembersTrainedMale: '',
    dtstMembersTrainedFemale: '',
    districtsWithFinancialSupportCount: '',
    quarterlyMeetingsCount: '',
    officialsMaleCount: '',
    officialsFemaleCount: '',
    schoolsVisitedCount: '',
    trainersTrainedCount: '',
    nationalMeetingsCount: '',
    nationalMeetingAttendeesPolicyMakers: '',
    nationalMeetingAttendeesGesOfficials: '',
    nationalMeetingAttendeesOther: '',
  });
  
  // Options for selects
  const [districts, setDistricts] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Load districts and itineraries
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        // These would be actual API calls in production
        // For now using mock data
        const districtsResponse = [
          { id: 1, name: 'Accra Metro' },
          { id: 2, name: 'Tema Metro' },
          { id: 3, name: 'Ga East' },
          { id: 4, name: 'Ga West' },
          { id: 5, name: 'Adentan Municipal' },
        ];
        
        const itinerariesResponse = [
          { id: 1, name: 'Q1 2025 Data Collection', start_date: '2025-01-01', end_date: '2025-03-31' },
          { id: 2, name: 'Q2 2025 Data Collection', start_date: '2025-04-01', end_date: '2025-06-30' },
        ];
        
        setDistricts(districtsResponse);
        setItineraries(itinerariesResponse);
      } catch (error) {
        console.error('Error fetching options:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load form options',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchOptions();
    }
  }, [isAuthenticated]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // This would be an actual API call in production
      // For now just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate successful submission
      setSnackbar({
        open: true,
        message: 'District output data saved successfully!',
        severity: 'success'
      });
      
      // Clear the form
      setFormData({
        district_id: '',
        itinerary_id: '',
        supportedTeamsCount: '',
        trainingsProvidedCount: '',
        teamMembersTrainedCount: '',
        districtsWithCoachingPlansCount: '',
        dtstTrainedCount: '',
        dtstMembersTrainedMale: '',
        dtsmMembersTrainedFemale: '',
        districtsWithFinancialSupportCount: '',
        quarterlyMeetingsCount: '',
        officialsMaleCount: '',
        officialsFemaleCount: '',
        schoolsVisitedCount: '',
        trainersTrainedCount: '',
        nationalMeetingsCount: '',
        nationalMeetingAttendeesPolicyMakers: '',
        nationalMeetingAttendeesGesOfficials: '',
        nationalMeetingAttendeesOther: '',
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save district output data',
        severity: 'error'
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Generate random data for all fields
  const generateDummyData = () => {
    if (districts.length === 0 || itineraries.length === 0) {
      setSnackbar({
        open: true,
        message: 'Cannot generate data: options not loaded yet',
        severity: 'warning'
      });
      return;
    }
    
    // Random district and itinerary
    const randomDistrict = districts[Math.floor(Math.random() * districts.length)].id;
    const randomItinerary = itineraries[Math.floor(Math.random() * itineraries.length)].id;
    
    // Generate random numbers for all numeric fields
    const randomData = {
      district_id: randomDistrict.toString(),
      itinerary_id: randomItinerary.toString(),
      supportedTeamsCount: Math.floor(Math.random() * 10) + 1,
      trainingsProvidedCount: Math.floor(Math.random() * 20) + 1,
      teamMembersTrainedCount: Math.floor(Math.random() * 100) + 1,
      districtsWithCoachingPlansCount: Math.floor(Math.random() * 5) + 1,
      dtstTrainedCount: Math.floor(Math.random() * 15) + 1,
      dtstMembersTrainedMale: Math.floor(Math.random() * 30) + 1,
      dtsmMembersTrainedFemale: Math.floor(Math.random() * 30) + 1,
      districtsWithFinancialSupportCount: Math.floor(Math.random() * 5) + 1,
      quarterlyMeetingsCount: Math.floor(Math.random() * 4) + 1,
      officialsMaleCount: Math.floor(Math.random() * 50) + 1,
      officialsFemaleCount: Math.floor(Math.random() * 50) + 1,
      schoolsVisitedCount: Math.floor(Math.random() * 200) + 1,
      trainersTrainedCount: Math.floor(Math.random() * 40) + 1,
      nationalMeetingsCount: Math.floor(Math.random() * 5) + 1,
      nationalMeetingAttendeesPolicyMakers: Math.floor(Math.random() * 20) + 1,
      nationalMeetingAttendeesGesOfficials: Math.floor(Math.random() * 30) + 1,
      nationalMeetingAttendeesOther: Math.floor(Math.random() * 15) + 1,
    };
    
    setFormData(randomData);
    
    setSnackbar({
      open: true,
      message: 'Random data generated',
      severity: 'info'
    });
  };
  
  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  if (isLoading || loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading form...</Typography>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Typography 
                component="span" 
                variant="body2" 
                sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}
              >
                <Button 
                  onClick={() => router.push('/rtp')} 
                  sx={{ minWidth: 'auto', p: 0, mr: 1, color: 'text.secondary', textTransform: 'none' }}
                >
                  RTP
                </Button>
                {' / '}
                <span style={{ marginLeft: '4px' }}>District Output Indicators</span>
              </Typography>
            </Box>
            <Typography variant="h4" component="h1" gutterBottom>
              District Output Indicators
            </Typography>
          </Box>
          
          <Tooltip title="Generate random data">
            <IconButton 
              color="primary" 
              onClick={generateDummyData}
              disabled={saving || districts.length === 0 || itineraries.length === 0}
            >
              <AutorenewIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Please provide the following district-level output indicators for Right to Play implementation.
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                District & Itinerary Selection
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="district-select-label">District</InputLabel>
                    <Select
                      labelId="district-select-label"
                      id="district_id"
                      name="district_id"
                      value={formData.district_id}
                      onChange={handleChange}
                      label="District"
                    >
                      {districts.map(district => (
                        <MenuItem key={district.id} value={district.id.toString()}>
                          {district.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="itinerary-select-label">Itinerary</InputLabel>
                    <Select
                      labelId="itinerary-select-label"
                      id="itinerary_id"
                      name="itinerary_id"
                      value={formData.itinerary_id}
                      onChange={handleChange}
                      label="Itinerary"
                    >
                      {itineraries.map(itinerary => (
                        <MenuItem key={itinerary.id} value={itinerary.id.toString()}>
                          {itinerary.name} ({itinerary.start_date} to {itinerary.end_date})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                District Support Teams
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of District teacher support teams supported to develop training plans"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="supportedTeamsCount"
                    value={formData.supportedTeamsCount}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of trainings provided to District teacher support teams"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="trainingsProvidedCount"
                    value={formData.trainingsProvidedCount}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of district support teams' members trained with RTP staff support"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="teamMembersTrainedCount"
                    value={formData.teamMembersTrainedCount}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of Districts with coaching and mentoring plans"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="districtsWithCoachingPlansCount"
                    value={formData.districtsWithCoachingPlansCount}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                District Teacher Support Teams (DTST)
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Number of District Teacher Support Teams (DST) trained"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="dtstTrainedCount"
                    value={formData.dtstTrainedCount}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Number of DTST members trained - Male"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="dtstMembersTrainedMale"
                    value={formData.dtstMembersTrainedMale}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Number of DTST members trained - Female"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="dtsmMembersTrainedFemale"
                    value={formData.dtsmMembersTrainedFemale}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of districts with financial support for coaching activities"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="districtsWithFinancialSupportCount"
                    value={formData.districtsWithFinancialSupportCount}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of Trainers from District Support Teams trained on LtP integration"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="trainersTrainedCount"
                    value={formData.trainersTrainedCount}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                District Planning and Monitoring
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of Quarterly district planning and review meetings"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="quarterlyMeetingsCount"
                    value={formData.quarterlyMeetingsCount}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of schools visited in each quarter"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="schoolsVisitedCount"
                    value={formData.schoolsVisitedCount}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of district officials attending planning meetings - Male"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="officialsMaleCount"
                    value={formData.officialsMaleCount}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of district officials attending planning meetings - Female"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="officialsFemaleCount"
                    value={formData.officialsFemaleCount}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                National Level Engagement
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of national level GES meetings"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="nationalMeetingsCount"
                    value={formData.nationalMeetingsCount}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of people attending national meetings - Policy Makers"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="nationalMeetingAttendeesPolicyMakers"
                    value={formData.nationalMeetingAttendeesPolicyMakers}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of people attending national meetings - GES Officials"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="nationalMeetingAttendeesGesOfficials"
                    value={formData.nationalMeetingAttendeesGesOfficials}
                    onChange={handleChange}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Number of people attending national meetings - Other"
                    type="number"
                    InputProps={{ inputProps: { min: 0 } }}
                    name="nationalMeetingAttendeesOther"
                    value={formData.nationalMeetingAttendeesOther}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={saving}
              sx={{ minWidth: 150 }}
            >
              {saving ? 'Saving...' : 'Submit Data'}
            </Button>
          </Box>
        </form>
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
