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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PublicIcon from '@mui/icons-material/Public';
import FilterListIcon from '@mui/icons-material/FilterList';

// Import our data service and utilities
import rtpApiService from '../../../../../../../utils/RTP_apiService';
import { 
  formatDate, 
  calculatePercentage, 
  capPercentage,
  groupSubmissionsByEntity,
  calculateStats
} from '../../../../../../../utils/RTP_dataUtils';
import { useRTP_DataSource } from '../../../../../../../context/RTP_DataSourceContext';

// Helper function to get entity icon
function getEntityIcon(entityType) {
  switch (entityType) {
    case 'school':
      return <SchoolIcon />;
    case 'district':
      return <BusinessIcon />;
    case 'region':
      return <PublicIcon />;
    case 'teacher':
      return <PersonIcon />;
    default:
      return <PublicIcon />;
  }
}

// Helper function to get entity type label
function getEntityTypeLabel(entityType) {
  const typeMap = {
    'school': 'School',
    'district': 'District',
    'region': 'Region',
    'teacher': 'Teacher'
  };
  
  return typeMap[entityType] || entityType;
}

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

// Helper function to get child entity type
function getChildEntityType(entityType) {
  if (entityType === 'region') return 'district';
  if (entityType === 'district') return 'school';
  if (entityType === 'school') return 'teacher';
  return null;
}

// Helper function to get parent entity type
function getParentEntityType(entityType) {
  if (entityType === 'district') return 'region';
  if (entityType === 'school') return 'district';
  if (entityType === 'teacher') return 'school';
  return null;
}

