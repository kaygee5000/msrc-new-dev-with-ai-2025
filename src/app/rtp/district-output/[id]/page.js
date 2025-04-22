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
  Tooltip,
  Breadcrumbs
} from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useProgramContext } from "@/context/ProgramContext";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Link from 'next/link';

export default function DistrictOutputEditPage() {
  const { data: session, status } = useSession();
  const { currentProgram } = useProgramContext();
  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isRtpAuthorized = user?.programRoles?.some(pr => pr.program_code === "rtp") || false;
  
  const router = useRouter();
  const params = useParams();
  const itineraryId = params.id;
  
  // Form state
  const [formData, setFormData] = useState({
    district_id: '',
    itinerary_id: itineraryId,
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
  const [itinerary, setItinerary] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Load districts and itinerary details
  useEffect(() => {
    const fetchData = async () => {
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
        
        const itineraryResponse = {
          id: itineraryId,
          name: `Itinerary ${itineraryId}`,
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          status: 'active'
        };
        
        // You would also load the existing form data here if editing
        // const existingSubmissionResponse = await fetch(`/api/rtp/output/district/${itineraryId}`);
        // const existingData = await existingSubmissionResponse.json();
        // setFormData({...existingData});
        
        setDistricts(districtsResponse);
        setItinerary(itineraryResponse);
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && itineraryId) {
      fetchData();
    }
  }, [isAuthenticated, itineraryId]);
  
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
      
      // Redirect back to main RTP page after success
      setTimeout(() => {
        router.push('/rtp');
      }, 1500);
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
  
  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  const generateDummyData = () => {
    setFormData({
      district_id: '1',
      itinerary_id: itineraryId,
      supportedTeamsCount: '5',
      trainingsProvidedCount: '3',
      teamMembersTrainedCount: '20',
      districtsWithCoachingPlansCount: '2',
      dtstTrainedCount: '4',
      dtstMembersTrainedMale: '10',
      dtstMembersTrainedFemale: '10',
      districtsWithFinancialSupportCount: '1',
      quarterlyMeetingsCount: '2',
      officialsMaleCount: '15',
      officialsFemaleCount: '10',
      schoolsVisitedCount: '25',
      trainersTrainedCount: '5',
      nationalMeetingsCount: '1',
      nationalMeetingAttendeesPolicyMakers: '3',
      nationalMeetingAttendeesGesOfficials: '5',
      nationalMeetingAttendeesOther: '2',
    });
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
        <Box sx={{ mb: 4 }}>
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
              <span style={{ marginLeft: '4px' }}>
                {itinerary ? itinerary.name : `Itinerary ${itineraryId}`}
              </span>
              {' / '}
              <span style={{ marginLeft: '4px' }}>District Output Indicators</span>
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              District Output Indicators
            </Typography>
            
            <Tooltip title="Fill with test data (development only)">
              <Button
                variant="outlined"
                color="secondary"
                onClick={generateDummyData}
              >
                Fill with Dummy Data
              </Button>
            </Tooltip>
          </Box>
        </Box>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Please provide the following district-level output indicators for Right to Play implementation.
        </Typography>
        
        {itinerary && (
          <Alert severity="info" sx={{ mb: 3 }}>
            You are submitting data for itinerary: <strong>{itinerary.name}</strong> ({itinerary.start_date} to {itinerary.end_date})
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                District Selection
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
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
                    label="Number of District teacher support teams supported"
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
                    label="Number of district support teams' members trained"
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
                    label="Number of District Teacher Support Teams trained"
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
                    name="dtstMembersTrainedFemale"
                    value={formData.dtstMembersTrainedFemale}
                    onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => router.push('/rtp')}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </Button>
            
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