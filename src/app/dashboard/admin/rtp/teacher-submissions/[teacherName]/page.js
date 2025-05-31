'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  Card, 
  CardContent, 
  Divider, 
  Chip,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Switch,
  Tabs,
  Tab,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FilterListIcon from '@mui/icons-material/FilterList';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Import our data service and utilities
import rtpApiService from '../../../../../../utils/RTP_apiService';
import { formatDate, calculatePercentage, capPercentage } from '../../../../../../utils/RTP_dataUtils';
import { useRTP_DataSource } from '../../../../../../context/RTP_DataSourceContext';

// Helper function to get survey type name
function getSurveyTypeName(type) {
  const typeMap = {
    'school_output': 'School Output',
    'district_output': 'District Output',
    'consolidated_checklist': 'Consolidated Checklist',
    'partners_in_play': 'Partners in Play'
  };
  
  return typeMap[type] || type.replace(/_/g, ' ');
}

// Helper function to get survey type icon
function getSurveyTypeIcon(type) {
  switch (type) {
    case 'school_output':
      return <SchoolIcon />;
    case 'district_output':
      return <BusinessIcon />;
    case 'consolidated_checklist':
      return <AssignmentIcon />;
    case 'partners_in_play':
      return <PersonIcon />;
    default:
      return <AssignmentIcon />;
  }
}