export default function HierarchyViewPage() {
  const params = useParams();
  const router = useRouter();
  const { useMockData, toggleDataSource } = useRTP_DataSource();
  
  // Extract entity type and name from params
  const entityType = params?.entityType || 'region';
  const entityName = params?.entityName ? decodeURIComponent(params.entityName) : 'All';
  
  // State
  const [submissions, setSubmissions] = useState([]);
  const [childEntities, setChildEntities] = useState([]);
  const [filters, setFilters] = useState({
    surveyType: 'all',
    itinerary: 'all',
    startDate: null,
    endDate: null
  });
  const [availableFilters, setAvailableFilters] = useState({
    surveyTypes: [],
    itineraries: []
  });
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch submissions and build hierarchy
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        // Validate entity type
        const validEntityTypes = ['school', 'district', 'region', 'teacher'];
        if (!validEntityTypes.includes(entityType)) {
          setError(`Invalid entity type: ${entityType}. Must be one of: ${validEntityTypes.join(', ')}`);
          setLoading(false);
          return;
        }
        
        // Fetch submissions for the entity
        const entitySubmissions = await rtpApiService.getSubmissionsByEntity(entityType, entityName, useMockData);
        
        // Check if we have any submissions
        if (!entitySubmissions || entitySubmissions.length === 0) {
          console.warn(`No submissions found for ${entityType}: ${entityName}`);
          setSubmissions([]);
          setChildEntities([]);
          setAvailableFilters({
            surveyTypes: ['all'],
            itineraries: ['all']
          });
          setLoading(false);
          return;
        }
        
        setSubmissions(entitySubmissions);
        
        // Extract available filter options - handle potential null values
        const surveyTypes = ['all', ...new Set(entitySubmissions
          .filter(sub => sub && sub.survey_type)
          .map(sub => sub.survey_type))];
          
        const itineraries = ['all', ...new Set(entitySubmissions
          .filter(sub => sub && sub.itinerary)
          .map(sub => sub.itinerary))];
        
        setAvailableFilters({
          surveyTypes,
          itineraries
        });
        
        // Group submissions by child entity type if applicable
        const childType = getChildEntityType(entityType);
        if (childType) {
          try {
            const grouped = groupSubmissionsByEntity(entitySubmissions, childType);
            
            // Convert to array of objects with stats
            const childEntitiesArray = Object.keys(grouped).map(name => {
              const entitySubmissions = grouped[name];
              const stats = calculateStats(entitySubmissions);
              
              return {
                name,
                submissions: entitySubmissions,
                ...stats
              };
            });
            
            // Sort by name
            childEntitiesArray.sort((a, b) => a.name.localeCompare(b.name));
            
            setChildEntities(childEntitiesArray);
          } catch (groupingError) {
            console.error('Error grouping submissions by child entity:', groupingError);
            // Don't fail the whole page for grouping errors
            setChildEntities([]);
          }
        }
      } catch (err) {
        console.error('Error fetching hierarchy data:', err);
        
        // Get user-friendly error message if available
        const errorMessage = err.getUserMessage ? 
          err.getUserMessage() : 
          `Failed to load data for ${getEntityTypeLabel(entityType)} ${entityName}. Please try again later.`;
          
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [entityType, entityName, useMockData]);
  
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
    
    // Filter by date range
    if (filters.startDate && new Date(submission.date) < filters.startDate) {
      return false;
    }
    
    if (filters.endDate) {
      const endDateWithTime = new Date(filters.endDate);
      endDateWithTime.setHours(23, 59, 59, 999);
      if (new Date(submission.date) > endDateWithTime) {
        return false;
      }
    }
    
    return true;
  });
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle back button click
  const handleBack = () => {
    const parentType = getParentEntityType(entityType);
    
    if (parentType) {
      // If we have a parent entity type, navigate to it
      const parentName = submissions.length > 0 ? submissions[0][parentType] : 'All';
      router.push(`/dashboard/admin/rtp/hierarchy-view/${parentType}/${encodeURIComponent(parentName)}`);
    } else {
      // Otherwise go back to dashboard
      router.push('/dashboard/admin/rtp/dashboard');
    }
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
        {entityType !== 'region' && (
          <Link href={`/dashboard/admin/rtp/hierarchy-view/region/All`} passHref>
            <Typography color="inherit" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              Regions
            </Typography>
          </Link>
        )}
        {entityType === 'school' && (
          <Link href={`/dashboard/admin/rtp/hierarchy-view/district/${encodeURIComponent(submissions[0]?.district || 'All')}`} passHref>
            <Typography color="inherit" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              {submissions[0]?.district || 'District'}
            </Typography>
          </Link>
        )}
        {entityType === 'teacher' && (
          <>
            <Link href={`/dashboard/admin/rtp/hierarchy-view/district/${encodeURIComponent(submissions[0]?.district || 'All')}`} passHref>
              <Typography color="inherit" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                {submissions[0]?.district || 'District'}
              </Typography>
            </Link>
            <Link href={`/dashboard/admin/rtp/hierarchy-view/school/${encodeURIComponent(submissions[0]?.school || 'All')}`} passHref>
              <Typography color="inherit" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                {submissions[0]?.school || 'School'}
              </Typography>
            </Link>
          </>
        )}
        <Typography color="text.primary">
          {getEntityTypeLabel(entityType)}: {entityName}
        </Typography>
      </Breadcrumbs>
      
      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
      </Box>
      
      {/* Entity Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 2 }}>
            {getEntityIcon(entityType)}
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {entityName}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {getEntityTypeLabel(entityType)}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body1" fontWeight="medium">
                  Total Submissions
                </Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {submissions.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body1" fontWeight="medium">
                  {getChildEntityType(entityType) ? `${getEntityTypeLabel(getChildEntityType(entityType))}s` : 'Survey Types'}
                </Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {getChildEntityType(entityType) 
                    ? childEntities.length 
                    : [...new Set(submissions.map(sub => sub.survey_type))].length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body1" fontWeight="medium">
                  Latest Submission
                </Typography>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {submissions.length > 0 
                    ? formatDate(submissions.sort((a, b) => new Date(b.date) - new Date(a.date))[0].date)
                    : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="body1" fontWeight="medium">
                  Itineraries
                </Typography>
                <Typography variant="h4" sx={{ mt: 1 }}>
                  {[...new Set(submissions.map(sub => sub.itinerary))].length}
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
          <Grid size={{xs:12, sm:6, md:3}}>
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
          
          <Grid size={{xs:12, sm:6, md:3}}>
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
          
          <Grid size={{xs:12, sm:6, md:3}}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={filters.startDate}
                onChange={(date) => handleFilterChange('startDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid size={{xs:12, sm:6, md:3}}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={filters.endDate}
                onChange={(date) => handleFilterChange('endDate', date)}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabs */}
      <Paper elevation={0} sx={{ borderRadius: 2, mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab label={`${getEntityTypeLabel(entityType)} Overview`} />
          {getChildEntityType(entityType) && (
            <Tab label={`${getEntityTypeLabel(getChildEntityType(entityType))} List`} />
          )}
          <Tab label="Submissions" />
        </Tabs>
        
        <Divider />
        
        {/* Tab 1: Entity Overview */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="medium" gutterBottom>
              {getEntityTypeLabel(entityType)} Overview
            </Typography>
            
            <Grid container spacing={3} sx={{ mt: 2 }}>
              <Grid size={{xs:12, md:6}}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Submission Types
                    </Typography>
                    
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Survey Type</TableCell>
                            <TableCell>Count</TableCell>
                            <TableCell>Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...new Set(submissions.map(sub => sub.survey_type))].map(type => {
                            const count = submissions.filter(sub => sub.survey_type === type).length;
                            const percentage = calculatePercentage(count, submissions.length);
                            
                            return (
                              <TableRow key={type}>
                                <TableCell>{getSurveyTypeName(type)}</TableCell>
                                <TableCell>{count}</TableCell>
                                <TableCell>{percentage.toFixed(1)}%</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid size={{xs:12, md:6}}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Itineraries
                    </Typography>
                    
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Itinerary</TableCell>
                            <TableCell>Count</TableCell>
                            <TableCell>Percentage</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...new Set(submissions.map(sub => sub.itinerary))].map(itinerary => {
                            const count = submissions.filter(sub => sub.itinerary === itinerary).length;
                            const percentage = calculatePercentage(count, submissions.length);
                            
                            return (
                              <TableRow key={itinerary}>
                                <TableCell>{itinerary}</TableCell>
                                <TableCell>{count}</TableCell>
                                <TableCell>{percentage.toFixed(1)}%</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {/* Tab 2: Child Entities */}
        {activeTab === 1 && getChildEntityType(entityType) && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="medium" gutterBottom>
              {getEntityTypeLabel(getChildEntityType(entityType))} List
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{getEntityTypeLabel(getChildEntityType(entityType))}</TableCell>
                    <TableCell>Submissions</TableCell>
                    <TableCell>Latest Submission</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {childEntities.map(entity => (
                    <TableRow key={entity.name}>
                      <TableCell>{entity.name}</TableCell>
                      <TableCell>{entity.count}</TableCell>
                      <TableCell>{formatDate(entity.latestSubmission?.date)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="text" 
                          size="small"
                          component={Link}
                          href={`/dashboard/admin/rtp/hierarchy-view/${getChildEntityType(entityType)}/${encodeURIComponent(entity.name)}`}
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
        
        {/* Tab 3: Submissions */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" fontWeight="medium" gutterBottom>
              Submissions ({filteredSubmissions.length})
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Survey Type</TableCell>
                    <TableCell>Teacher</TableCell>
                    <TableCell>School</TableCell>
                    <TableCell>District</TableCell>
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
                        <TableCell>{submission.teacher}</TableCell>
                        <TableCell>{submission.school}</TableCell>
                        <TableCell>{submission.district}</TableCell>
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
      </Paper>
    </Box>
  );
}
