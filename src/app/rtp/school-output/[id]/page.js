'use client';

import React, { useState, useEffect, use } from 'react';
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
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress
} from '@mui/material';
import { useSession } from "next-auth/react";
import { useProgramContext } from "@/context/ProgramContext";
import { useRouter } from 'next/navigation';
import { useNotification } from '@/components/NotificationProvider';

export default function SchoolOutputForm({ params }) {
  // Unwrap params promise to access route params
  const paramsObj = use(params);
  const itineraryId = paramsObj.id;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [itinerary, setItinerary] = useState(null);
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schoolData, setSchoolData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  
  // Access the notification system
  const { showNotification } = useNotification();
  
  // New state for hierarchical selection
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCircuit, setSelectedCircuit] = useState('');
  
  // Loading and error states
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingCircuits, setIsLoadingCircuits] = useState(false);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [apiErrors, setApiErrors] = useState({
    districts: null,
    circuits: null,
    schools: null
  });
  
  const { data: session, status } = useSession();
  const { currentProgram } = useProgramContext();
  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isRtpAuthorized = user?.programRoles?.some(pr => pr.program_code === "rtp") || false;
  
  const router = useRouter();
  
  // Fetch itinerary details, regions list, and questions
  useEffect(() => {
    if (isAuthenticated) {
      fetchItineraryDetails();
      fetchRegions();
      fetchQuestions();
    }
  }, [isAuthenticated, itineraryId, fetchItineraryDetails]); // Added fetchItineraryDetails
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Fetch itinerary details from backend
  const fetchItineraryDetails = useCallback(async () => {
    try {
      const res = await fetch(`/api/rtp/itineraries/${itineraryId}`);
      if (!res.ok) throw new Error('Failed to load itinerary');
      const json = await res.json();
      // Access the itinerary directly rather than from json.data
      setItinerary(json);
    } catch (e) {
      console.error('Error loading itinerary:', e);
    }
  }, [itineraryId]);
  
  // Fetch regions
  const fetchRegions = async () => {
    try {
      const res = await fetch('/api/regions');
      if (!res.ok) throw new Error('Failed to load regions');
      const json = await res.json();
      if (json && json.data) {
        setRegions(json.data);
      }
    } catch (e) {
      console.error('Failed to load regions', e);
    }
  };
  
  // Fetch districts when region changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedRegion) {
        setDistricts([]);
        setSelectedDistrict('');
        return;
      }
      
      setIsLoadingDistricts(true);
      setApiErrors(prev => ({ ...prev, districts: null }));
      
      try {
        const res = await fetch(`/api/districts?limit=-1&region_id=${selectedRegion}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to load districts');
        }
        const json = await res.json();
        if (json && json.success && json.data) {
          setDistricts(json.data.districts || []);
        } else {
          throw new Error(json.error || 'Invalid response format');
        }
        // Reset dependent selectors
        setSelectedDistrict('');
        setSelectedCircuit('');
        setSelectedSchool(null);
        setSchoolData(null);
      } catch (e) {
        console.error('Failed to load districts', e);
        setApiErrors(prev => ({ ...prev, districts: e.message }));
        setDistricts([]);
      } finally {
        setIsLoadingDistricts(false);
      }
    };
    
    fetchDistricts();
  }, [selectedRegion]);
  
  // Fetch circuits when district changes
  useEffect(() => {
    const fetchCircuits = async () => {
      if (!selectedDistrict) {
        setCircuits([]);
        setSelectedCircuit('');
        return;
      }
      
      setIsLoadingCircuits(true);
      setApiErrors(prev => ({ ...prev, circuits: null }));
      
      try {
        const res = await fetch(`/api/circuits?limit=-1&district_id=${selectedDistrict}`);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to load circuits');
        }
        const json = await res.json();
        if (json && json.success && json.data) {
          setCircuits(json.data.circuits || []);
        } else {
          throw new Error(json.error || 'Invalid response format');
        }
        // Reset dependent selectors
        setSelectedCircuit('');
        setSelectedSchool(null);
        setSchoolData(null);
      } catch (e) {
        console.error('Failed to load circuits', e);
        setApiErrors(prev => ({ ...prev, circuits: e.message }));
        setCircuits([]);
      } finally {
        setIsLoadingCircuits(false);
      }
    };
    
    fetchCircuits();
  }, [selectedDistrict]);
  
  // Fetch schools based on selected filters
  useEffect(() => {
    const fetchFilteredSchools = async () => {
      if (!selectedRegion && !selectedDistrict && !selectedCircuit) {
        setSchools([]);
        return;
      }
      
      setIsLoadingSchools(true);
      setApiErrors(prev => ({ ...prev, schools: null }));
      
      try {
        let url = `/api/rtp/schools?itinerary_id=${itineraryId}&response_status=not-responded`;
        
        if (selectedRegion) url += `&region_id=${selectedRegion}`;
        if (selectedDistrict) url += `&district_id=${selectedDistrict}`;
        if (selectedCircuit) url += `&circuit_id=${selectedCircuit}`;
        
        const res = await fetch(url);
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to load schools');
        }
        const json = await res.json();
        setSchools(json.schools || []);
        
        // Reset school selection
        setSelectedSchool(null);
        setSchoolData(null);
      } catch (e) {
        console.error('Failed to load schools', e);
        setApiErrors(prev => ({ ...prev, schools: e.message }));
        setSchools([]);
      } finally {
        setIsLoadingSchools(false);
      }
    };
    
    fetchFilteredSchools();
  }, [selectedRegion, selectedDistrict, selectedCircuit, itineraryId]);

  // Fetch questions
  const fetchQuestions = async () => {
    try {
      const res = await fetch(`/api/rtp/questions?category_id=1`);
      // const res = await fetch(`/api/rtp/questions?itinerary_id=${itineraryId}&category_id=1&survey_type=school-output`);
      if (!res.ok) throw new Error('Failed to load questions');
      const data = await res.json();
      setQuestions(data.questions || []);
      // Initialize answers
      const init = {};
      (data.questions || []).forEach(q => { init[q.id] = ''; });
      setAnswers(init);
    } catch (e) {
      console.error('Failed to load questions', e);
      // Even if questions fail to load, we should set an empty array
      // so the page can continue loading
      setQuestions([]);
      setAnswers({});
    }
  };

  // Handle answer change
  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Use console.log to debug the payload in the browser console
      console.log('Preparing to submit answers here:', answers);
      
      const payload = {
        itinerary_id: parseInt(itineraryId),
        school_id: schoolData.school_id,
        user_id: user.id,
        region_id: schoolData.regionId,
        district_id: schoolData.districtId,
        circuit_id: schoolData.circuitId,
        answers: Object.entries(answers).map(([qid, val]) => ({ 
          question_id: parseInt(qid), 
          answer: val  // Make sure we're using 'answer' field name as expected by API
        }))
      };
      
      console.log('Submitting payload:', payload);
      
      const resp = await fetch('/api/rtp/school-responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!resp.ok) {
        const errorData = await resp.json();
        throw new Error(errorData.error || 'Save failed');
      }
      
      setSubmitSuccess(true);
      showNotification('Form submitted successfully!', 'success');
      setTimeout(() => router.push('/rtp'), 2000);
    } catch (err) {
      console.error('Form submission error:', err);
      showNotification('Form submission failed: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading || !itinerary) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <LinearProgress />
        <Typography sx={{ mt: 2 }}>Loading form...</Typography>
      </Container>
    );
  }

  // New: Show message if questions are empty
  if (questions.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 4, borderRadius: 2 }}>
          <Alert severity="warning" sx={{ mb: 4 }}>
            No questions are available for this form. Please contact an administrator.
          </Alert>
          <Button variant="contained" onClick={() => router.push('/rtp')}>
            Return to Dashboard
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {/* Region selector */}
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel id="region-select-label">Select Region</InputLabel>
            <Select
              labelId="region-select-label"
              value={selectedRegion}
              label="Select Region"
              onChange={e => setSelectedRegion(e.target.value)}
            >
              <MenuItem value="">All Regions</MenuItem>
              {regions.map(r => (
                <MenuItem key={r.id} value={r.id.toString()}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* District selector */}
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth disabled={!selectedRegion || isLoadingDistricts}>
            <InputLabel id="district-select-label">Select District</InputLabel>
            <Select
              labelId="district-select-label"
              value={selectedDistrict}
              label="Select District"
              onChange={e => setSelectedDistrict(e.target.value)}
              endAdornment={isLoadingDistricts && <CircularProgress size={20} />}
            >
              <MenuItem value="">All Districts</MenuItem>
              {districts.map(d => (
                <MenuItem key={d.id} value={d.id.toString()}>
                  {d.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {apiErrors.districts && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {apiErrors.districts}
            </Alert>
          )}
        </Box>

        {/* Circuit selector */}
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth disabled={!selectedDistrict || isLoadingCircuits}>
            <InputLabel id="circuit-select-label">Select Circuit</InputLabel>
            <Select
              labelId="circuit-select-label"
              value={selectedCircuit}
              label="Select Circuit"
              onChange={e => setSelectedCircuit(e.target.value)}
              endAdornment={isLoadingCircuits && <CircularProgress size={20} />}
            >
              <MenuItem value="">All Circuits</MenuItem>
              {circuits.map(c => (
                <MenuItem key={c.id} value={c.id.toString()}>
                  {c.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {apiErrors.circuits && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {apiErrors.circuits}
            </Alert>
          )}
        </Box>

        {/* School selector */}
        <Box sx={{ mb: 4 }}>
          <FormControl fullWidth disabled={!selectedRegion || isLoadingSchools}>
            <InputLabel id="school-select-label">Select School</InputLabel>
            <Select
              labelId="school-select-label"
              value={selectedSchool?.school_id || selectedSchool?.id ||''}
              label="Select School"
              onChange={e => {
                const schoolObj = schools.find(s => s.school_id === e.target.value);
                setSelectedSchool(schoolObj);
                if (schoolObj) {
                  console.log('Selected school obj:', schoolObj); // Debug log
                  
                  // Ensure circuit_id is properly set
                  const circuitId = schoolObj.circuit_id !== undefined && schoolObj.circuit_id !== null 
                    ? schoolObj.circuit_id 
                    : (selectedCircuit ? parseInt(selectedCircuit) : null);
                  
                  if (!circuitId) {
                    console.warn('Warning: Circuit ID not found in school object or in selected circuit. School data:', schoolObj);
                  }
                  
                  setSchoolData({
                    id: schoolObj.school_id || schoolObj.id,
                    school_id: schoolObj.school_id || schoolObj.id,
                    name: schoolObj.school_name,
                    gesCode: schoolObj.ges_code,
                    schoolType: schoolObj.is_galop ? 'GALOP' : 'Non-GALOP',
                    district: schoolObj.district_name,
                    region: schoolObj.region_name,
                    districtId: schoolObj.district_id,
                    regionId: schoolObj.region_id,
                    circuitId: circuitId || 0
                  });
                }
              }}
              endAdornment={isLoadingSchools && <CircularProgress size={20} />}
            >
              {schools.length === 0 ? (
                <MenuItem value="" disabled>No schools available with current filters</MenuItem>
              ) : (
                schools.map(s => (
                  <MenuItem key={s.school_id} value={s.school_id}>
                    {s.school_name}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
          {apiErrors.schools && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {apiErrors.schools}
            </Alert>
          )}
        </Box>

        {submitSuccess && (
          <Alert severity="success" sx={{ mb: 4 }}>
            Form submitted successfully! Redirecting...
          </Alert>
        )}
        
        <Box sx={{ mb: 4 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            You are submitting data for: <strong>{schoolData?.name || '...'}</strong> in {schoolData?.district || '...'} ({itinerary.title})
          </Alert>
        </Box>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Itinerary Details</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>Title:</strong> {itinerary.title}</Typography>
              <Typography variant="body1">
                <strong>Period:</strong> {new Date(itinerary.from_date).toLocaleDateString()} - {new Date(itinerary.until_date).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body1"><strong>School:</strong> {schoolData?.name || '...'}</Typography>
              <Typography variant="body1"><strong>District:</strong> {schoolData?.district || '...'}</Typography>
              <Typography variant="body1"><strong>GES Code:</strong> {schoolData?.gesCode || '...'}</Typography>
              <Typography variant="body1"><strong>GALOP Status:</strong> {schoolData?.schoolType || '...'}</Typography>
            </Grid>
          </Grid>
        </Paper>
        
        {schoolData && (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              {questions.map(q => (
                <Box key={q.id} mb={2}>
                  <Typography>{q.question}</Typography>
                  {q.options ? (
                    <select
                      value={answers[q.id]}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      required
                    >
                      <option value="">Select...</option>
                      {q.options.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <TextField
                      fullWidth
                      value={answers[q.id]}
                      onChange={e => handleAnswerChange(q.id, e.target.value)}
                      required={q.is_required}
                      margin="normal"
                    />
                  )}
                </Box>
              ))}
              <Box sx={{ mt: 4, textAlign: 'right' }}>
                <Button type="submit" variant="contained" disabled={isSubmitting || !selectedSchool}>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
        )}
      </Paper>
    </Container>
  );
}