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
  LinearProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  IconButton,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ConsolidatedChecklistDetail({ params }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { id } = params;
  
  // Form state
  const [formData, setFormData] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [school, setSchool] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Fetch checklist data
  useEffect(() => {
    const fetchChecklistData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // This would be an actual API call in production
        // For now using mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data for demonstration
        const mockSchool = {
          id: 1,
          name: 'Accra Primary School',
          district_id: 1,
          district_name: 'Accra Metro'
        };
        
        const mockItinerary = {
          id: 1,
          name: 'Q1 2025 Data Collection',
          start_date: '2025-01-01',
          end_date: '2025-03-31'
        };
        
        const mockData = {
          // General information
          id: id,
          school_id: '1',
          assessor_name: 'John Doe',
          assessment_date: '2025-04-15',
          itinerary_id: '1',
          
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
          q18_implementation_plan_file: null, // Files can't be mocked easily
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
          q30_additional_support_needed: 'More teaching and learning materials, refresher training for teachers, additional coaching visits.',
          
          created_at: '2025-04-15T10:30:00Z',
          updated_at: '2025-04-15T10:30:00Z'
        };
        
        setFormData(mockData);
        setSchool(mockSchool);
        setItinerary(mockItinerary);
      } catch (error) {
        console.error('Error fetching checklist data:', error);
        setError('Failed to load the checklist data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchChecklistData();
    }
  }, [id, isAuthenticated]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
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
        <Typography sx={{ mt: 2 }}>Loading checklist data...</Typography>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/rtp/consolidated-checklist')}
          startIcon={<ArrowBackIcon />}
        >
          Back to Checklists
        </Button>
      </Container>
    );
  }
  
  if (!formData) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="warning">
          No checklist data found for the specified ID.
        </Alert>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/rtp/consolidated-checklist')}
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Checklists
        </Button>
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
              <Button 
                onClick={() => router.push('/rtp/consolidated-checklist')} 
                sx={{ minWidth: 'auto', p: 0, mx: 1, color: 'text.secondary', textTransform: 'none' }}
              >
                Consolidated Checklists
              </Button>
              {' / '}
              <span style={{ marginLeft: '4px' }}>View Checklist</span>
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Consolidated Checklist Details
            </Typography>
            
            <Button 
              variant="outlined" 
              onClick={() => router.push('/rtp/consolidated-checklist')}
              startIcon={<ArrowBackIcon />}
            >
              Back to List
            </Button>
          </Box>
        </Box>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              General Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">School</Typography>
                <Typography variant="body1" color="text.secondary">
                  {school ? `${school.name} (${school.district_name})` : 'Not available'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Itinerary</Typography>
                <Typography variant="body1" color="text.secondary">
                  {itinerary ? `${itinerary.name} (${itinerary.start_date} to ${itinerary.end_date})` : 'Not available'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Assessor</Typography>
                <Typography variant="body1" color="text.secondary">{formData.assessor_name}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Assessment Date</Typography>
                <Typography variant="body1" color="text.secondary">{formData.assessment_date}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Submission Date</Typography>
                <Typography variant="body1" color="text.secondary">
                  {new Date(formData.created_at).toLocaleDateString()}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              School Information
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">School Type</Typography>
                <Typography variant="body1" color="text.secondary">{formData.q1_school_type}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Total Enrollment</Typography>
                <Typography variant="body1" color="text.secondary">{formData.q2_total_enrollment}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Boys Enrollment</Typography>
                <Typography variant="body1" color="text.secondary">{formData.q3_boys_enrollment}</Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Girls Enrollment</Typography>
                <Typography variant="body1" color="text.secondary">{formData.q4_girls_enrollment}</Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1">Total Teachers</Typography>
                <Typography variant="body1" color="text.secondary">{formData.q5_total_teachers}</Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1">Male Teachers</Typography>
                <Typography variant="body1" color="text.secondary">{formData.q6_male_teachers}</Typography>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1">Female Teachers</Typography>
                <Typography variant="body1" color="text.secondary">{formData.q7_female_teachers}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Leadership & Management
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">School received RTP/LtP training</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q8_training_received ? 'Yes' : 'No'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Head teacher trained on RTP/LtP</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q9_head_teacher_trained ? 'Yes' : 'No'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Curriculum lead trained on RTP/LtP</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q10_curriculum_lead_trained ? 'Yes' : 'No'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">SMC sensitized on RTP/LtP</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q11_smc_sensitized ? 'Yes' : 'No'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">PTA sensitized on RTP/LtP</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q12_pta_sensitized ? 'Yes' : 'No'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">School management support level</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q13_management_support}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Frequency of RTP/LtP discussion in meetings</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q14_management_meetings}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Circuit Supervisor visited this term</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q15_circuit_supervisor_visit ? 'Yes' : 'No'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Coach visit frequency</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q16_coach_visit_frequency}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Implementation Plans
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Has implementation plan for RTP/LtP</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q17_has_implementation_plan ? 'Yes' : 'No'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Implementation plan document</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q18_implementation_plan_file ? formData.q18_implementation_plan_file.name : 'Not uploaded'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Teachers with RTP/LtP methods in lesson plans</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q19_teachers_with_ltp_lessons}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Has monitoring mechanism for RTP/LtP</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q20_monitoring_mechanism ? 'Yes' : 'No'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Teacher Practice
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Teachers regularly using RTP/LtP methods</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q21_teachers_using_ltp}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Use of gender-responsive teaching methods</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q22_gender_responsive_methods}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Use of inclusive teaching methods</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q23_inclusion_methods}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Teacher confidence in RTP/LtP methods</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q24_teachers_confident}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Learning Environment
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">RTP/LtP materials displayed in classrooms</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q25_learning_materials_display ? 'Yes' : 'No'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Student work displayed in classrooms</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q26_student_work_display ? 'Yes' : 'No'}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Safety of learning environment</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q27_safe_environment}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1">Gender-responsiveness of learning environment</Typography>
                <Typography variant="body1" color="text.secondary">
                  {formData.q28_gender_responsive_environment}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Challenges & Support
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1">Main challenges faced in implementing RTP/LtP</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {formData.q29_main_challenges}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle1">Additional support needed</Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                  {formData.q30_additional_support_needed}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            onClick={() => router.push('/rtp/consolidated-checklist')}
            startIcon={<ArrowBackIcon />}
          >
            Back to List
          </Button>
          
          <Button
            variant="contained"
            color="primary"
            onClick={() => router.push(`/rtp/consolidated-checklist/${id}/edit`)}
          >
            Edit Checklist
          </Button>
        </Box>
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