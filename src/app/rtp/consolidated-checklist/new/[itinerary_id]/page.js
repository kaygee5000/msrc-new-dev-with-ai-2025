'use client';
export const dynamic = 'force-dynamic';

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
  Tooltip,
  CircularProgress
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useProgramContext } from "@/context/ProgramContext";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export default function NewConsolidatedChecklist({ params }) {
  const { data: session, status } = useSession();
  const { currentProgram } = useProgramContext();
  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const router = useRouter();
  const itineraryId = params?.itinerary_id;
  
  // Form state
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // General information
    region_id: '',
    district_id: '',
    circuit_id: '',
    school_id: '',
    assessor_name: user?.first_name + ' ' + user?.last_name || '',
    assessment_date: new Date().toISOString().split('T')[0],
  });
  
  // State for storing questions from the database
  const [questions, setQuestions] = useState([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [regionLoading, setRegionLoading] = useState(false);
  const [districtLoading, setDistrictLoading] = useState(false); 
  const [circuitLoading, setCircuitLoading] = useState(false);
  const [schoolLoading, setSchoolLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Location data
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [filteredCircuits, setFilteredCircuits] = useState([]);
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  
  // Itinerary data
  const [itinerary, setItinerary] = useState(null);
  
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
  
  // Load only regions and itinerary details initially
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Fetch regions - returns {success: true, data: [...regions]}
        const regionsResponse = await fetch('/api/regions');
        const regionsData = await regionsResponse.json();
        setRegions(regionsData.data || []);
        
        // Fetch itinerary details - returns the itinerary object directly
        if (itineraryId) {
          const itineraryResponse = await fetch(`/api/rtp/itineraries/${itineraryId}`);
          const itineraryData = await itineraryResponse.json();
          setItinerary(itineraryData || null);
        }
        
        // Fetch questions for consolidated checklist (category 3)
        const questionsResponse = await fetch('/api/rtp/questions?category=3');
        const questionsData = await questionsResponse.json();
        
        // Process questions and update form data structure
        if (questionsData.questions && questionsData.questions.length > 0) {
          // Store questions for rendering
          setQuestions(questionsData.questions);
          
          // Initialize form data with question IDs from the database
          const initialFormData = {
            // Keep the general fields
            region_id: formData.region_id || '',
            district_id: formData.district_id || '',
            circuit_id: formData.circuit_id || '',
            school_id: formData.school_id || '',
            assessor_name: user?.first_name + ' ' + user?.last_name || '',
            assessment_date: formData.assessment_date || new Date().toISOString().split('T')[0],
          };
          
          // Add questions to form data with appropriate initial values
          questionsData.questions.forEach(question => {
            // Determine the appropriate initial value based on question type
            let initialValue = '';
            if (question.question_form === 'boolean' || question.question.toLowerCase().includes('has ') || 
                question.question.toLowerCase().includes('is ') || question.question.toLowerCase().includes('are ')) {
              initialValue = false;
            } else if (question.question_form === 'number' || 
                      question.question.toLowerCase().includes('how many') || 
                      question.question.toLowerCase().includes('enrollment') || 
                      question.question.toLowerCase().includes('teachers')) {
              initialValue = '';
            } else if (question.question_form === 'file' || question.has_file_upload) {
              initialValue = null;
            }
            
            // Add to form data with a consistent naming pattern: q{id}_{key}
            const key = `q${question.id}_${question.question.toLowerCase()
              .replace(/[^a-z0-9]+/g, '_')
              .replace(/_+/g, '_')
              .replace(/^_|_$/g, '')
              .substring(0, 30)}`;
              
            initialFormData[key] = initialValue;
          });
          
          setFormData(prevState => ({
            ...prevState,
            ...initialFormData
          }));
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load initial data: ' + error.message,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, itineraryId, user, formData.region_id, formData.district_id, formData.circuit_id, formData.school_id, formData.assessment_date]);
  
  // Fetch districts when a region is selected
  useEffect(() => {
    if (formData.region_id) {
      const fetchDistricts = async () => {
        try {
          setDistrictLoading(true);
          const response = await fetch(`/api/districts?region_id=${formData.region_id}`);
          const data = await response.json();
          // Format: {success: true, data: {districts: [...]}}
          setDistricts(data.data?.districts || []);
          setFilteredDistricts(data.data?.districts || []);
        } catch (error) {
          console.error('Error fetching districts:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load districts',
            severity: 'error'
          });
        } finally {
          setDistrictLoading(false);
        }
      };
      
      fetchDistricts();
      
      // Reset dependent selections
      setFormData(prev => ({
        ...prev,
        district_id: '',
        circuit_id: '',
        school_id: ''
      }));
    }
  }, [formData.region_id]);
  
  // Fetch circuits when a district is selected
  useEffect(() => {
    if (formData.district_id) {
      const fetchCircuits = async () => {
        try {
          setCircuitLoading(true);
          const response = await fetch(`/api/circuits?district_id=${formData.district_id}`);
          const data = await response.json();
          // Format: {success: true, data: {circuits: [...]}}
          setCircuits(data.data?.circuits || []);
          setFilteredCircuits(data.data?.circuits || []);
        } catch (error) {
          console.error('Error fetching circuits:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load circuits',
            severity: 'error'
          });
        } finally {
          setCircuitLoading(false);
        }
      };
      
      fetchCircuits();
      
      // Reset dependent selections
      setFormData(prev => ({
        ...prev,
        circuit_id: '',
        school_id: ''
      }));
    }
  }, [formData.district_id]);
  
  // Fetch schools when a circuit is selected
  useEffect(() => {
    if (formData.circuit_id) {
      const fetchSchools = async () => {
        try {
          setSchoolLoading(true);
          const response = await fetch(`/api/schools?circuit_id=${formData.circuit_id}`);
          const data = await response.json();
          // Format: {success: true, data: {schools: [...]}}
          setSchools(data.data?.schools || []);
          setFilteredSchools(data.data?.schools || []);
        } catch (error) {
          console.error('Error fetching schools:', error);
          setSnackbar({
            open: true,
            message: 'Failed to load schools',
            severity: 'error'
          });
        } finally {
          setSchoolLoading(false);
        }
      };
      
      fetchSchools();
      
      // Reset school selection
      setFormData(prev => ({
        ...prev,
        school_id: ''
      }));
    }
  }, [formData.circuit_id]);
  
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
      // Basic validation
      if (!formData.school_id) {
        throw new Error('Please select a school before submitting');
      }
      
      // Create FormData object for submission (supports file uploads)
      const submissionFormData = new FormData();
      
      // Add basic fields
      submissionFormData.append('itineraryId', itineraryId);
      submissionFormData.append('schoolId', formData.school_id);
      submissionFormData.append('submittedBy', user.id);
      
      // Process answers
      const answers = Object.entries(formData)
        .filter(([key, value]) => key.startsWith('q') && key !== 'q18_implementation_plan_file')
        .map(([key, value]) => {
          // Extract question ID from the key (e.g., q17_has_implementation_plan -> 17)
          const questionId = key.split('_')[0].replace('q', '');
          return {
            questionId: parseInt(questionId),
            value: typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value.toString(),
            hasFileUpload: key === 'q18_implementation_plan_file'
          };
        });
      
      // Add answers as JSON
      submissionFormData.append('answers', JSON.stringify(answers));
      
      // Handle file upload if present
      if (formData.q18_implementation_plan_file) {
        submissionFormData.append('file_18', formData.q18_implementation_plan_file);
      }
      
      // Submit to actual API endpoint with the correct Content-Type (automatically set by FormData)
      const response = await fetch('/api/rtp/consolidated-checklist', {
        method: 'POST',
        body: submissionFormData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit form');
      }
      
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
        message: 'Failed to submit Consolidated Checklist: ' + error.message,
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
    // Select the first available values in the location hierarchies
    const regionId = regions.length > 0 ? regions[0].id.toString() : '';
    
    // Set form data with dummy values
    setFormData(prev => {
      const newData = { ...prev };
      
      // Set location data
      newData.region_id = regionId;
      
      // Fill in common fields
      newData.assessor_name = user?.first_name + ' ' + user?.last_name || '';
      newData.assessment_date = new Date().toISOString().split('T')[0];
      
      // Fill in all question fields with reasonable defaults
      Object.keys(newData).forEach(key => {
        if (key.startsWith('q')) {
          if (typeof newData[key] === 'boolean') {
            newData[key] = true;
          } else if (key.includes('enrollment') || key.includes('teachers')) {
            newData[key] = Math.floor(Math.random() * 100) + 10; // Random number between 10-109
          } else if (key.includes('file')) {
            // Create a dummy file object for testing
            const dummyFile = new File(["dummy content"], "implementation_plan.pdf", {
              type: "application/pdf",
            });
            newData[key] = dummyFile;
          } else if (key.includes('frequency')) {
            newData[key] = 'Monthly';
          } else if (key.includes('support')) {
            newData[key] = 'Very supportive';
          } else if (key.includes('method') || key.includes('environment')) {
            newData[key] = 'Extensively';
          } else if (key.includes('using_ltp') || key.includes('with_ltp_lessons')) {
            newData[key] = '51-75%';
          } else if (key.includes('challenges') || key.includes('support_needed')) {
            newData[key] = 'This is sample text for a long-text field response that would typically contain details about challenges or support needs.';
          } else if (key.includes('type')) {
            newData[key] = 'Primary and JHS';
          }
        }
      });
      
      return newData;
    });
    
    setSnackbar({
      open: true,
      message: 'Form filled with dummy data. Please complete the location selection to select a school.',
      severity: 'info'
    });
  };
  
  // Group questions by section for better organization
  const getQuestionsBySections = () => {
    if (questions.length === 0) return {};
    
    // Define the main question sections
    const sections = {
      'School Information': [],
      'Leadership & Management': [],
      'Implementation Plans': [],
      'Teacher Practice': [],
      'Learning Environment': [],
      'Challenges & Support': []
    };
    
    // Define question ID ranges for each section (based on the PRD)
    const sectionRanges = {
      'School Information': [1, 2, 3, 4, 5, 6, 7],
      'Leadership & Management': [8, 9, 10, 11, 12, 13, 14, 15, 16],
      'Implementation Plans': [17, 18, 19, 20],
      'Teacher Practice': [21, 22, 23, 24],
      'Learning Environment': [25, 26, 27, 28],
      'Challenges & Support': [29, 30]
    };
    
    // Group questions by their section
    questions.forEach(question => {
      // Find which section this question belongs to
      for (const [sectionName, idList] of Object.entries(sectionRanges)) {
        if (idList.includes(question.id)) {
          sections[sectionName].push(question);
          break;
        }
      }
    });
    
    return sections;
  };
  
  // Render the current section of the form
  const renderSection = () => {
    const questionsBySection = getQuestionsBySections();
    
    // Review and submit section should be the last one
    if (activeStep === sections.length - 1) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Review Your Submission
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              Please review the information below before submitting. Once submitted, this data can only be updated 
              by contacting an administrator.
            </Alert>
            
            <List>
              <ListItem>
                <ListItemText 
                  primary="Itinerary" 
                  secondary={itinerary ? `${itinerary.title} (${new Date(itinerary.start_date).toLocaleDateString()} to ${new Date(itinerary.end_date).toLocaleDateString()})` : 'Loading...'}
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Region" 
                  secondary={regions.find(r => r.id.toString() === formData.region_id)?.name || 'Not selected'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="District" 
                  secondary={districts.find(d => d.id.toString() === formData.district_id)?.name || 'Not selected'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Circuit" 
                  secondary={circuits.find(c => c.id.toString() === formData.circuit_id)?.name || 'Not selected'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="School" 
                  secondary={schools.find(s => s.id.toString() === formData.school_id)?.name || 'Not selected'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Assessor Name" 
                  secondary={formData.assessor_name || 'Not provided'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Assessment Date" 
                  secondary={formData.assessment_date || 'Not provided'} 
                />
              </ListItem>
              <Divider sx={{ my: 2 }} />
              
              {/* Show summary of responses */}
              {Object.entries(questionsBySection).map(([sectionName, sectionQuestions]) => (
                <div key={sectionName}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>
                    {sectionName}
                  </Typography>
                  {sectionQuestions.map(question => {
                    const fieldKey = Object.keys(formData).find(key => key.startsWith(`q${question.id}_`));
                    if (!fieldKey) return null;
                    
                    let displayValue = formData[fieldKey];
                    if (typeof displayValue === 'boolean') {
                      displayValue = displayValue ? 'Yes' : 'No';
                    } else if (fieldKey === 'q18_implementation_plan_file' && formData[fieldKey]) {
                      displayValue = formData[fieldKey].name || 'File uploaded';
                    } else if (displayValue === null || displayValue === undefined || displayValue === '') {
                      displayValue = 'Not provided';
                    }
                    
                    return (
                      <ListItem key={question.id}>
                        <ListItemText 
                          primary={question.question} 
                          secondary={displayValue} 
                        />
                      </ListItem>
                    );
                  })}
                </div>
              ))}
            </List>
          </CardContent>
        </Card>
      );
    }
    
    // Get the current section based on activeStep
    const currentSectionName = sections[activeStep];
    const currentSectionQuestions = questionsBySection[currentSectionName] || [];
    
    if (currentSectionQuestions.length === 0 && activeStep !== 0) {
      return (
        <Alert severity="warning">
          No questions found for this section. Please contact an administrator.
        </Alert>
      );
    }
    
    return (
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {currentSectionName}
          </Typography>
          
          {/* Show itinerary information at the top */}
          {itinerary && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Submitting data for itinerary: <strong>{itinerary.title}</strong>
              <br />
              Period: {new Date(itinerary.from_date).toLocaleDateString()} to {new Date(itinerary.until_date).toLocaleDateString()}
            </Alert>
          )}
          
          <Grid container spacing={3}>
            {activeStep === 0 && (
              <>
                {/* School selection hierarchy */}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required sx={{ mb: 3 }}>
                    <InputLabel id="region-select-label">Region</InputLabel>
                    <Select
                      labelId="region-select-label"
                      name="region_id"
                      value={formData.region_id}
                      onChange={handleChange}
                      label="Region"
                    >
                      <MenuItem value="">Select a region</MenuItem>
                      {regions.map(region => (
                        <MenuItem key={region.id} value={region.id.toString()}>
                          {region.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {regionLoading && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          Loading regions...
                        </Typography>
                      </Box>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required sx={{ mb: 3 }} disabled={!formData.region_id}>
                    <InputLabel id="district-select-label">District</InputLabel>
                    <Select
                      labelId="district-select-label"
                      name="district_id"
                      value={formData.district_id}
                      onChange={handleChange}
                      label="District"
                    >
                      <MenuItem value="">Select a district</MenuItem>
                      {filteredDistricts.map(district => (
                        <MenuItem key={district.id} value={district.id.toString()}>
                          {district.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {districtLoading && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          Loading districts...
                        </Typography>
                      </Box>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required sx={{ mb: 3 }} disabled={!formData.district_id}>
                    <InputLabel id="circuit-select-label">Circuit</InputLabel>
                    <Select
                      labelId="circuit-select-label"
                      name="circuit_id"
                      value={formData.circuit_id}
                      onChange={handleChange}
                      label="Circuit"
                    >
                      <MenuItem value="">Select a circuit</MenuItem>
                      {filteredCircuits.map(circuit => (
                        <MenuItem key={circuit.id} value={circuit.id.toString()}>
                          {circuit.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {circuitLoading && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          Loading circuits...
                        </Typography>
                      </Box>
                    )}
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required sx={{ mb: 3 }} disabled={!formData.circuit_id}>
                    <InputLabel id="school-select-label">School</InputLabel>
                    <Select
                      labelId="school-select-label"
                      name="school_id"
                      value={formData.school_id}
                      onChange={handleChange}
                      label="School"
                    >
                      <MenuItem value="">Select a school</MenuItem>
                      {filteredSchools.map(school => (
                        <MenuItem key={school.id} value={school.id.toString()}>
                          {school.name}
                        </MenuItem>
                      ))}
                    </Select>
                    {schoolLoading && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <CircularProgress size={16} sx={{ mr: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          Loading schools...
                        </Typography>
                      </Box>
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
              </>
            )}
            
            {currentSectionQuestions.map(question => {
              // Check if this question has already been rendered to avoid duplicates
              const fieldKey = Object.keys(formData).find(key => key.startsWith(`q${question.id}_`));
              if (!fieldKey) return null;
              
              // Skip questions with duplicate IDs that have already been rendered
              const questionIdStr = fieldKey.split('_')[0].replace('q', '');
              const questionId = parseInt(questionIdStr);
              
              // Determine field type based on question properties
              if (question.has_file_upload) {
                return (
                  <Grid item xs={12} key={question.id}>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <FormLabel component="legend" sx={{ mb: 1, fontSize: '1rem', fontWeight: 500 }}>
                        {question.question}
                      </FormLabel>
                      <Box sx={{ mt: 1 }}>
                        <input
                          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          style={{ display: 'none' }}
                          id={`upload-${question.id}`}
                          type="file"
                          onChange={handleFileChange}
                        />
                        <label htmlFor={`upload-${question.id}`}>
                          <Button
                            variant="outlined"
                            component="span"
                            startIcon={<CloudUploadIcon />}
                          >
                            Upload Implementation Plan
                          </Button>
                        </label>
                        {formData[fieldKey] && (
                          <Typography variant="caption" sx={{ ml: 2 }}>
                            File: {formData[fieldKey].name}
                          </Typography>
                        )}
                      </Box>
                      <FormHelperText>
                        Upload the school&apos;s LtP implementation plan (PDF or Word document)
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                );
              } else if (typeof formData[fieldKey] === 'boolean') {
                return (
                  <Grid item xs={12} key={question.id}>
                    <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
                      <FormLabel component="legend" sx={{ fontSize: '1rem', fontWeight: 500 }}>
                        {question.question}
                      </FormLabel>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox 
                              checked={formData[fieldKey]} 
                              onChange={handleCheckboxChange}
                              name={fieldKey}
                            />
                          }
                          label="Yes"
                        />
                      </FormGroup>
                    </FormControl>
                  </Grid>
                );
              } else if (fieldKey.includes('frequency') || fieldKey.includes('support') || 
                          fieldKey.includes('methods') || fieldKey.includes('environment') ||
                          fieldKey.includes('using_ltp') || fieldKey.includes('with_ltp_lessons')) {
                // This is a select field with predefined options
                const getOptionsForField = (field) => {
                  if (field.includes('frequency')) {
                    return ['Weekly', 'Monthly', 'Once per term', 'Rarely', 'Never'];
                  } else if (field.includes('support')) {
                    return ['Very supportive', 'Somewhat supportive', 'Neutral', 'Not supportive'];
                  } else if (field.includes('methods') || field.includes('environment')) {
                    return ['Extensively', 'Somewhat', 'Minimally', 'Not at all'];
                  } else if (field.includes('using_ltp') || field.includes('with_ltp_lessons')) {
                    return ['0-25%', '26-50%', '51-75%', '76-100%'];
                  }
                  return [];
                };
                
                const options = getOptionsForField(fieldKey);
                
                return (
                  <Grid item xs={12} md={12} key={question.id}>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel id={`label-${fieldKey}`} sx={{ whiteSpace: 'normal', position: 'relative', transform: 'none', mb: 1 }}>
                        {question.question}
                      </InputLabel>
                      <Select
                        labelId={`label-${fieldKey}`}
                        name={fieldKey}
                        value={formData[fieldKey]}
                        onChange={handleChange}
                        label=""
                      >
                        {options.map(option => (
                          <MenuItem key={option} value={option}>
                            {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                );
              } else if (fieldKey.includes('challenges') || fieldKey.includes('support_needed')) {
                // This is a textarea
                return (
                  <Grid item xs={12} key={question.id}>
                    <TextField
                      fullWidth
                      label={question.question}
                      name={fieldKey}
                      value={formData[fieldKey]}
                      onChange={handleChange}
                      multiline
                      rows={4}
                      required={question.is_required}
                      sx={{ mb: 3 }}
                      InputLabelProps={{ 
                        shrink: true,
                        sx: { whiteSpace: 'normal', position: 'relative', transform: 'none', mb: 1 }
                      }}
                    />
                  </Grid>
                );
              } else {
                // Default to a text field or number field
                const isNumber = fieldKey.includes('enrollment') || fieldKey.includes('teachers');
                
                return (
                  <Grid item xs={12} md={6} key={question.id}>
                    <TextField
                      fullWidth
                      label={question.question}
                      name={fieldKey}
                      value={formData[fieldKey]}
                      onChange={handleChange}
                      type={isNumber ? "number" : "text"}
                      InputProps={{ inputProps: { min: 0 } }}
                      required={question.is_required}
                      sx={{ mb: 3 }}
                      InputLabelProps={{ 
                        shrink: true,
                        sx: { whiteSpace: 'normal', position: 'relative', transform: 'none', mb: 1 }
                      }}
                    />
                  </Grid>
                );
              }
            })}
          </Grid>
        </CardContent>
      </Card>
    );
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
              <Button
                onClick={() => router.push('/rtp/consolidated-checklist')}
                sx={{ minWidth: 'auto', p: 0, mr: 1, color: 'text.secondary', textTransform: 'none' }}
              >
                Consolidated Checklists
              </Button>
              {' / '}
              <span style={{ marginLeft: "4px" }}>New Checklist</span>
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
                disabled={saving || !formData.school_id}
              >
                {saving ? 'Submitting...' : 'Submit'}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
                endIcon={<NavigateNextIcon />}
                disabled={activeStep === 0 && !formData.school_id}
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
