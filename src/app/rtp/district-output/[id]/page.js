'use client';

import { useState, useEffect } from 'react';
import { 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  Container, 
  Box, 
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  Snackbar,
  Grid,
  TextField,
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
    region_id: '',
    itinerary_id: itineraryId,
    answers: {}
  });
  
  // Options for selects
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [filteredDistricts, setFilteredDistricts] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [existingSubmission, setExistingSubmission] = useState(null);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // Load regions, districts, itinerary details, and questions
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch regions
        const regionsResponse = await fetch('/api/regions');
        const regionsData = await regionsResponse.json();
        setRegions(regionsData.data || []);
        
        // Fetch all districts
        const districtsResponse = await fetch('/api/districts');
        const districtsData = await districtsResponse.json();
        setDistricts(districtsData.data.districts || []);
        
        // Fetch itinerary details
        const itineraryResponse = await fetch(`/api/rtp/itineraries/${itineraryId}`);
        const itineraryData = await itineraryResponse.json();
        setItinerary(itineraryData || null);
        
        // Fetch questions for district output (category 2)
        const questionsResponse = await fetch('/api/rtp/questions?category_id=2');
        const questionsData = await questionsResponse.json();
        setQuestions(questionsData.questions || []);
        
        // Check for existing submission
        await fetchExistingSubmission();
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load form data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated && itineraryId) {
      fetchData();
    }
  }, [isAuthenticated, itineraryId, fetchExistingSubmission]);
  
  // Filter districts when region changes
  useEffect(() => {
    if (formData.region_id) {
      const filtered = districts.filter(district => 
        district.region_id.toString() === formData.region_id.toString()
      );
      setFilteredDistricts(filtered);
    } else {
      setFilteredDistricts(districts);
    }
  }, [formData.region_id, districts]);
  
  // Fetch existing submission if available
  const fetchExistingSubmission = useCallback(async () => {
    try {
      const response = await fetch(`/api/rtp/output/district?itineraryId=${itineraryId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Find submission by the current user
        const userSubmission = data.data?.find(sub => sub.submitted_by === user.id);
        
        if (userSubmission) {
          setExistingSubmission(userSubmission);
          
          // Extract district and region info
          const districtId = userSubmission.district_id.toString();
          const district = districts.find(d => d.id.toString() === districtId);
          const regionId = district ? district.region_id.toString() : '';
          
          // Format answers into the expected structure
          const formattedAnswers = {};
          if (userSubmission.answers && userSubmission.answers.length > 0) {
            userSubmission.answers.forEach(answer => {
              formattedAnswers[answer.question_id] = answer.answer_value;
            });
          }
          
          setFormData({
            district_id: districtId,
            region_id: regionId,
            itinerary_id: itineraryId,
            answers: formattedAnswers
          });
        }
      }
    } catch (error) {
      console.error('Error fetching existing submission:', error);
    }
  }, [itineraryId, user.id, districts]);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Handle region change
  const handleRegionChange = (e) => {
    const regionId = e.target.value;
    setFormData(prev => ({
      ...prev,
      region_id: regionId,
      district_id: '' // Reset district when region changes
    }));
  };
  
  // Handle district change
  const handleDistrictChange = (e) => {
    const districtId = e.target.value;
    setFormData(prev => ({
      ...prev,
      district_id: districtId
    }));
  };
  
  // Handle form changes for question answers
  const handleAnswerChange = (questionId, value) => {
    setFormData(prev => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value
      }
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.district_id) {
      setSnackbar({
        open: true,
        message: 'Please select a district',
        severity: 'error'
      });
      return;
    }
    
    setSaving(true);
    
    try {
      // Format the answers for API submission
      const answersArray = Object.keys(formData.answers).map(questionId => ({
        questionId: parseInt(questionId),
        value: formData.answers[questionId]
      }));
      
      const payload = {
        itineraryId: parseInt(formData.itinerary_id),
        districtId: parseInt(formData.district_id),
        submittedBy: user.id,
        answers: answersArray
      };
      
      // Submit the data
      const response = await fetch('/api/rtp/output/district', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSnackbar({
          open: true,
          message: 'District output data saved successfully!',
          severity: 'success'
        });
        
        // Redirect back to main RTP page after success
        setTimeout(() => {
          router.push('/rtp');
        }, 1500);
      } else {
        throw new Error(result.message || 'Failed to save data');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save district output data: ' + error.message,
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
  
  // Organize questions by groups for better display
  const getQuestionGroups = () => {
    // These are the main question groups we want to organize by
    const groups = {
      'District Support Teams': [23, 24, 25, 26],
      'District Teacher Support Teams (DTST)': [27, 28, 29, 30],
      'Planning and Meetings': [31, 32, 33, 34],
      'Trainers': [35, 36],
      'National Meetings': [37, 38],
      'Teacher Training': [39, 40, 41, 42, 43, 44, 45, 46, 47, 48],
      'Student Enrollment': [19, 20, 21, 22]
    };
    
    // Create a mapping of the grouped questions
    const groupedQuestions = {};
    
    // Initialize empty arrays for each group
    Object.keys(groups).forEach(groupName => {
      groupedQuestions[groupName] = [];
    });
    
    // Add questions to their respective groups
    questions.forEach(question => {
      // Find which group this question belongs to
      for (const [groupName, questionIds] of Object.entries(groups)) {
        if (questionIds.includes(question.id)) {
          groupedQuestions[groupName].push(question);
          break;
        }
      }
    });
    
    return groupedQuestions;
  };
  
  // Generate test data for development only
  const generateDummyData = () => {
    const dummyAnswers = {};
    
    questions.forEach(question => {
      // For number questions, generate a random number between 1-20
      dummyAnswers[question.id] = Math.floor(Math.random() * 20) + 1;
    });
    
    // If we have districts, select the first one
    let districtId = '';
    let regionId = '';
    
    if (filteredDistricts.length > 0) {
      districtId = filteredDistricts[0].id.toString();
      regionId = filteredDistricts[0].region_id.toString();
    } else if (districts.length > 0) {
      districtId = districts[0].id.toString();
      regionId = districts[0].region_id.toString();
    }
    
    setFormData({
      district_id: districtId,
      region_id: regionId,
      itinerary_id: itineraryId,
      answers: dummyAnswers
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
  
  // Get question groups for better organization
  const questionGroups = getQuestionGroups();
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
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
          You are submitting data for itinerary: <strong>{itinerary.title}</strong> ({new Date(itinerary.start_date).toLocaleDateString()} to {new Date(itinerary.end_date).toLocaleDateString()})
        </Alert>
      )}
      
      {existingSubmission && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          You already have a submission for this itinerary. Submitting again will update your previous data.
        </Alert>
      )}
      
      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              District Selection
            </Typography>
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6}}>
                <FormControl fullWidth required>
                  <InputLabel id="region-select-label">Region</InputLabel>
                  <Select
                    labelId="region-select-label"
                    id="region_id"
                    name="region_id"
                    value={formData.region_id}
                    onChange={handleRegionChange}
                    label="Region"
                  >
                    <MenuItem value="">Select a region</MenuItem>
                    {regions.map(region => (
                      <MenuItem key={region.id} value={region.id.toString()}>
                        {region.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid size={{ xs: 12, md: 6}}>
                <FormControl fullWidth required>
                  <InputLabel id="district-select-label">District</InputLabel>
                  <Select
                    labelId="district-select-label"
                    id="district_id"
                    name="district_id"
                    value={formData.district_id}
                    onChange={handleDistrictChange}
                    label="District"
                    disabled={!formData.region_id}
                  >
                    <MenuItem value="">Select a district</MenuItem>
                    {filteredDistricts.map(district => (
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
        
        {/* Render question groups */}
        {Object.keys(questionGroups).map(groupName => {
          const groupQuestions = questionGroups[groupName];
          
          // Only render groups that have questions
          if (groupQuestions.length === 0) return null;
          
          return (
            <Card key={groupName} sx={{ mb: 4 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {groupName}
                </Typography>
                
                <Grid container spacing={3}>
                  {groupQuestions.map(question => (
                    <Grid item xs={12} md={6} key={question.id}>
                      <TextField
                        fullWidth
                        label={question.question}
                        type="number"
                        InputProps={{ inputProps: { min: 0 } }}
                        name={`question_${question.id}`}
                        value={formData.answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        required={question.is_required}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          );
        })}
        
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
            disabled={saving || !formData.district_id}
            sx={{ minWidth: 150 }}
          >
            {saving ? 'Saving...' : 'Submit Data'}
          </Button>
        </Box>
      </form>
      
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