export default function TeacherSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const { useMockData, toggleDataSource } = useRTP_DataSource();
  
  // Extract teacher name from params
  const teacherName = params?.teacherName ? decodeURIComponent(params.teacherName) : '';
  
  // State
  const [submissions, setSubmissions] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [filters, setFilters] = useState({
    surveyType: 'all',
    itinerary: 'all'
  });
  const [availableFilters, setAvailableFilters] = useState({
    surveyTypes: [],
    itineraries: []
  });
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch submissions for the teacher
  useEffect(() => {
    async function fetchData() {
      if (!teacherName) {
        setError('Teacher name is required');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch submissions for the teacher
        const teacherSubmissions = await rtpApiService.getSubmissionsByEntity('teacher', teacherName, useMockData);
        
        // Check if we have any submissions
        if (!teacherSubmissions || teacherSubmissions.length === 0) {
          console.warn(`No submissions found for teacher: ${teacherName}`);
          setSubmissions([]);
          setTeacherInfo({
            name: teacherName,
            school: 'Unknown',
            district: 'Unknown',
            region: 'Unknown'
          });
          setAvailableFilters({
            surveyTypes: ['all'],
            itineraries: ['all']
          });
          setLoading(false);
          return;
        }
        
        setSubmissions(teacherSubmissions);
        
        // Extract teacher info from the first submission
        try {
          if (teacherSubmissions.length > 0) {
            const firstSubmission = teacherSubmissions[0];
            setTeacherInfo({
              name: firstSubmission.teacher || teacherName,
              school: firstSubmission.school || 'Unknown',
              district: firstSubmission.district || 'Unknown',
              region: firstSubmission.region || 'Unknown'
            });
          }
        } catch (infoError) {
          console.error('Error extracting teacher info:', infoError);
          // Don't fail the whole page for info extraction errors
          setTeacherInfo({
            name: teacherName,
            school: 'Unknown',
            district: 'Unknown',
            region: 'Unknown'
          });
        }
        
        // Extract available filter options - handle potential null values
        try {
          const surveyTypes = ['all', ...new Set(teacherSubmissions
            .filter(sub => sub && sub.survey_type)
            .map(sub => sub.survey_type))];
            
          const itineraries = ['all', ...new Set(teacherSubmissions
            .filter(sub => sub && sub.itinerary)
            .map(sub => sub.itinerary))];
          
          setAvailableFilters({
            surveyTypes,
            itineraries
          });
        } catch (filterError) {
          console.error('Error extracting filter options:', filterError);
          // Don't fail the whole page for filter extraction errors
          setAvailableFilters({
            surveyTypes: ['all'],
            itineraries: ['all']
          });
        }
      } catch (err) {
        console.error('Error fetching teacher submissions:', err);
        
        // Get user-friendly error message if available
        const errorMessage = err.getUserMessage ? 
          err.getUserMessage() : 
          `Failed to load submissions for teacher ${teacherName}. Please try again later.`;
          
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [teacherName, useMockData]);
  
  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Apply filters to submissions
  const filteredSubmissions = submissions.filter(submission => {
    // Filter by survey type
    if (filters.surveyType !== 'all' && submission.survey_type !== filters.surveyType) {
      return false;
    }
    
    // Filter by itinerary
    if (filters.itinerary !== 'all' && submission.itinerary !== filters.itinerary) {
      return false;
    }
    
    return true;
  });
  
  // Group submissions by survey type
  const submissionsBySurveyType = filteredSubmissions.reduce((acc, submission) => {
    const type = submission.survey_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(submission);
    return acc;
  }, {});
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle back button click
  const handleBack = () => {
    router.back();
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
      </Box>
    );
  }
  
  // Render not found state
  if (!teacherInfo) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Teacher not found or no submissions available.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Data Source Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={!useMockData}
              onChange={toggleDataSource}
              color="primary"
            />
          }
          label={useMockData ? "Using Mock Data" : "Using Live Data"}
        />
      </Box>
      
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/dashboard/admin/rtp/dashboard" passHref>
          <Typography color="inherit" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            Dashboard
          </Typography>
        </Link>
        <Link href={`/dashboard/admin/rtp/hierarchy-view/region/${encodeURIComponent(teacherInfo.region)}`} passHref>
          <Typography color="inherit" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            {teacherInfo.region}
          </Typography>
        </Link>
        <Link href={`/dashboard/admin/rtp/hierarchy-view/district/${encodeURIComponent(teacherInfo.district)}`} passHref>
          <Typography color="inherit" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            {teacherInfo.district}
          </Typography>
        </Link>
        <Link href={`/dashboard/admin/rtp/hierarchy-view/school/${encodeURIComponent(teacherInfo.school)}`} passHref>
          <Typography color="inherit" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            {teacherInfo.school}
          </Typography>
        </Link>
        <Typography color="text.primary">
          {teacherInfo.name}
        </Typography>
      </Breadcrumbs>
      
      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
      </Box>
      
      {/* Teacher Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 2 }}>
            <PersonIcon fontSize="large" />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {teacherInfo.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Teacher
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SchoolIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" fontWeight="medium">
                    School
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {teacherInfo.school}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BusinessIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" fontWeight="medium">
                    District
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {teacherInfo.district}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" fontWeight="medium">
                    Total Submissions
                  </Typography>
                </Box>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {submissions.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DateRangeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" fontWeight="medium">
                    Latest Submission
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {submissions.length > 0 
                    ? formatDate(submissions.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date)
                    : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Filters */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <FilterListIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h5" fontWeight="medium">
            Filters
          </Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid size={{xs:12, sm:6}}>
            <FormControl fullWidth>
              <InputLabel>Survey Type</InputLabel>
              <Select
                value={filters.surveyType}
                label="Survey Type"
                onChange={(e) => handleFilterChange('surveyType', e.target.value)}
              >
                {availableFilters.surveyTypes.map(type => (
                  <MenuItem key={type} value={type}>
                    {type === 'all' ? 'All Survey Types' : getSurveyTypeName(type)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{xs:12, sm:6}}>
            <FormControl fullWidth>
              <InputLabel>Itinerary</InputLabel>
              <Select
                value={filters.itinerary}
                label="Itinerary"
                onChange={(e) => handleFilterChange('itinerary', e.target.value)}
              >
                {availableFilters.itineraries.map(itinerary => (
                  <MenuItem key={itinerary} value={itinerary}>
                    {itinerary === 'all' ? 'All Itineraries' : itinerary}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2, mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label="All Submissions" />
          <Tab label="By Survey Type" />
        </Tabs>
        
        <Divider />
        
        {/* Tab 1: All Submissions */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="medium" gutterBottom>
              All Submissions ({filteredSubmissions.length})
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Survey Type</TableCell>
                    <TableCell>Itinerary</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSubmissions
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map(submission => (
                      <TableRow key={submission.id}>
                        <TableCell>{formatDate(submission.date)}</TableCell>
                        <TableCell>{getSurveyTypeName(submission.survey_type)}</TableCell>
                        <TableCell>{submission.itinerary}</TableCell>
                        <TableCell>
                          <Button 
                            variant="text" 
                            size="small"
                            component={Link}
                            href={`/dashboard/admin/rtp/survey-view/${submission.id}`}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Tab 2: By Survey Type */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="medium" gutterBottom>
              Submissions by Survey Type
            </Typography>
            
            {Object.keys(submissionsBySurveyType).length > 0 ? (
              Object.entries(submissionsBySurveyType).map(([type, subs]) => (
                <Box key={type} sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ mr: 1 }}>
                      {getSurveyTypeIcon(type)}
                    </Box>
                    <Typography variant="h6">
                      {getSurveyTypeName(type)} ({subs.length})
                    </Typography>
                  </Box>
                  
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Itinerary</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {subs
                          .sort((a, b) => new Date(b.date) - new Date(a.date))
                          .map(submission => (
                            <TableRow key={submission.id}>
                              <TableCell>{formatDate(submission.date)}</TableCell>
                              <TableCell>{submission.itinerary}</TableCell>
                              <TableCell>
                                <Button 
                                  variant="text" 
                                  size="small"
                                  component={Link}
                                  href={`/dashboard/admin/rtp/survey-view/${submission.id}`}
                                >
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No submissions found with the current filters.
              </Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
