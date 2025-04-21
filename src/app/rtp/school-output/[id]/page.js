'use client';

import { useState, useEffect } from 'react';
import { 
  Typography, 
  Container, 
  Box, 
  TextField, 
  Button, 
  Card, 
  CardContent,
  Grid,
  Divider,
  Alert,
  LinearProgress,
  Paper
} from '@mui/material';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';

export default function SchoolOutputForm({ params }) {
  const itineraryId = params.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [schoolData, setSchoolData] = useState(null);
  const [formData, setFormData] = useState({
    maleTeacherChampions: '',
    femaleTeacherChampions: '',
    insetTrainings: '',
    maleTeachersPBL: '',
    femaleTeachersPBL: '',
    maleTeachersECE: '',
    femaleTeachersECE: '',
    maleTeachersOther: '',
    femaleTeachersOther: '',
    maleTeachersNoTraining: '',
    femaleTeachersNoTraining: '',
    boysEnrolled: '',
    girlsEnrolled: '',
    boysSpecialNeeds: '',
    girlsSpecialNeeds: '',
    mentoringVisits: '',
    maleTeacherTransfers: '',
    femaleTeacherTransfers: '',
  });
  
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Fetch itinerary details and initialize form
  useEffect(() => {
    if (isAuthenticated) {
      fetchItineraryDetails();
      fetchSchoolData();
    }
  }, [isAuthenticated, itineraryId]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Mock function to fetch itinerary details - will be replaced with actual API call
  const fetchItineraryDetails = async () => {
    // TODO: Replace with actual API call
    const mockItinerary = { 
      id: itineraryId, 
      title: `Term ${itineraryId} Collection`,
      startDate: '2025-01-15',
      endDate: '2025-05-15',
      status: 'active'
    };
    setItinerary(mockItinerary);
  };
  
  // Mock function to fetch school data - will be replaced with actual API call
  const fetchSchoolData = async () => {
    // TODO: Replace with actual API call
    const mockSchoolData = { 
      id: 123, 
      name: 'Accra Model School',
      district: 'Greater Accra',
      schoolType: 'GALOP'
    };
    setSchoolData(mockSchoolData);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Generate dummy data for testing
  const generateDummyData = () => {
    setFormData({
      maleTeacherChampions: '3',
      femaleTeacherChampions: '4',
      insetTrainings: '6',
      maleTeachersPBL: '5',
      femaleTeachersPBL: '7',
      maleTeachersECE: '2',
      femaleTeachersECE: '5',
      maleTeachersOther: '1',
      femaleTeachersOther: '2',
      maleTeachersNoTraining: '1',
      femaleTeachersNoTraining: '0',
      boysEnrolled: '120',
      girlsEnrolled: '135',
      boysSpecialNeeds: '3',
      girlsSpecialNeeds: '2',
      mentoringVisits: '8',
      maleTeacherTransfers: '1',
      femaleTeacherTransfers: '2',
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // TODO: Replace with actual API call
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log({
        itineraryId,
        schoolId: schoolData?.id,
        ...formData
      });
      
      setSubmitSuccess(true);
      // Reset after showing success message
      setTimeout(() => {
        router.push('/rtp');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading || !itinerary || !schoolData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
                {itinerary ? itinerary.title : `Itinerary ${itineraryId}`}
              </span>
              {' / '}
              <span style={{ marginLeft: '4px' }}>School Output Indicators</span>
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              School Output Indicators
            </Typography>
            
            <Button
              variant="outlined"
              color="secondary"
              onClick={generateDummyData}
            >
              Fill with Dummy Data
            </Button>
          </Box>
        </Box>
        
        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 4 }}>
            Form submitted successfully! Redirecting...
          </Alert>
        )}
        
        <Box sx={{ mb: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            You are submitting data for: <strong>{schoolData.name}</strong> in {schoolData.district} ({itinerary.title})
          </Alert>
        </Box>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Itinerary Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>Title:</strong> {itinerary.title}</Typography>
              <Typography variant="body1">
                <strong>Period:</strong> {new Date(itinerary.startDate).toLocaleDateString()} - {new Date(itinerary.endDate).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>School:</strong> {schoolData.name}</Typography>
              <Typography variant="body1"><strong>District:</strong> {schoolData.district}</Typography>
              <Typography variant="body1"><strong>Type:</strong> {schoolData.schoolType}</Typography>
            </Grid>
          </Grid>
        </Paper>
        
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Typography variant="h6" gutterBottom>Teacher Training Indicators</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of MALE Teacher Champions/Curriculum Leads trained"
                    name="maleTeacherChampions"
                    value={formData.maleTeacherChampions}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of FEMALE Teacher Champions/Curriculum Leads trained"
                    name="femaleTeacherChampions"
                    value={formData.femaleTeacherChampions}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Number of Trainings provided/organized this term through INSET"
                    name="insetTrainings"
                    value={formData.insetTrainings}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of MALE teachers trained in PBL"
                    name="maleTeachersPBL"
                    value={formData.maleTeachersPBL}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of FEMALE teachers trained in PBL"
                    name="femaleTeachersPBL"
                    value={formData.femaleTeachersPBL}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of MALE teachers trained in ECE"
                    name="maleTeachersECE"
                    value={formData.maleTeachersECE}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of FEMALE teachers trained in ECE"
                    name="femaleTeachersECE"
                    value={formData.femaleTeachersECE}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of MALE teachers trained in other forms"
                    name="maleTeachersOther"
                    value={formData.maleTeachersOther}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of FEMALE teachers trained in other forms"
                    name="femaleTeachersOther"
                    value={formData.femaleTeachersOther}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of MALE teachers who received no training"
                    name="maleTeachersNoTraining"
                    value={formData.maleTeachersNoTraining}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of FEMALE teachers who received no training"
                    name="femaleTeachersNoTraining"
                    value={formData.femaleTeachersNoTraining}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 4 }} />
              
              <Typography variant="h6" gutterBottom>Student Enrollment Indicators</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of BOYS enrolled"
                    name="boysEnrolled"
                    value={formData.boysEnrolled}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of GIRLS enrolled"
                    name="girlsEnrolled"
                    value={formData.girlsEnrolled}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of BOYS with Special Needs/disabilities"
                    name="boysSpecialNeeds"
                    value={formData.boysSpecialNeeds}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of GIRLS with Special Needs/disabilities"
                    name="girlsSpecialNeeds"
                    value={formData.girlsSpecialNeeds}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 4 }} />
              
              <Typography variant="h6" gutterBottom>Other Indicators</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    required
                    fullWidth
                    label="Number of coaching and mentoring support visits this term"
                    name="mentoringVisits"
                    value={formData.mentoringVisits}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of MALE teachers who went on transfer"
                    name="maleTeacherTransfers"
                    value={formData.maleTeacherTransfers}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    required
                    fullWidth
                    label="Number of FEMALE teachers who went on transfer"
                    name="femaleTeacherTransfers"
                    value={formData.femaleTeacherTransfers}
                    onChange={handleInputChange}
                    type="number"
                    inputProps={{ min: 0 }}
                    margin="normal"
                  />
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  color="primary" 
                  disabled={isSubmitting}
                  sx={{ minWidth: 150 }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Paper>
    </Container>
  );
}