"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Divider,
  Alert,
  Paper,
  IconButton,
  MobileStepper,
  useMediaQuery,
  useTheme,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText
} from '@mui/material';
import { fetchAPI, createItem } from '@/utils/api';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import SaveIcon from '@mui/icons-material/Save';

// Mock data for development mode
const MOCK_QUESTIONS = [
  {
    id: 1,
    code: 'pregnancy_cases_1',
    thematicArea: 'Pregnancy Cases',
    questionText: 'Number of pregnant students identified this term',
    inputType: 'numeric',
    required: true,
    helperText: 'Enter the total number of newly identified cases'
  },
  {
    id: 2,
    code: 'pregnancy_cases_2',
    thematicArea: 'Pregnancy Cases',
    questionText: 'Age range of pregnant students',
    inputType: 'text',
    required: true,
    helperText: 'Describe the age range (e.g., 13-17 years)'
  },
  {
    id: 3,
    code: 'support_systems_1',
    thematicArea: 'Support Systems',
    questionText: 'What support services are offered to pregnant students?',
    inputType: 'text',
    required: true,
    helperText: 'List all available services at the school'
  },
  {
    id: 4,
    code: 'reentry_statistics_1',
    thematicArea: 'Re-entry Statistics',
    questionText: 'Number of students who have returned to school after pregnancy',
    inputType: 'numeric',
    required: true,
    helperText: 'Enter the number for this term only'
  },
  {
    id: 5,
    code: 'reentry_statistics_2',
    thematicArea: 'Re-entry Statistics',
    questionText: 'Number of students who dropped out permanently due to pregnancy',
    inputType: 'numeric',
    required: true,
    helperText: 'Enter the number for this term only'
  },
  {
    id: 6,
    code: 'challenges_1',
    thematicArea: 'Challenges',
    questionText: 'Major challenges faced by returning students',
    inputType: 'text',
    required: true,
    helperText: 'Describe key challenges'
  },
  {
    id: 7,
    code: 'prevention_measures_1',
    thematicArea: 'Prevention Measures',
    questionText: 'Preventive programs implemented at the school',
    inputType: 'text',
    required: false,
    helperText: 'List any sexuality education or awareness programs'
  },
  {
    id: 8,
    code: 'school_statistics_1',
    thematicArea: 'School Statistics',
    questionText: 'Total number of female students in the school',
    inputType: 'numeric',
    required: true,
    helperText: 'Current enrollment figures'
  }
];

const MOCK_CONFIG = {
  currentAcademicTerm: "Term 2 - 2024/2025",
  submissionFrequency: "termly"
};

