'use client';
import React, { useState, useEffect } from 'react';
import ClientOnly from '../components/ClientOnly';
import { mockOutcomeIndicators, mockOutputIndicators } from '../mock/mockIndicators';
import { mockFilters, getCascadingFilters } from '../mock/mockFilters';
import { recentMockSubmissions } from '../mock/mockSubmissions';
import FilterBar from '../components/FilterBar';
import IndicatorCard from '../components/IndicatorCard';
import DrilldownModal from './DrilldownModal';
import MockDataToggle from '../components/MockDataToggle';
import { useMockDataContext } from '../components/MockDataContext';
import { 
  Container, Typography, Box, Paper, Grid, Divider, Button, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  IconButton, Tooltip, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import InsightsIcon from '@mui/icons-material/Insights';
import FilterListIcon from '@mui/icons-material/FilterList';
import HistoryIcon from '@mui/icons-material/History';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ChecklistIcon from '@mui/icons-material/Checklist';
import SportsIcon from '@mui/icons-material/Sports';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import GroupIcon from '@mui/icons-material/Group';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import Link from 'next/link';
import { useRouter } from 'next/navigation';


export default function Dashboard() {
  const [selectedFilters, setSelectedFilters] = useState({});
  const [availableFilters, setAvailableFilters] = useState(mockFilters);
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownIndicator, setDrilldownIndicator] = useState(null);
  const { useMockData: mockMode } = useMockDataContext();
  const router = useRouter();
  
  // Pagination state for submissions table
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [submissionDetail, setSubmissionDetail] = useState(null);

  // Update available filters when selections change (cascading filters)
  useEffect(() => {
    if (mockMode) {
      // Get cascading filters based on current selections
      const cascadingFilters = getCascadingFilters(selectedFilters);
      setAvailableFilters(cascadingFilters);
    }
  }, [selectedFilters, mockMode]);

  // Handle filter changes and reset dependent filters
  const handleFilterChange = (key, value) => {
    // Create a new filters object
    const newFilters = { ...selectedFilters, [key]: value };
    
    // If a parent filter changes, reset child filters
    if (key === 'regions') {
      // Reset district and below when region changes
      delete newFilters.districts;
      delete newFilters.circuits;
      delete newFilters.schools;
      delete newFilters.teachers;
    } else if (key === 'districts') {
      // Reset circuit and below when district changes
      delete newFilters.circuits;
      delete newFilters.schools;
      delete newFilters.teachers;
    } else if (key === 'circuits') {
      // Reset school and below when circuit changes
      delete newFilters.schools;
      delete newFilters.teachers;
    } else if (key === 'schools') {
      // Reset teachers when school changes
      delete newFilters.teachers;
    }
    
    // If value is empty, remove the filter
    if (value === '') {
      delete newFilters[key];
    }
    
    setSelectedFilters(newFilters);
  };

  // Pagination handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // View submission details
  const handleViewSubmission = (submission) => {
    setSubmissionDetail(submission);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get icon for survey type
  // Function to get the icon for a survey type
  // Using a simpler approach to avoid hydration errors
  const getSurveyTypeIcon = (type) => {
    // Instead of directly returning components, use a consistent approach
    // that won't cause hydration mismatches
    if (type === 'school_output') {
      return <SchoolIcon fontSize="small" color="primary" />;
    } else if (type === 'district_output') {
      return <AccountBalanceIcon fontSize="small" color="secondary" />;
    } else if (type === 'consolidated_checklist') {
      return <ChecklistIcon fontSize="small" color="success" />;
    } else if (type === 'partners_in_play') {
      return <SportsIcon fontSize="small" color="warning" />;
    } else {
      return <AssessmentIcon fontSize="small" />;
    }
  };
  
  // Get display name for survey type
  const getSurveyTypeName = (type) => {
    switch (type) {
      case 'school_output':
        return 'School Output';
      case 'district_output':
        return 'District Output';
      case 'consolidated_checklist':
        return 'Consolidated Checklist';
      case 'partners_in_play':
        return 'Partners in Play';
      default:
        return type;
    }
  };
  
  // Group submissions by survey ID to show complete surveys instead of individual questions
  const groupSubmissionsBySurvey = (submissions) => {
    const surveyMap = new Map();
    
    submissions.forEach(submission => {
   
      const surveyId = submission.survey_id || submission.id;
      if (!surveyMap.has(surveyId)) {
        // Create a new survey entry with the first submission's metadata
        surveyMap.set(surveyId, {
          id: surveyId,
          survey_type: submission.survey_type,
          submitted_at: submission.submitted_at,
          region: submission.region,
          district: submission.district,
          school: submission.school,
          entity: submission.entity,
          collector: submission.collector || 'Unknown',
          question_count: 1,
          submissions: [submission]
        });
      } else {
        // Update existing survey entry
        const survey = surveyMap.get(surveyId);
        survey.question_count += 1;
        survey.submissions.push(submission);
      }
    });
    
    return Array.from(surveyMap.values());
  };

  // Use mock or live data (for now, only mock is implemented)
  const outcomeIndicators = mockMode ? mockOutcomeIndicators : [];
  const outputIndicators = mockMode ? mockOutputIndicators : [];
  const filters = mockMode ? availableFilters : {};
  const rawSubmissions = mockMode ? recentMockSubmissions : [];
  
  // Group submissions by survey
  const submissions = groupSubmissionsBySurvey(rawSubmissions);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AssessmentIcon color="primary" fontSize="large" sx={{ mr: 2 }} />
              <Typography variant="h4" fontWeight="bold">
                Right To Play Dashboard
              </Typography>
            </Box>
            
            {/* Mock data toggle positioned inline with heading */}
            <MockDataToggle />
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <FilterBar filters={filters} selected={selectedFilters} onChange={handleFilterChange} />
        </Paper>

        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <InsightsIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h5" fontWeight="medium">
              Outcome Indicators
            </Typography>
          </Box>
          
          {/* Group 1: Enrollment and Dropout */}
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="enrollment-content"
              id="enrollment-header"
              sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SchoolIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Enrollment & Retention</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {outcomeIndicators
                  .filter(ind => ['oi1', 'oi2'].includes(ind.id))
                  .map((indicator) => (
                    <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                      <IndicatorCard 
                        indicator={indicator} 
                        onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                      />
                    </Grid>
                  ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          {/* Group 2: School Implementation */}
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="implementation-content"
              id="implementation-header"
              sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalanceIcon sx={{ mr: 1 }} />
                <Typography variant="h6">School Implementation</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {outcomeIndicators
                  .filter(ind => ['oi3', 'oi4', 'oi5'].includes(ind.id))
                  .map((indicator) => (
                    <Grid  key={indicator.id} size={{xs:12, sm:6, md:4, lg:3}}>
                      <IndicatorCard 
                        indicator={indicator} 
                        onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                      />
                    </Grid>
                  ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
          
          {/* Group 3: Teacher & District Capacity */}
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="capacity-content"
              id="capacity-header"
              sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SupervisorAccountIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Teacher & District Capacity</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {outcomeIndicators
                  .filter(ind => ['oi6', 'oi7', 'oi8', 'oi9'].includes(ind.id))
                  .map((indicator) => (
                    <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                      <IndicatorCard 
                        indicator={indicator} 
                        onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                      />
                    </Grid>
                  ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        </Paper>

        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <InsightsIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="h5" fontWeight="medium">
              Output Indicators
            </Typography>
          </Box>
          
          {/* School Output Indicators */}
          <Accordion defaultExpanded sx={{ mb: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="school-output-content"
              id="school-output-header"
              sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', borderRadius: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SchoolIcon sx={{ mr: 1 }} />
                <Typography variant="h6">School Output Indicators</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {/* Teacher Capacity Building */}
              <Accordion sx={{ mb: 1 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="teacher-capacity-content"
                  id="teacher-capacity-header"
                  sx={{ bgcolor: 'grey.100' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <GroupIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Teacher Capacity Building</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {outputIndicators
                      .filter(ind => ind.category === 'school_output' && ind.subcategory === 'teacher_capacity')
                      .map((indicator) => (
                        <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                          <IndicatorCard 
                            indicator={indicator} 
                            onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                          />
                        </Grid>
                      ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
              
              {/* Curriculum Implementation */}
              <Accordion sx={{ mb: 1 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="curriculum-content"
                  id="curriculum-header"
                  sx={{ bgcolor: 'grey.100' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <MenuBookIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Curriculum Implementation</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {outputIndicators
                      .filter(ind => ind.category === 'school_output' && ind.subcategory === 'curriculum')
                      .map((indicator) => (
                        <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                          <IndicatorCard 
                            indicator={indicator} 
                            onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                          />
                        </Grid>
                      ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
              
              {/* Student Engagement */}
              <Accordion sx={{ mb: 1 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="student-content"
                  id="student-header"
                  sx={{ bgcolor: 'grey.100' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessibilityNewIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Student Engagement</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {outputIndicators
                      .filter(ind => ind.category === 'school_output' && ind.subcategory === 'student_engagement')
                      .map((indicator) => (
                        <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                          <IndicatorCard 
                            indicator={indicator} 
                            onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                          />
                        </Grid>
                      ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </AccordionDetails>
          </Accordion>
          
          {/* District Output Indicators */}
          <Accordion defaultExpanded>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls="district-output-content"
              id="district-output-header"
              sx={{ bgcolor: 'secondary.light', color: 'secondary.contrastText', borderRadius: 1 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalanceIcon sx={{ mr: 1 }} />
                <Typography variant="h6">District Output Indicators</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              {/* District Support */}
              <Accordion sx={{ mb: 1 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="district-support-content"
                  id="district-support-header"
                  sx={{ bgcolor: 'grey.100' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SupervisorAccountIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">District Support</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {outputIndicators
                      .filter(ind => ind.category === 'district_output' && ind.subcategory === 'district_support')
                      .map((indicator) => (
                        <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                          <IndicatorCard 
                            indicator={indicator} 
                            onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                          />
                        </Grid>
                      ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
              
              {/* Monitoring and Evaluation */}
              <Accordion sx={{ mb: 1 }}>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="monitoring-content"
                  id="monitoring-header"
                  sx={{ bgcolor: 'grey.100' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <ChecklistIcon fontSize="small" sx={{ mr: 1 }} />
                    <Typography variant="subtitle1">Monitoring and Evaluation</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {outputIndicators
                      .filter(ind => ind.category === 'district_output' && ind.subcategory === 'monitoring')
                      .map((indicator) => (
                        <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                          <IndicatorCard 
                            indicator={indicator} 
                            onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                          />
                        </Grid>
                      ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </AccordionDetails>
          </Accordion>
        </Paper>
        
        {/* Recent Submissions Table */}
        <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <HistoryIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h5" fontWeight="medium">
                Recent Submissions
              </Typography>
            </Box>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => router.push('/dashboard/admin/rtp-ui/hierarchy-view/region/All')}
            >
              View All Submissions
            </Button>
          </Box>
          
          <ClientOnly>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Survey Type</TableCell>
                    <TableCell>Teacher</TableCell>
                    <TableCell>School</TableCell>
                    <TableCell>District</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentMockSubmissions.slice(0, 5).map((submission, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {/* Use conditional rendering to avoid hydration issues */}
                          {submission.survey_type === 'school_output' && <SchoolIcon fontSize="small" color="primary" />}
                          {submission.survey_type === 'district_output' && <AccountBalanceIcon fontSize="small" color="secondary" />}
                          {submission.survey_type === 'consolidated_checklist' && <ChecklistIcon fontSize="small" color="success" />}
                          {submission.survey_type === 'partners_in_play' && <SportsIcon fontSize="small" color="warning" />}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {getSurveyTypeName(submission.survey_type)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`/dashboard/admin/rtp-ui/teacher-submissions/${encodeURIComponent(submission.teacher)}`}
                          component="button" 
                          variant="body2" 
                        >
                          {submission.teacher}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`/dashboard/admin/rtp-ui/hierarchy-view/school/${encodeURIComponent(submission.school)}`}
                          component="button" 
                          variant="body2" 
                        >
                          {submission.school}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link 
                          href={`/dashboard/admin/rtp-ui/hierarchy-view/district/${encodeURIComponent(submission.district)}`}
                          component="button" 
                          variant="body2" 
                        >
                          {submission.district}
                        </Link>
                      </TableCell>
                      <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          variant="text"
                          onClick={() => router.push(`/dashboard/admin/rtp-ui/survey-view/${submission.id}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </ClientOnly>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={submissions.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
        
        <DrilldownModal indicator={drilldownIndicator} open={drilldownOpen} onClose={() => setDrilldownOpen(false)} />
      </Container>
    </Box>
  );
}
