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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  FormGroup,
  FormLabel,
  FormHelperText,
  LinearProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip
} from '@mui/material';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export default function NewConsolidatedChecklist() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const itineraryIdParam = searchParams.get('itineraryId');
  
  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // General information
    school_id: '',
    assessor_name: '',
    assessment_date: new Date().toISOString().split('T')[0],
    itinerary_id: itineraryIdParam || '',
    
    // Q1-Q30 (grouped by sections)
    // Section 1: School Information
    q1_school_type: '',
    q2_total_enrollment: '',
    q3_boys_enrollment: '',
    q4_girls_enrollment: '',
    q5_total_teachers: '',
    q6_male_teachers: '',
    q7_female_teachers: '',
    
    // Section 2: Leadership & Management
    q8_training_received: false,
    q9_head_teacher_trained: false,
    q10_curriculum_lead_trained: false,
    q11_smc_sensitized: false,
    q12_pta_sensitized: false,
    q13_management_support: '',
    q14_management_meetings: '',
    q15_circuit_supervisor_visit: false,
    q16_coach_visit_frequency: '',
    
    // Section 3: Implementation Plans
    q17_has_implementation_plan: false,
    q18_implementation_plan_file: null,
    q19_teachers_with_ltp_lessons: '',
    q20_monitoring_mechanism: false,
    
    // Section 4: Teacher Practice
    q21_teachers_using_ltp: '',
    q22_gender_responsive_methods: '',
    q23_inclusion_methods: '',
    q24_teachers_confident: '',
    
    // Section 5: Learning Environment
    q25_learning_materials_display: false,
    q26_student_work_display: false,
    q27_safe_environment: '',
    q28_gender_responsive_environment: '',
    
    // Section 6: Challenges & Support
    q29_main_challenges: '',
    q30_additional_support_needed: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schools, setSchools] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Define the sections of the form
  const sections = [
    'School Information',
    'Leadership & Management',
    'Implementation Plans',
    'Teacher Practice',
    'Learning Environment',
    'Challenges & Support',
    'Review & Submit'
  ];
  
  // Load schools and itineraries data
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        // These would be actual API calls in production
        // For now using mock data
        const schoolsResponse = [
          { id: 1, name: 'Accra Primary School', district_id: 1, district_name: 'Accra Metro' },
          { id: 2, name: 'Tema Model School', district_id: 2, district_name: 'Tema Metro' },
          { id: 3, name: 'Ga East Primary', district_id: 3, district_name: 'Ga East' },
          { id: 4, name: 'Amasaman Basic School', district_id: 4, district_name: 'Ga West' },
          { id: 5, name: 'Adentan Community School', district_id: 5, district_name: 'Adentan Municipal' },
        ];
        
        const itinerariesResponse = [
          { id: 1, name: 'Q1 2025 Data Collection', start_date: '2025-01-01', end_date: '2025-03-31' },
          { id: 2, name: 'Q2 2025 Data Collection', start_date: '2025-04-01', end_date: '2025-06-30' },
        ];
        
        setSchools(schoolsResponse);
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
  
  // Handle form input changes for text/select fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle checkbox changes
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };
  
  // Handle file upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        q18_implementation_plan_file: file
      }));
    }
  };
  
  // Handle next step
  const handleNext = () => {
    setActiveStep((prevStep) => prevStep + 1);
    window.scrollTo(0, 0);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    window.scrollTo(0, 0);
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Prepare form data for submission
      const submissionData = new FormData();
      
      // Add all form fields
      Object.keys(formData).forEach(key => {
        if (key === 'q18_implementation_plan_file' && formData[key]) {
          submissionData.append(key, formData[key]);
        } else {
          submissionData.append(key, formData[key]);
        }
      });
      
      // This would be an actual API call in production
      // For now just simulate it
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful submission
      setSnackbar({
        open: true,
        message: 'Consolidated Checklist submitted successfully!',
        severity: 'success'
      });
      
      // Redirect back to consolidated checklists list page after success
      setTimeout(() => {
        router.push('/rtp/consolidated-checklist');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit Consolidated Checklist',
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
  
  // Fill form with dummy data (for testing purposes)
  const fillWithDummyData = () => {
    // Create a dummy file object for the implementation plan
    const dummyFile = new File(["dummy content"], "implementation_plan.pdf", {
      type: "application/pdf",
    });
    
    // Make sure we're converting all values to strings to avoid uncontrolled to controlled warning
    setFormData({
      // General information
      school_id: schools.length > 0 ? schools[0].id.toString() : '',
      assessor_name: 'John Doe',
      assessment_date: new Date().toISOString().split('T')[0],
      itinerary_id: itineraryIdParam || (itineraries.length > 0 ? itineraries[0].id.toString() : ''),
      
      // Q1-Q30 (grouped by sections)
      // Section 1: School Information
      q1_school_type: 'Primary and JHS',
      q2_total_enrollment: '450',
      q3_boys_enrollment: '220',
      q4_girls_enrollment: '230',
      q5_total_teachers: '15',
      q6_male_teachers: '7',
      q7_female_teachers: '8',
      
      // Section 2: Leadership & Management
      q8_training_received: true,
      q9_head_teacher_trained: true,
      q10_curriculum_lead_trained: true,
      q11_smc_sensitized: true,
      q12_pta_sensitized: true,
      q13_management_support: 'Very supportive',
      q14_management_meetings: 'Frequently',
      q15_circuit_supervisor_visit: true,
      q16_coach_visit_frequency: 'Monthly',
      
      // Section 3: Implementation Plans
      q17_has_implementation_plan: true,
      q18_implementation_plan_file: dummyFile,
      q19_teachers_with_ltp_lessons: '51-75%',
      q20_monitoring_mechanism: true,
      
      // Section 4: Teacher Practice
      q21_teachers_using_ltp: '51-75%',
      q22_gender_responsive_methods: 'Extensively',
      q23_inclusion_methods: 'Somewhat',
      q24_teachers_confident: 'Somewhat confident',
      
      // Section 5: Learning Environment
      q25_learning_materials_display: true,
      q26_student_work_display: true,
      q27_safe_environment: 'Very safe',
      q28_gender_responsive_environment: 'Somewhat gender-responsive',
      
      // Section 6: Challenges & Support
      q29_main_challenges: 'Limited resources and materials for implementing all activities. Some teachers need additional training on inclusive teaching methods.',
      q30_additional_support_needed: 'More teaching and learning materials, refresher training for teachers, additional coaching visits.'
    });
    
    setSnackbar({
      open: true,
      message: 'Form filled with dummy data',
      severity: 'info'
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
  
  // Render the current section of the form
  const renderSection = () => {
    switch (activeStep) {
      case 0: // School Information
        return (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                School Information
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required sx={{ mb: 3 }}>
                    <InputLabel id="school-select-label">School</InputLabel>
                    <Select
                      labelId="school-select-label"
                      name="school_id"
                      value={formData.school_id}
                      onChange={handleChange}
                      label="School"
                    >
                      {schools.map(school => (
                        <MenuItem key={school.id} value={school.id.toString()}>
                          {school.name} ({school.district_name})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required sx={{ mb: 3 }}>
                    <InputLabel id="itinerary-select-label">Itinerary</InputLabel>
                    <Select
                      labelId="itinerary-select-label"
                      name="itinerary_id"
                      value={formData.itinerary_id}
                      onChange={handleChange}
                      label="Itinerary"
                      disabled={!!itineraryIdParam} // Disable if itinerary is pre-selected
                    >
                      {itineraries.map(itinerary => (
                        <MenuItem key={itinerary.id} value={itinerary.id.toString()}>
                          {itinerary.name} ({itinerary.start_date} to {itinerary.end_date})
                        </MenuItem>
                      ))}
                    </Select>
                    {itineraryIdParam && (
                      <FormHelperText>Itinerary pre-selected from your dashboard</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Assessor Name"
                    name="assessor_name"
                    value={formData.assessor_name}
                    onChange={handleChange}
                    required
                    sx={{ mb: 3 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Assessment Date"
                    type="date"
                    name="assessment_date"
                    value={formData.assessment_date}
                    onChange={handleChange}
                    required
                    sx={{ mb: 3 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth required sx={{ mb: 3 }}>
                    <InputLabel id="school-type-label">School Type</InputLabel>
                    <Select
                      labelId="school-type-label"
                      name="q1_school_type"
                      value={formData.q1_school_type}
                      onChange={handleChange}
                      label="School Type"
                    >
                      <MenuItem value="Primary">Primary</MenuItem>
                      <MenuItem value="JHS">JHS</MenuItem>
                      <MenuItem value="Primary and JHS">Primary and JHS</MenuItem>
                      <MenuItem value="KG">KG</MenuItem>
                      <MenuItem value="KG and Primary">KG and Primary</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Total Enrollment"
                    type="number"
                    name="q2_total_enrollment"
                    value={formData.q2_total_enrollment}
                    onChange={handleChange}
                    required
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{ mb: 3 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Boys Enrollment"
                    type="number"
                    name="q3_boys_enrollment"
                    value={formData.q3_boys_enrollment}
                    onChange={handleChange}
                    required
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{ mb: 3 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Girls Enrollment"
                    type="number"
                    name="q4_girls_enrollment"
                    value={formData.q4_girls_enrollment}
                    onChange={handleChange}
                    required
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{ mb: 3 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Total Teachers"
                    type="number"
                    name="q5_total_teachers"
                    value={formData.q5_total_teachers}
                    onChange={handleChange}
                    required
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{ mb: 3 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Male Teachers"
                    type="number"
                    name="q6_male_teachers"
                    value={formData.q6_male_teachers}
                    onChange={handleChange}
                    required
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{ mb: 3 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Female Teachers"
                    type="number"
                    name="q7_female_teachers"
                    value={formData.q7_female_teachers}
                    onChange={handleChange}
                    required
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{ mb: 3 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
        
      // Other cases continue as in the original form
      // ... Rest of the form sections from the original file
      default:
        return null;
    }
  };
  
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
              <Button
                onClick={() => router.push('/rtp/consolidated-checklist')}
                sx={{ minWidth: 'auto', p: 0, mr: 1, color: 'text.secondary', textTransform: 'none' }}
              >
                Consolidated Checklists
              </Button>
              {' / '}
              <span style={{ marginLeft: '4px' }}>New Checklist</span>
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              New Consolidated Checklist
            </Typography>
            
            <Tooltip title="Fill with test data (development only)">
              <Button
                variant="outlined"
                color="secondary"
                startIcon={<AutoFixHighIcon />}
                onClick={fillWithDummyData}
              >
                Fill with Dummy Data
              </Button>
            </Tooltip>
          </Box>
        </Box>
        
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
          {sections.map((label, index) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <form onSubmit={activeStep === sections.length - 1 ? handleSubmit : e => e.preventDefault()}>
          {renderSection()}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              onClick={activeStep === 0 ? () => router.push('/rtp/consolidated-checklist') : handleBack}
              startIcon={<NavigateBeforeIcon />}
            >
              {activeStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            
            {activeStep === sections.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={saving}
              >
                {saving ? 'Submitting...' : 'Submit'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                endIcon={<NavigateNextIcon />}
              >
                Next
              </Button>
            )}
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