export default function ReentryFormPage({ school, user, submission, readOnly = false, onClose, isDevMode = false }) {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [responses, setResponses] = useState({});
  const [activeStep, setActiveStep] = useState(0);
  const [thematicAreas, setThematicAreas] = useState([]);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [currentAcademicTerm, setCurrentAcademicTerm] = useState('');
  const [selectedAcademicTerm, setSelectedAcademicTerm] = useState('');
  const [academicTerms, setAcademicTerms] = useState([]);
  const [selectedClassLevel, setSelectedClassLevel] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        let configData;
        let questionData;

        try {
          configData = await fetchAPI('system-config');
          
          // Set current academic term as default
          setCurrentAcademicTerm(configData?.currentAcademicTerm || MOCK_CONFIG.currentAcademicTerm);
          setSelectedAcademicTerm(configData?.currentAcademicTerm || MOCK_CONFIG.currentAcademicTerm);
          
          // Set available academic terms for dropdown
          setAcademicTerms(configData?.availableTerms || []);
          
          questionData = await fetchAPI('pregnancy_questions');
        } catch (error) {
          configData = MOCK_CONFIG;
          questionData = MOCK_QUESTIONS;
          setCurrentAcademicTerm(MOCK_CONFIG.currentAcademicTerm);
          setSelectedAcademicTerm(MOCK_CONFIG.currentAcademicTerm);
        }

        if (submission) {
          setResponses(submission.responses || {});
        }

        const groupedQuestions = questionData.reduce((acc, question) => {
          const { thematicArea } = question;
          if (!acc[thematicArea]) {
            acc[thematicArea] = [];
          }
          acc[thematicArea].push(question);
          return acc;
        }, {});

        const areas = Object.keys(groupedQuestions);
        setThematicAreas(areas);
        setQuestions(groupedQuestions);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [submission]);

  const handleInputChange = (questionCode, value) => {
    setResponses(prev => ({
      ...prev,
      [questionCode]: value
    }));
  };

  const handleSubmit = async () => {
    if (readOnly) return;

    if (!selectedClassLevel || !selectedFrequency || !selectedAcademicTerm) {
      setSubmitError('Please select Class Level, Frequency, and Academic Term before submitting');
      return;
    }

    setSubmitLoading(true);
    setSubmitError('');

    try {
      const submissionData = {
        schoolId: school.id,
        userId: user.id,
        responses,
        classLevel: selectedClassLevel,
        frequency: selectedFrequency,
        academicTerm: selectedAcademicTerm,
        metadata: {
          regionId: school.region?.id || school.regionId,
          districtId: school.district?.id || school.districtId,
          circuitId: school.circuit?.id || school.circuitId,
          timestamp: new Date().toISOString()
        }
      };

      if (isDevMode) {
        console.log('DEV MODE: Form would be submitted with:', submissionData);
        setSubmitSuccess(true);
        setShowContinuePrompt(true);
        return;
      }

      // Submit to the live database
      const result = await createItem('pregnancy_responses', submissionData);
      console.log('Submission result:', result);
      setSubmitSuccess(true);
      setShowContinuePrompt(true);
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError(error.message || 'Failed to submit form. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleContinue = () => {
    // Reset form for a new submission
    setResponses({});
    setActiveStep(0);
    setSubmitSuccess(false);
    setShowContinuePrompt(false);
  };

  const handleNext = () => {
    setActiveStep((prevStep) => Math.min(prevStep + 1, thematicAreas.length));
  };

  const handleBack = () => {
    setActiveStep((prevStep) => Math.max(prevStep - 1, 0));
  };

  const renderQuestionInput = (question) => {
    const { code, inputType, options } = question;
    const value = responses[code] || '';

    switch (inputType) {
      case 'numeric':
        return (
          <TextField
            fullWidth
            type="number"
            placeholder="Enter a number"
            value={value}
            onChange={(e) => handleInputChange(code, e.target.value)}
            disabled={readOnly}
            size={isMobile ? "small" : "medium"}
            inputProps={{
              style: { fontSize: isMobile ? '0.9rem' : '1rem' }
            }}
          />
        );

      case 'choice':
        return (
          <FormControl fullWidth size={isMobile ? "small" : "medium"}>
            <InputLabel id={`select-label-${code}`}>Select an option</InputLabel>
            <Select
              labelId={`select-label-${code}`}
              value={value}
              label="Select an option"
              onChange={(e) => handleInputChange(code, e.target.value)}
              disabled={readOnly}
              sx={{ textAlign: 'left' }}
            >
              {options && options.map((option, index) => (
                <MenuItem key={`${code}-option-${index}`} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1).replace(/_/g, ' ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      case 'text':
      default:
        return (
          <TextField
            fullWidth
            multiline
            rows={isMobile ? 2 : 3}
            placeholder="Enter your answer"
            value={value}
            onChange={(e) => handleInputChange(code, e.target.value)}
            disabled={readOnly}
            inputProps={{
              style: { fontSize: isMobile ? '0.9rem' : '1rem' }
            }}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (submitSuccess && showContinuePrompt) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card elevation={3} sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" component="h2" gutterBottom color="primary">
            Submission Successful
          </Typography>
          
          <Typography variant="body1" paragraph>
            Your form has been submitted successfully. Thank you!
          </Typography>
          
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleContinue}
            >
              Submit Another Form
            </Button>
            
            <Button
              variant="outlined"
              onClick={onClose}
            >
              Return to Dashboard
            </Button>
          </Box>
        </Card>
      </Container>
    );
  }

  const isLastStep = activeStep === thematicAreas.length - 1;
  const currentThematicArea = thematicAreas[activeStep];
  const currentQuestions = questions[currentThematicArea] || [];

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <Box display="flex" alignItems="center" mb={2}>
        <IconButton onClick={onClose} color="inherit" sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>

        <Typography variant={isMobile ? "h6" : "h5"} component="h1" noWrap>
          {readOnly
            ? `Viewing Survey: ${submission?.school?.name || 'Unknown School'}`
            : `New Survey: ${school.name}`
          }
        </Typography>
      </Box>

      <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3, bgcolor: 'background.default' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12}>
            <FormControl fullWidth size={isMobile ? "small" : "medium"} disabled={readOnly}>
              <InputLabel id="academic-term-label">Academic Term</InputLabel>
              <Select
                labelId="academic-term-label"
                value={selectedAcademicTerm}
                label="Academic Term"
                onChange={(e) => setSelectedAcademicTerm(e.target.value)}
                required
              >
                {academicTerms.length > 0 ? (
                  academicTerms.map((term) => (
                    <MenuItem key={term.id} value={term.label}>
                      {term.label}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value={currentAcademicTerm}>{currentAcademicTerm}</MenuItem>
                )}
              </Select>
              {!selectedAcademicTerm && !readOnly && (
                <FormHelperText error>Required</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth size={isMobile ? "small" : "medium"} disabled={readOnly}>
              <InputLabel id="class-level-label">Class Level</InputLabel>
              <Select
                labelId="class-level-label"
                value={selectedClassLevel}
                label="Class Level"
                onChange={(e) => setSelectedClassLevel(e.target.value)}
                required
              >
                <MenuItem value="Primary">Primary</MenuItem>
                <MenuItem value="JHS">JHS</MenuItem>
                <MenuItem value="SHS">SHS</MenuItem>
                <MenuItem value="TVET">TVET</MenuItem>
              </Select>
              {!selectedClassLevel && !readOnly && (
                <FormHelperText error>Required</FormHelperText>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth size={isMobile ? "small" : "medium"} disabled={readOnly}>
              <InputLabel id="frequency-label">Frequency</InputLabel>
              <Select
                labelId="frequency-label"
                value={selectedFrequency}
                label="Frequency"
                onChange={(e) => setSelectedFrequency(e.target.value)}
                required
              >
                <MenuItem value="Weekly">Weekly</MenuItem>
                <MenuItem value="Termly">Termly</MenuItem>
              </Select>
              {!selectedFrequency && !readOnly && (
                <FormHelperText error>Required</FormHelperText>
              )}
            </FormControl>
          </Grid>
        </Grid>

        {readOnly && submission?.createdAt && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Submitted on {new Date(submission.createdAt).toLocaleDateString()}
          </Typography>
        )}
      </Paper>

      {submitSuccess && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Form submitted successfully!
        </Alert>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {submitError}
        </Alert>
      )}

      {isMobile ? (
        <MobileStepper
          variant="text"
          steps={thematicAreas.length}
          position="static"
          activeStep={activeStep}
          sx={{ mb: 2 }}
          nextButton={
            <Button size="small" onClick={handleNext} disabled={isLastStep}>
              Next <NavigateNextIcon />
            </Button>
          }
          backButton={
            <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
              <NavigateBeforeIcon /> Back
            </Button>
          }
        />
      ) : (
        <Box sx={{ mb: 4 }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {thematicAreas.map((area, index) => (
              <Step key={index}>
                <StepLabel>{area}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Box>
      )}

      <Card elevation={3}>
        <CardHeader
          title={currentThematicArea}
          titleTypographyProps={{ variant: isMobile ? 'subtitle1' : 'h6' }}
          sx={{
            bgcolor: 'primary.light',
            color: 'white',
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 }
          }}
        />

        <CardContent sx={{ px: { xs: 2, sm: 3 } }}>
          <Grid container spacing={isMobile ? 2 : 3}>
            {currentQuestions.map((question) => (
              <Grid item xs={12} key={question.code}>
                <Box mb={isMobile ? 1 : 2}>
                  <Typography variant={isMobile ? "body1" : "subtitle1"} gutterBottom>
                    {question.questionText}
                  </Typography>

                  {renderQuestionInput(question)}

                  {question.helperText && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5, display: 'block' }}
                    >
                      {question.helperText}
                    </Typography>
                  )}
                </Box>
                <Divider />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="space-between" mt={3}>
        <Button
          onClick={handleBack}
          disabled={activeStep === 0}
          startIcon={<NavigateBeforeIcon />}
          size={isMobile ? "small" : "medium"}
        >
          Back
        </Button>

        <Box>
          {isLastStep && !readOnly ? (
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={submitLoading}
              startIcon={submitLoading ? <CircularProgress size={16} /> : <SaveIcon />}
              size={isMobile ? "small" : "medium"}
            >
              Submit
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={isLastStep && readOnly ? onClose : handleNext}
              endIcon={!isLastStep && <NavigateNextIcon />}
              size={isMobile ? "small" : "medium"}
            >
              {isLastStep && readOnly ? 'Close' : 'Next'}
            </Button>
          )}
        </Box>
      </Box>
    </Container>
  );
}