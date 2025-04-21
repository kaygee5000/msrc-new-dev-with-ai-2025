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
  Slider,
  Rating,
  List,
  ListItem,
  ListItemText,
  Tooltip
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export default function PartnersInPlayWithItinerary({ params }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { id: itineraryId } = params;
  
  // Form state with all 64 questions
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // General information
    school_id: '',
    teacher_name: '',
    class_level: '',
    subject: '',
    observation_date: new Date().toISOString().split('T')[0],
    itinerary_id: itineraryId || '',
    observer_name: '',
    
    // Section 1: Classroom Environment (Q1-Q10)
    q1_classroom_organization: '',
    q2_learning_materials: '',
    q3_seating_arrangement: '',
    q4_group_work_spaces: '',
    q5_display_student_work: false,
    q6_gender_balanced_materials: '',
    q7_classroom_cleanliness: '',
    q8_natural_lighting: false,
    q9_ventilation: '',
    q10_inclusive_environment: '',
    
    // Section 2: Lesson Planning & Structure (Q11-Q20)
    q11_lesson_plan_available: false,
    q12_objectives_clear: '',
    q13_ltp_methods_in_plan: false,
    q14_time_management: '',
    q15_planned_activities: '',
    q16_teaching_aids: false,
    q17_gender_considerations: '',
    q18_inclusion_considerations: '',
    q19_assessment_methods: '',
    q20_prior_knowledge: '',
    
    // Section 3: Teaching Methodology (Q21-Q30)
    q21_participatory_methods: '',
    q22_questioning_techniques: '',
    q23_wait_time_after_questions: '',
    q24_feedback_to_students: '',
    q25_positive_reinforcement: '',
    q26_critical_thinking: '',
    q27_collaboration_opportunities: '',
    q28_play_based_activities: '',
    q29_student_engagement: '',
    q30_differentiated_instruction: '',
    
    // Section 4: Teacher Communication (Q31-Q40)
    q31_clear_instructions: '',
    q32_language_appropriate: '',
    q33_friendly_tone: '',
    q34_acknowledges_effort: '',
    q35_non_verbal_cues: '',
    q36_active_listening: '',
    q37_encourages_questions: '',
    q38_respects_opinions: '',
    q39_gender_sensitive: '',
    q40_cultural_sensitivity: '',
    
    // Section 5: Student Participation (Q41-Q50)
    q41_student_questions: '',
    q42_student_discussion: '',
    q43_student_demonstrations: '',
    q44_boys_participation: '',
    q45_girls_participation: '',
    q46_shy_student_participation: '',
    q47_group_dynamics: '',
    q48_student_leadership: '',
    q49_peer_support: '',
    q50_student_autonomy: '',
    
    // Section 6: Assessment Practices (Q51-Q60)
    q51_formative_assessment: '',
    q52_variety_of_assessment: '',
    q53_learning_objectives_assessed: '',
    q54_feedback_quality: '',
    q55_student_self_assessment: false,
    q56_peer_assessment: false,
    q57_assessment_documentation: '',
    q58_remedial_measures: '',
    q59_assessment_bias_avoidance: '',
    q60_celebrates_achievement: '',
    
    // Section 7: Overall Reflection (Q61-Q64)
    q61_teacher_effectiveness: 3,
    q62_ltp_implementation: 3,
    q63_strengths: '',
    q64_areas_for_improvement: ''
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [schools, setSchools] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [currentItinerary, setCurrentItinerary] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Define the sections of the form
  const sections = [
    'Basic Information',
    'Classroom Environment',
    'Lesson Planning & Structure',
    'Teaching Methodology',
    'Teacher Communication',
    'Student Participation',
    'Assessment Practices',
    'Overall Reflection',
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
        
        // Find current itinerary
        const foundItinerary = itinerariesResponse.find(item => item.id.toString() === itineraryId);
        if (foundItinerary) {
          setCurrentItinerary(foundItinerary);
          setFormData(prev => ({
            ...prev,
            itinerary_id: itineraryId
          }));
        }
        
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
  }, [isAuthenticated, itineraryId]);
  
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
  
  // Handle slider changes
  const handleSliderChange = (name) => (e, newValue) => {
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  // Handle rating changes
  const handleRatingChange = (name) => (e, newValue) => {
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
  };
  
  // Fill with dummy data function
  const fillWithDummyData = () => {
    setFormData({
      // General information
      school_id: '2', // Tema Model School
      teacher_name: 'Emmanuel Owusu',
      class_level: 'P3',
      subject: 'Mathematics',
      observation_date: new Date().toISOString().split('T')[0],
      itinerary_id: itineraryId || '1', // Use current itinerary or default
      observer_name: 'Sarah Mensah',
      
      // Section 1: Classroom Environment (Q1-Q10)
      q1_classroom_organization: 'Somewhat organized',
      q2_learning_materials: 'Somewhat accessible',
      q3_seating_arrangement: 'Groups/clusters',
      q4_group_work_spaces: 'Somewhat designated',
      q5_display_student_work: true,
      q6_gender_balanced_materials: 'Somewhat balanced',
      q7_classroom_cleanliness: 'Clean',
      q8_natural_lighting: true,
      q9_ventilation: 'Good',
      q10_inclusive_environment: 'Somewhat inclusive',
      
      // Section 2: Lesson Planning & Structure (Q11-Q20)
      q11_lesson_plan_available: true,
      q12_objectives_clear: 'Somewhat clear',
      q13_ltp_methods_in_plan: true,
      q14_time_management: 'Good',
      q15_planned_activities: 'Somewhat appropriate',
      q16_teaching_aids: true,
      q17_gender_considerations: 'Somewhat',
      q18_inclusion_considerations: 'Minimally',
      q19_assessment_methods: 'Multiple methods',
      q20_prior_knowledge: 'Somewhat',
      
      // Section 3: Teaching Methodology (Q21-Q30)
      q21_participatory_methods: 'Moderately',
      q22_questioning_techniques: 'Effective',
      q23_wait_time_after_questions: 'Usually',
      q24_feedback_to_students: 'General but positive',
      q25_positive_reinforcement: 'Frequently',
      q26_critical_thinking: 'Moderately',
      q27_collaboration_opportunities: 'Some',
      q28_play_based_activities: 'Extensively',
      q29_student_engagement: 'High',
      q30_differentiated_instruction: 'Moderately',
      
      // Section 4: Teacher Communication (Q31-Q40)
      q31_clear_instructions: 'Clear',
      q32_language_appropriate: 'Appropriate',
      q33_friendly_tone: 'Usually',
      q34_acknowledges_effort: 'Frequently',
      q35_non_verbal_cues: 'Effectively',
      q36_active_listening: 'Usually',
      q37_encourages_questions: 'Often',
      q38_respects_opinions: 'Usually',
      q39_gender_sensitive: 'Mostly',
      q40_cultural_sensitivity: 'Appropriate',
      
      // Section 5: Student Participation (Q41-Q50)
      q41_student_questions: 'Moderate',
      q42_student_discussion: 'Active',
      q43_student_demonstrations: 'Some',
      q44_boys_participation: 'Actively',
      q45_girls_participation: 'Actively',
      q46_shy_student_participation: 'Some encouragement',
      q47_group_dynamics: 'Collaborative',
      q48_student_leadership: 'Some opportunities',
      q49_peer_support: 'Evident',
      q50_student_autonomy: 'Moderate',
      
      // Section 6: Assessment Practices (Q51-Q60)
      q51_formative_assessment: 'Sometimes',
      q52_variety_of_assessment: 'Some variety',
      q53_learning_objectives_assessed: 'Most',
      q54_feedback_quality: 'Constructive',
      q55_student_self_assessment: true,
      q56_peer_assessment: false,
      q57_assessment_documentation: 'Basic',
      q58_remedial_measures: 'Some provided',
      q59_assessment_bias_avoidance: 'Considered',
      q60_celebrates_achievement: 'Usually',
      
      // Section 7: Overall Reflection (Q61-Q64)
      q61_teacher_effectiveness: 4,
      q62_ltp_implementation: 4,
      q63_strengths: 'The teacher effectively uses play-based learning activities that engage students. Group work is well-organized, and the teacher maintains a positive learning environment.',
      q64_areas_for_improvement: 'Could improve on providing more differentiated instruction for students with special needs. Wait time after questions could be extended to allow more students to formulate responses.'
    });
    
    setSnackbar({
      open: true,
      message: 'Form filled with dummy data for testing',
      severity: 'info'
    });
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
      // This would be an actual API call in production
      // For now just simulate it
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful submission
      setSnackbar({
        open: true,
        message: 'Partners in Play survey submitted successfully!',
        severity: 'success'
      });
      
      // Redirect back to main RTP page after success
      setTimeout(() => {
        router.push('/rtp');
      }, 2000);
    } catch (error) {
      console.error('Error submitting form:', error);
      setSnackbar({
        open: true,
        message: 'Failed to submit Partners in Play survey',
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
    // The section rendering code is the same as in the base page
    // ...existing code for renderSection() goes here
    // For brevity, I'm not including the complete section rendering code
    
    switch (activeStep) {
      case 0:
        return (
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Basic Information
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
                  <FormControl fullWidth disabled sx={{ mb: 3 }}>
                    <InputLabel id="itinerary-select-label">Itinerary</InputLabel>
                    <Select
                      labelId="itinerary-select-label"
                      name="itinerary_id"
                      value={formData.itinerary_id}
                      label="Itinerary"
                    >
                      {itineraries.map(itinerary => (
                        <MenuItem key={itinerary.id} value={itinerary.id.toString()}>
                          {itinerary.name} ({itinerary.start_date} to {itinerary.end_date})
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>Itinerary is pre-selected based on your selection</FormHelperText>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Teacher Name"
                    name="teacher_name"
                    value={formData.teacher_name}
                    onChange={handleChange}
                    required
                    sx={{ mb: 3 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Observer Name"
                    name="observer_name"
                    value={formData.observer_name}
                    onChange={handleChange}
                    required
                    sx={{ mb: 3 }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required sx={{ mb: 3 }}>
                    <InputLabel id="class-level-label">Class Level</InputLabel>
                    <Select
                      labelId="class-level-label"
                      name="class_level"
                      value={formData.class_level}
                      onChange={handleChange}
                      label="Class Level"
                    >
                      <MenuItem value="KG 1">KG 1</MenuItem>
                      <MenuItem value="KG 2">KG 2</MenuItem>
                      <MenuItem value="P1">Primary 1</MenuItem>
                      <MenuItem value="P2">Primary 2</MenuItem>
                      <MenuItem value="P3">Primary 3</MenuItem>
                      <MenuItem value="P4">Primary 4</MenuItem>
                      <MenuItem value="P5">Primary 5</MenuItem>
                      <MenuItem value="P6">Primary 6</MenuItem>
                      <MenuItem value="JHS 1">JHS 1</MenuItem>
                      <MenuItem value="JHS 2">JHS 2</MenuItem>
                      <MenuItem value="JHS 3">JHS 3</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required sx={{ mb: 3 }}>
                    <InputLabel id="subject-label">Subject</InputLabel>
                    <Select
                      labelId="subject-label"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      label="Subject"
                    >
                      <MenuItem value="English">English</MenuItem>
                      <MenuItem value="Mathematics">Mathematics</MenuItem>
                      <MenuItem value="Science">Science</MenuItem>
                      <MenuItem value="Social Studies">Social Studies</MenuItem>
                      <MenuItem value="RME">RME</MenuItem>
                      <MenuItem value="Creative Arts">Creative Arts</MenuItem>
                      <MenuItem value="Ghanaian Language">Ghanaian Language</MenuItem>
                      <MenuItem value="ICT">ICT</MenuItem>
                      <MenuItem value="French">French</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Observation Date"
                    type="date"
                    name="observation_date"
                    value={formData.observation_date}
                    onChange={handleChange}
                    required
                    sx={{ mb: 3 }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        );
      // Other case statements would go here, but for brevity I'm not including them
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
              <span style={{ marginLeft: '4px' }}>
                {currentItinerary ? currentItinerary.name : `Itinerary ${itineraryId}`}
              </span>
              {' / '}
              <span style={{ marginLeft: '4px' }}>Partners in Play</span>
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Partners in Play Survey
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
              onClick={handleBack}
              disabled={activeStep === 0}
              startIcon={<NavigateBeforeIcon />}
            >
              Back
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