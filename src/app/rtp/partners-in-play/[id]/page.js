'use client';

import { useState, useEffect } from 'react';
import { use } from 'react';
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
  Tooltip,
  FormHelperText,
  CircularProgress
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { useProgramContext } from "@/context/ProgramContext";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

export default function PartnersInPlayWithItinerary({ params }) {
  const { data: session, status } = useSession();
  const { currentProgram } = useProgramContext();
  const user = session?.user;
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";
  const isRtpAuthorized = user?.programRoles?.some(pr => pr.program_code === "rtp") || false;
  
  const router = useRouter();
  // Unwrap params using React.use()
  const unwrappedParams = use(params);
  const itineraryId = unwrappedParams.id;
  
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
    observer_name: user?.first_name + ' ' + user?.last_name || '',
    actual_time: new Date().toISOString(),      // record submission time
    gps_location: '',                            // will capture via Geolocation API
    level_of_intervention: '',                   // Question 2
    academic_year: '',                           // Question 8
    term: '',                                    // Question 9
    topic_strand: '',                            // Question 73
    sub_topic: '',                               // Question 74
    reference_material: '',                      // Question 75
    planned_time: '',                            // Question 76
    activity_type: ''                            // Question 77
  });

  // Capture geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setFormData(prev => ({
            ...prev,
            gps_location: `${pos.coords.latitude},${pos.coords.longitude}`
          }));
        },
        (err) => console.warn('Geolocation error:', err)
      );
    }
  }, []);
  
  // UI state
  const [loading, setLoading] = useState(false); // Only for initial load
  const [saving, setSaving] = useState(false);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [circuits, setCircuits] = useState([]);
  const [schools, setSchools] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  const [currentItinerary, setCurrentItinerary] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // Loading states for dropdowns
  const [regionsLoading, setRegionsLoading] = useState(false);
  const [districtsLoading, setDistrictsLoading] = useState(false);
  const [circuitsLoading, setCircuitsLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [teachersLoading, setTeachersLoading] = useState(false);
  
  // Selected IDs for drill-down filtering
  const [selectedRegionId, setSelectedRegionId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedCircuitId, setSelectedCircuitId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Snackbar close handler
  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };
  
  // Define the sections of the form
  const sections = [
    'Basic Information',
    // 'Lesson Details',
    'Classroom Environment',
    'Lesson Planning & Structure',
    'Teaching Methodology',
    'Teacher Communication',
    'Student Participation',
    'Assessment Practices',
    'Overall Reflection',
    'Review & Submit'
  ];
  
  // Load data for regions, itineraries, and questions
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setRegionsLoading(true);
      try {
        // Fetch regions
        const regionsResponse = await fetch('/api/regions');
        const regionsData = await regionsResponse.json();
        setRegions(regionsData.data);
        setRegionsLoading(false);
        
        // Fetch current itinerary details
        const itineraryResponse = await fetch(`/api/rtp/itineraries/${itineraryId}`);
        const itineraryData = await itineraryResponse.json();
        
        if (itineraryData) {          
          setCurrentItinerary(itineraryData);
          setFormData(prev => ({
            ...prev,
            itinerary_id: itineraryId,
            observer_name: user?.first_name + ' ' + user?.last_name || '', // Set default observer to current user
          }));

          // Fetch questions for this itinerary (Partners in Play)
          setQuestionsLoading(true);
          try {
            const questionsResponse = await fetch(
              `/api/rtp/questions?category_id=4,5`
            );
            const questionsData = await questionsResponse.json();
            setQuestions(questionsData.questions || []);
          } catch (err) {
            setQuestions([]);
          } finally {
            setQuestionsLoading(false);
          }
        }
      } catch (error) {
        setRegionsLoading(false);
        console.error('Error fetching initial data:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load initial data',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated, itineraryId, user?.name, user?.first_name, user?.last_name]);
  
  // Fetch districts when a region is selected
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedRegionId) {
        setDistricts([]);
        setSelectedDistrictId('');
        return;
      }
      
      setDistrictsLoading(true);
      try {
        const response = await fetch(`/api/districts?regionId=${selectedRegionId}`);
        const data = await response.json();
        setDistricts(data.data.districts);
      } catch (error) {
        console.error('Error fetching districts:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load districts',
          severity: 'error'
        });
      } finally {
        setDistrictsLoading(false);
      }
    };
    
    fetchDistricts();
  }, [selectedRegionId]);
  
  // Fetch circuits when a district is selected
  useEffect(() => {
    const fetchCircuits = async () => {
      if (!selectedDistrictId) {
        setCircuits([]);
        setSelectedCircuitId('');
        return;
      }
      
      setCircuitsLoading(true);
      try {
        const response = await fetch(`/api/circuits?districtId=${selectedDistrictId}`);
        const data = await response.json();
        setCircuits(data.data.circuits);
      } catch (error) {
        console.error('Error fetching circuits:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load circuits',
          severity: 'error'
        });
      } finally {
        setCircuitsLoading(false);
      }
    };
    
    fetchCircuits();
  }, [selectedDistrictId]);
  
  // Fetch schools when a circuit is selected
  useEffect(() => {
    const fetchSchools = async () => {
      if (!selectedCircuitId) {
        setSchools([]);
        return;
      }
      
      setSchoolsLoading(true);
      try {
        const response = await fetch(`/api/schools?circuitId=${selectedCircuitId}`);
        const data = await response.json();
        setSchools(data.data.schools);
      } catch (error) {
        console.error('Error fetching schools:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load schools',
          severity: 'error'
        });
      } finally {
        setSchoolsLoading(false);
      }
    };
    
    fetchSchools();
  }, [selectedCircuitId]);
  
  // Fetch teachers when a school is selected
  useEffect(() => {
    const fetchTeachers = async () => {
      if (!formData.school_id) {
        setTeachers([]);
        return;
      }
      
      setTeachersLoading(true);
      try {
        const response = await fetch(`/api/teachers?schoolId=${formData.school_id}`);
        const data = await response.json();
        setTeachers(data.teachers);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        setSnackbar({
          open: true,
          message: 'Failed to load teachers',
          severity: 'error'
        });
      } finally {
        setTeachersLoading(false);
      }
    };
    
    fetchTeachers();
  }, [formData.school_id]);
  
  // Handle selection changes for hierarchical dropdowns
  const handleRegionChange = (e) => {
    setSelectedRegionId(e.target.value);
    // Reset dependent selections
    setSelectedDistrictId('');
    setSelectedCircuitId('');
    setFormData(prev => ({
      ...prev,
      school_id: '',
      teacher_id: ''
    }));
  };
  
  const handleDistrictChange = (e) => {
    setSelectedDistrictId(e.target.value);
    // Reset dependent selections
    setSelectedCircuitId('');
    setFormData(prev => ({
      ...prev,
      school_id: '',
      teacher_id: ''
    }));
  };
  
  const handleCircuitChange = (e) => {
    setSelectedCircuitId(e.target.value);
    // Reset dependent selections
    setFormData(prev => ({
      ...prev,
      school_id: '',
      teacher_id: ''
    }));
  };
  
  const handleTeacherChange = (e) => {
    const selectedTeacher = teachers.find(t => t.id.toString() === e.target.value);
    
    setSelectedTeacherId(e.target.value);
    setFormData(prev => ({
      ...prev,
      teacher_id: e.target.value,
      teacher_name: selectedTeacher ? `${selectedTeacher.first_name} ${selectedTeacher.last_name}` : ''
    }));
  };
  
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
  
  // --- SECTION GROUPING LOGIC FOR PARTNERS IN PLAY ---
  // Map question IDs to section headers (update as needed)
  const sectionMap = [
    // { header: 'Lesson Details', ids: [77] },
    { header: 'Classroom Demographics', ids: [77, 78, 79, 80, 81] },
    { header: 'Classroom Environment', ids: [97, 98, 99, 102, 117] },
    { header: 'Lesson Planning & Structure', ids: [85, 86, 87, 88, 89, 100, 101, 113] },
    { header: 'Teaching Methodology', ids: [90, 91, 92, 93, 103, 104, 111, 114, 119] },
    { header: 'Teacher Communication', ids: [82, 83, 84, 94, 95, 96, 105, 106, 107, 108, 109, 110] },
    { header: 'Student Participation', ids: [112, 115, 116, 118, 120] },
    { header: 'Overall Reflection', ids: [121, 122] }
    // Review & Submit is handled manually in step case
  ];

  // Group questions by section
  const groupedQuestions = sectionMap.map(section => ({
    header: section.header,
    questions: questions.filter(q => section.ids.includes(q.id))
  }));

  // Dynamic answers state
  const [answers, setAnswers] = useState([]);

  // Sync answers with questions (for dummy data and on load)
  useEffect(() => {
    if (questions.length > 0) {
      setAnswers(
        questions.map(q => ({
          question_id: q.id,
          answer_value: '',
          score: null
        }))
      );
    }
  }, [questions]);

  // Handle dynamic answer change
  const handleDynamicAnswerChange = (questionId, value) => {
    setAnswers(prev => prev.map(ans =>
      ans.question_id === questionId ? { ...ans, answer_value: value } : ans
    ));
  };

  // New handler for multiple-select checkbox toggles
  const handleMultipleSelect = (questionId, option) => {
    setAnswers(prev => prev.map(ans => {
      if (ans.question_id !== questionId) return ans;
      const current = ans.answer_value ? ans.answer_value.split(',') : [];
      const updated = current.includes(option)
        ? current.filter(v => v !== option)
        : [...current, option];
      return { ...ans, answer_value: updated.join(',') };
    }));
  };

  // Render grouped questions for the current step
  const renderGroupedSection = (sectionIdx) => {
    const section = groupedQuestions[sectionIdx - 1];
    if (!section || !section.questions.length) return <Typography>No questions for this section.</Typography>;
    return (
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>{section.header}</Typography>
        <Grid container spacing={3}>
          {section.questions.map(q => {
            const ans = answers.find(a => a.question_id === q.id) || {};
            return (
              <Grid item xs={12} key={q.id}>
                <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
                  <FormLabel component="legend">{q.question}</FormLabel>
                  {q.answers && q.answers.length > 0 ? (
                    q.close_ended_answer_form === 'multiple_select' ? (
                      <FormGroup>
                        {q.answers.map(opt => (
                          <FormControlLabel
                            key={opt.id}
                            control={
                              <Checkbox
                                checked={ans.answer_value?.split(',').includes(opt.id.toString()) || false}
                                onChange={() => handleMultipleSelect(q.id, opt.id.toString())}
                              />
                            }
                            label={opt.answer_option}
                          />
                        ))}
                      </FormGroup>
                    ) : (
                      <RadioGroup
                        value={ans.answer_value || ''}
                        onChange={e => handleDynamicAnswerChange(q.id, e.target.value)}
                        row
                      >
                        {q.answers.map(opt => (
                          <FormControlLabel
                            key={opt.id}
                            value={opt.id.toString()}
                            control={<Radio />}
                            label={opt.answer_option}
                          />
                        ))}
                      </RadioGroup>
                    )
                  ) : (
                    <TextField
                      value={ans.answer_value || ''}
                      onChange={e => handleDynamicAnswerChange(q.id, e.target.value)}
                      fullWidth
                    />
                  )}
                </FormControl>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    );
  };

  // Update renderSection to handle all intermediate steps dynamically
  const renderSection = () => {
    if (activeStep === 0) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Basic Information
            </Typography>
            
            <Grid container spacing={3}>
              {/* Region Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required sx={{ mb: 3 }} disabled={regionsLoading}>
                  <InputLabel id="region-select-label">Region</InputLabel>
                  <Select
                    labelId="region-select-label"
                    value={selectedRegionId}
                    onChange={handleRegionChange}
                    label="Region"
                    endAdornment={regionsLoading ? <CircularProgress size={20} sx={{ mr: 2 }} /> : null}
                  >
                    <MenuItem value="">Select a region</MenuItem>
                    {regions.map(region => (
                      <MenuItem key={region.id} value={region.id.toString()}>
                        {region.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {regionsLoading && <FormHelperText>Loading regions...</FormHelperText>}
                </FormControl>
              </Grid>
              
              {/* District Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required sx={{ mb: 3 }} disabled={!selectedRegionId || districtsLoading}>
                  <InputLabel id="district-select-label">District</InputLabel>
                  <Select
                    labelId="district-select-label"
                    value={selectedDistrictId}
                    onChange={handleDistrictChange}
                    label="District"
                    endAdornment={districtsLoading ? <CircularProgress size={20} sx={{ mr: 2 }} /> : null}
                  >
                    <MenuItem value="">Select a district</MenuItem>
                    {districts.map(district => (
                      <MenuItem key={district.id} value={district.id.toString()}>
                        {district.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {districtsLoading && <FormHelperText>Loading districts...</FormHelperText>}
                </FormControl>
              </Grid>
              
              {/* Circuit Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required sx={{ mb: 3 }} disabled={!selectedDistrictId || circuitsLoading}>
                  <InputLabel id="circuit-select-label">Circuit</InputLabel>
                  <Select
                    labelId="circuit-select-label"
                    value={selectedCircuitId}
                    onChange={handleCircuitChange}
                    label="Circuit"
                    endAdornment={circuitsLoading ? <CircularProgress size={20} sx={{ mr: 2 }} /> : null}
                  >
                    <MenuItem value="">Select a circuit</MenuItem>
                    {circuits.map(circuit => (
                      <MenuItem key={circuit.id} value={circuit.id.toString()}>
                        {circuit.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {circuitsLoading && <FormHelperText>Loading circuits...</FormHelperText>}
                </FormControl>
              </Grid>
              
              {/* School Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required sx={{ mb: 3 }} disabled={!selectedCircuitId || schoolsLoading}>
                  <InputLabel id="school-select-label">School</InputLabel>
                  <Select
                    labelId="school-select-label"
                    name="school_id"
                    value={formData.school_id}
                    onChange={handleChange}
                    label="School"
                    endAdornment={schoolsLoading ? <CircularProgress size={20} sx={{ mr: 2 }} /> : null}
                  >
                    <MenuItem value="">Select a school</MenuItem>
                    {schools.length > 500 ? (
                      <MenuItem disabled value="">
                        Too many schools to display. Please refine your selection.
                      </MenuItem>
                    ) : (
                      schools.map(school => (
                        <MenuItem key={school.id} value={school.id.toString()}>
                          {school.name}
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {schoolsLoading && <FormHelperText>Loading schools...</FormHelperText>}
                  {schools.length > 500 && <FormHelperText error>Too many schools loaded. Please refine your selection.</FormHelperText>}
                </FormControl>
              </Grid>
              
              {/* Teacher Selection */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required sx={{ mb: 3 }} disabled={!formData.school_id || teachersLoading}>
                  <InputLabel id="teacher-select-label">Teacher</InputLabel>
                  <Select
                    labelId="teacher-select-label"
                    value={selectedTeacherId}
                    onChange={handleTeacherChange}
                    label="Teacher"
                    endAdornment={teachersLoading ? <CircularProgress size={20} sx={{ mr: 2 }} /> : null}
                  >
                    <MenuItem value="">Select a teacher</MenuItem>
                    {teachers.map(teacher => (
                      <MenuItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.first_name} {teacher.last_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {teachersLoading && <FormHelperText>Loading teachers...</FormHelperText>}
                </FormControl>
              </Grid>
              
              {/* Itinerary Selection (always show name) */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled sx={{ mb: 3 }}>
                  <InputLabel id="itinerary-select-label">Itinerary</InputLabel>
                  <Select
                    labelId="itinerary-select-label"
                    name="itinerary_id"
                    value={formData.itinerary_id}
                    label="Itinerary"
                  >
                    {currentItinerary ? (
                      <MenuItem value={currentItinerary.id.toString()}>
                        {currentItinerary.title}
                      </MenuItem>
                    ) : (
                      <MenuItem value="">No itinerary found</MenuItem>
                    )}
                  </Select>
                  <FormHelperText>
                    {currentItinerary && currentItinerary.title ? 'Itinerary is pre-selected based on your selection' : 'No itinerary found'}
                  </FormHelperText>
                </FormControl>
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
              
              {/* Level of Intervention */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required sx={{ mb: 3 }}>
                  <InputLabel id="intervention-label">Level of Intervention</InputLabel>
                  <Select
                    labelId="intervention-label"
                    name="level_of_intervention"
                    value={formData.level_of_intervention}
                    onChange={handleChange}
                    label="Level of Intervention"
                  >
                    <MenuItem value="">Select a level</MenuItem>
                    <MenuItem value="GALOP">GALOP</MenuItem>
                    <MenuItem value="Direct">Direct</MenuItem>
                    <MenuItem value="Indirect">Indirect</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* Academic Year */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Academic Year"
                  name="academic_year"
                  value={formData.academic_year}
                  onChange={handleChange}
                  required
                  sx={{ mb: 3 }}
                />
              </Grid>

              {/* Term */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required sx={{ mb: 3 }}>
                  <InputLabel id="term-label">Term</InputLabel>
                  <Select
                    labelId="term-label"
                    name="term"
                    value={formData.term}
                    onChange={handleChange}
                    label="Term"
                  >
                    <MenuItem value="">Select a term</MenuItem>
                    <MenuItem value="First Term">First Term</MenuItem>
                    <MenuItem value="Second Term">Second Term</MenuItem>
                    <MenuItem value="Third Term">Third Term</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {/* GPS Location (read-only) */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="GPS Location"
                  name="gps_location"
                  value={formData.gps_location}
                  InputProps={{ readOnly: true }}
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
                    <MenuItem value="">Select a class level</MenuItem>
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
                    <MenuItem value="">Select a subject</MenuItem>
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

              {/* Topic/Strand of Lesson Observed */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Topic/Strand of Lesson Observed"
                  name="topic_strand"
                  value={formData.topic_strand}
                  onChange={handleChange}
                  required
                  sx={{ mb: 3 }}
                />
              </Grid>

              {/* Sub Topic/Sub Strand */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Sub Topic/Sub Strand of Lesson Observed"
                  name="sub_topic"
                  value={formData.sub_topic}
                  onChange={handleChange}
                  required
                  sx={{ mb: 3 }}
                />
              </Grid>

              {/* Reference Material of Lesson Observed */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Reference Material of Lesson Observed"
                  name="reference_material"
                  value={formData.reference_material}
                  onChange={handleChange}
                  required
                  sx={{ mb: 3 }}
                />
              </Grid>

              {/* Planned Time of Lesson Observed */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Planned Time of Lesson Observed"
                  name="planned_time"
                  value={formData.planned_time}
                  onChange={handleChange}
                  placeholder="e.g., 60 minutes"
                  required
                  sx={{ mb: 3 }}
                />
              </Grid>

              {/* Activity Type */}
              <Grid item xs={12} md={6}>
                <FormControl fullWidth required sx={{ mb: 3 }}>
                  <InputLabel id="activity-type-label">Activity Type</InputLabel>
                  <Select
                    labelId="activity-type-label"
                    name="activity_type"
                    value={formData.activity_type}
                    onChange={handleChange}
                    label="Activity Type"
                  >
                    <MenuItem value="">Select activity</MenuItem>
                    <MenuItem value="Demonstration Lesson">Demonstration Lesson</MenuItem>
                    <MenuItem value="Peer Teaching">Peer Teaching</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      );
    } else if (activeStep === sections.length - 1) {
      return (
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Review & Submit</Typography>
            <Alert severity="info" sx={{ mb: 3 }}>Please review your responses before submitting. Once submitted, you may not be able to make changes.</Alert>
            <List>
              <ListItem><ListItemText primary="School" secondary={schools.find(s => s.id.toString() === formData.school_id)?.name || 'Not selected'} /></ListItem>
              <ListItem><ListItemText primary="Teacher" secondary={formData.teacher_name || 'Not provided'} /></ListItem>
              <ListItem><ListItemText primary="Class Level" secondary={formData.class_level || 'Not selected'} /></ListItem>
              <ListItem><ListItemText primary="Subject" secondary={formData.subject || 'Not selected'} /></ListItem>
              <Divider />
              {answers.map(ans => {
                const q = questions.find(q => q.id === ans.question_id);
                const selectedOption = q?.answers?.find(opt => opt.id.toString() === ans.answer_value);
                return <ListItem key={ans.question_id}><ListItemText primary={q?.question || `Q${ans.question_id}`} secondary={selectedOption?.answer_option || ans.answer_value} /></ListItem>;
              })}
            </List>
          </CardContent>
        </Card>
      );
    } else {
      return renderGroupedSection(activeStep);
    }
  };

  // Stepper navigation handlers
  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  // Update handleSubmit to POST to API
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        itinerary_id: formData.itinerary_id,
        school_id: formData.school_id,
        teacher_id: selectedTeacherId,
        class_id: null,
        subject: formData.subject,
        submitted_by: user?.id,
        // Format as MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
        submitted_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        answers
      };
      const res = await fetch('/api/rtp/partners-in-play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed to submit');
      setSnackbar({ open: true, message: 'Partners in Play survey submitted successfully!', severity: 'success' });
      setTimeout(() => { router.push('/rtp'); }, 2000);
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to submit Partners in Play survey', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Unified dummy data loader for testing both metadata and answers
  const fillWithDummyData = () => {
    // populate metadata with dummy selections
    const regionId = regions[0]?.id.toString() || '';
    const districtId = districts[0]?.id.toString() || '';
    const circuitId = circuits[0]?.id.toString() || '';
    const schoolId = schools[0]?.id.toString() || '';
    const teacherId = teachers[0]?.id.toString() || '';
    setSelectedRegionId(regionId);
    setSelectedDistrictId(districtId);
    setSelectedCircuitId(circuitId);
    setSelectedTeacherId(teacherId);
    setFormData(prev => ({
      ...prev,
      school_id: schoolId,
      teacher_id: teacherId,
      class_level: 'KG 1',
      subject: 'Mathematics',
      academic_year: '2025',
      term: 'First Term',
      level_of_intervention: 'Direct',
      topic_strand: 'Test strand',
      sub_topic: 'Test sub-topic',
      reference_material: 'Test materials',
      planned_time: '60 minutes',
      activity_type: 'Demonstration Lesson'
    }));
    // populate all dynamic answers
    setAnswers(
      questions.map(q => {
        let answerValue;
        if (q.answers && q.answers.length) {
          if (q.close_ended_answer_form === 'multiple_select') {
            answerValue = q.answers.map(opt => opt.id.toString()).join(',');
          } else {
            answerValue = q.answers[0].id.toString();
          }
        } else {
          answerValue = 'Sample text answer';
        }
        return { question_id: q.id, answer_value: answerValue, score: null };
      })
    );
    setSnackbar({ open: true, message: 'Form filled with dummy data for testing', severity: 'info' });
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
                {currentItinerary ? currentItinerary.title : `Itinerary ${itineraryId}`}
              </span>
              {' / '}
              <span style={{ marginLeft: '4px' }}>Partners in Play</span>
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>  
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Purpose: This survey assesses teacher performance using play-based learning and gender-responsive methodologies during classroom observations.
            </Typography>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Scope: Evaluates classroom environment, teaching methodology, student engagement, lesson planning, and gender responsiveness.
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Target Users: Observers (district personnel), Teachers, and Administrators.
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
        
        <form onSubmit={e => e.preventDefault()}>
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
                type="button"
                disabled={saving}
                onClick={handleSubmit}
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