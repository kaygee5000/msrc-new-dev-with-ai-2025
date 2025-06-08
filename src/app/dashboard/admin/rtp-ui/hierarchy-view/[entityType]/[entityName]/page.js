'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Paper, 
  Breadcrumbs, 
  Link, 
  IconButton, 
  Divider,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Avatar,
  Card,
  CardContent,
  Grid,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ChecklistIcon from '@mui/icons-material/Checklist';
import SportsIcon from '@mui/icons-material/Sports';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PublicIcon from '@mui/icons-material/Public';
import AssignmentIcon from '@mui/icons-material/Assignment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterListIcon from '@mui/icons-material/FilterList';

// Import mock data
import { 
  schoolOutputSubmissions, 
  districtOutputSubmissions, 
  consolidatedChecklistSubmissions, 
  partnersInPlaySubmissions 
} from '../../../mock/mockSubmissions';

// Import utility functions
import { formatDate } from '../../../utils/dataUtils';

// Helper function to get survey type name
const getSurveyTypeName = (type) => {
  switch (type) {
    case 'school_output':
      return 'School Output Survey';
    case 'district_output':
      return 'District Output Survey';
    case 'consolidated_checklist':
      return 'Consolidated Checklist';
    case 'partners_in_play':
      return 'Partners in Play';
    default:
      return type;
  }
};

// Helper function to get survey type icon
const getSurveyTypeIcon = (type) => {
  switch (type) {
    case 'school_output':
      return <SchoolIcon color="primary" />;
    case 'district_output':
      return <AccountBalanceIcon color="secondary" />;
    case 'consolidated_checklist':
      return <ChecklistIcon color="success" />;
    case 'partners_in_play':
      return <SportsIcon color="warning" />;
    default:
      return <AssignmentIcon />;
  }
};

export default function HierarchyViewPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [entityType, setEntityType] = useState('');
  const [entityName, setEntityName] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [itineraryFilter, setItineraryFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState({
    start: null,
    end: null
  });
  const [hierarchyData, setHierarchyData] = useState({
    schools: [],
    districts: [],
    teachers: []
  });
  const [availableItineraries, setAvailableItineraries] = useState([]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle back button
  const handleBack = () => {
    router.back();
  };
  
  // Group submissions by survey type
  const submissionsByType = submissions.reduce((acc, sub) => {
    if (!acc[sub.survey_type]) {
      acc[sub.survey_type] = [];
    }
    acc[sub.survey_type].push(sub);
    return acc;
  }, {});
  
  // Initial data loading
  useEffect(() => {
    if (params?.entityType && params?.entityName) {
      const type = decodeURIComponent(params.entityType);
      const name = decodeURIComponent(params.entityName);
      
      setEntityType(type);
      setEntityName(name);
      
      // Combine all submissions
      const allSubmissions = [
        ...schoolOutputSubmissions,
        ...districtOutputSubmissions,
        ...consolidatedChecklistSubmissions,
        ...partnersInPlaySubmissions
      ];
      
      // Extract all available itineraries
      const itineraries = [...new Set(allSubmissions.map(sub => sub.itinerary).filter(Boolean))];
      setAvailableItineraries(['all', ...itineraries]);
      
      // Filter submissions based on entity type and name
      let filteredSubmissions = [];
      
      if (type === 'region') {
        filteredSubmissions = name === 'All' ? 
          allSubmissions : 
          allSubmissions.filter(sub => sub.region === name);
        
        // Group by districts
        const districts = [...new Set(filteredSubmissions.map(sub => sub.district))];
        const districtData = districts.map(district => {
          const districtSubmissions = filteredSubmissions.filter(sub => sub.district === district);
          const schools = [...new Set(districtSubmissions.map(sub => sub.school))];
          const schoolData = schools.map(school => {
            const schoolSubmissions = districtSubmissions.filter(sub => sub.school === school);
            const teachers = [...new Set(schoolSubmissions.map(sub => sub.teacher))];
            return { name: school, submissions: schoolSubmissions, teachers };
          });
          
          return { name: district, submissions: districtSubmissions, schools: schoolData };
        });
        
        setHierarchyData({
          districts: districtData,
          schools: [],
          teachers: []
        });
      } 
      else if (type === 'district') {
        filteredSubmissions = allSubmissions.filter(sub => sub.district === name);
        
        // Group by schools
        const schools = [...new Set(filteredSubmissions.map(sub => sub.school))];
        const schoolData = schools.map(school => {
          const schoolSubmissions = filteredSubmissions.filter(sub => sub.school === school);
          const teachers = [...new Set(schoolSubmissions.map(sub => sub.teacher))];
          const teacherData = teachers.map(teacher => {
            const teacherSubmissions = schoolSubmissions.filter(sub => sub.teacher === teacher);
            return { name: teacher, submissions: teacherSubmissions };
          });
          
          return { name: school, submissions: schoolSubmissions, teachers: teacherData };
        });
        
        setHierarchyData({
          districts: [],
          schools: schoolData,
          teachers: []
        });
      }
      else if (type === 'school') {
        filteredSubmissions = allSubmissions.filter(sub => sub.school === name);
        
        // Group by teachers
        const teachers = [...new Set(filteredSubmissions.map(sub => sub.teacher))];
        const teacherData = teachers.map(teacher => {
          const teacherSubmissions = filteredSubmissions.filter(sub => sub.teacher === teacher);
          return { name: teacher, submissions: teacherSubmissions };
        });
        
        setHierarchyData({
          districts: [],
          schools: [],
          teachers: teacherData
        });
      }
      
      setSubmissions(filteredSubmissions);
      setIsLoading(false);
    }
  }, [params]);
  
  // Apply filters when they change
  useEffect(() => {
    if (!isLoading) {
      // Start with all submissions for this entity
      let filteredSubmissions = [];
      
      // Combine all submissions
      const allSubmissions = [
        ...schoolOutputSubmissions,
        ...districtOutputSubmissions,
        ...consolidatedChecklistSubmissions,
        ...partnersInPlaySubmissions
      ];
      
      // Apply entity filter
      if (entityType === 'region') {
        filteredSubmissions = entityName === 'All' ? 
          allSubmissions : 
          allSubmissions.filter(sub => sub.region === entityName);
      } else if (entityType === 'district') {
        filteredSubmissions = allSubmissions.filter(sub => sub.district === entityName);
      } else if (entityType === 'school') {
        filteredSubmissions = allSubmissions.filter(sub => sub.school === entityName);
      }
      
      // Apply itinerary filter
      if (itineraryFilter !== 'all') {
        filteredSubmissions = filteredSubmissions.filter(sub => sub.itinerary === itineraryFilter);
      }
      
      // Apply date range filter if both start and end dates are set
      if (dateRangeFilter.start && dateRangeFilter.end) {
        const startDate = new Date(dateRangeFilter.start);
        const endDate = new Date(dateRangeFilter.end);
        
        filteredSubmissions = filteredSubmissions.filter(sub => {
          const submissionDate = new Date(sub.submitted_at);
          return submissionDate >= startDate && submissionDate <= endDate;
        });
      }
      
      setSubmissions(filteredSubmissions);
      
      // Update hierarchy data based on filtered submissions
      if (entityType === 'region') {
        // Group by districts
        const districts = [...new Set(filteredSubmissions.map(sub => sub.district))];
        const districtData = districts.map(district => {
          const districtSubmissions = filteredSubmissions.filter(sub => sub.district === district);
          const schools = [...new Set(districtSubmissions.map(sub => sub.school))];
          const schoolData = schools.map(school => {
            const schoolSubmissions = districtSubmissions.filter(sub => sub.school === school);
            const teachers = [...new Set(schoolSubmissions.map(sub => sub.teacher))];
            return { name: school, submissions: schoolSubmissions, teachers };
          });
          
          return { name: district, submissions: districtSubmissions, schools: schoolData };
        });
        
        setHierarchyData({
          districts: districtData,
          schools: [],
          teachers: []
        });
      } else if (entityType === 'district') {
        // Group by schools
        const schools = [...new Set(filteredSubmissions.map(sub => sub.school))];
        const schoolData = schools.map(school => {
          const schoolSubmissions = filteredSubmissions.filter(sub => sub.school === school);
          const teachers = [...new Set(schoolSubmissions.map(sub => sub.teacher))];
          const teacherData = teachers.map(teacher => {
            const teacherSubmissions = schoolSubmissions.filter(sub => sub.teacher === teacher);
            return { name: teacher, submissions: teacherSubmissions };
          });
          
          return { name: school, submissions: schoolSubmissions, teachers: teacherData };
        });
        
        setHierarchyData({
          districts: [],
          schools: schoolData,
          teachers: []
        });
      } else if (entityType === 'school') {
        // Group by teachers
        const teachers = [...new Set(filteredSubmissions.map(sub => sub.teacher))];
        const teacherData = teachers.map(teacher => {
          const teacherSubmissions = filteredSubmissions.filter(sub => sub.teacher === teacher);
          return { name: teacher, submissions: teacherSubmissions };
        });
        
        setHierarchyData({
          districts: [],
          schools: [],
          teachers: teacherData
        });
      }
    }
  }, [isLoading, itineraryFilter, dateRangeFilter, entityType, entityName]);
  
  // If loading, show loading indicator
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          component="button" 
          variant="body2" 
          onClick={() => router.push('/dashboard/admin/rtp-ui')}
        >
          Dashboard
        </Link>
        {entityType === 'district' && (
          <Link 
            component="button" 
            variant="body2" 
            onClick={() => router.push(`/dashboard/admin/rtp-ui/hierarchy-view/region/${encodeURIComponent(submissions[0]?.region || 'All')}`)}
          >
            {submissions[0]?.region || 'Region'}
          </Link>
        )}
        {entityType === 'school' && (
          <>
            <Link 
              component="button" 
              variant="body2" 
              onClick={() => router.push(`/dashboard/admin/rtp-ui/hierarchy-view/region/${encodeURIComponent(submissions[0]?.region || 'All')}`)}
            >
              {submissions[0]?.region || 'Region'}
            </Link>
            <Link 
              component="button" 
              variant="body2" 
              onClick={() => router.push(`/dashboard/admin/rtp-ui/hierarchy-view/district/${encodeURIComponent(submissions[0]?.district || '')}`)}
            >
              {submissions[0]?.district || 'District'}
            </Link>
          </>
        )}
        <Typography color="text.primary">{entityName}</Typography>
      </Breadcrumbs>
      
      {/* Back button */}
      <IconButton 
        onClick={handleBack} 
        sx={{ mb: 2 }}
        aria-label="back"
      >
        <ArrowBackIcon />
      </IconButton>
      
      {/* Entity Info Card */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            {entityType === 'region' ? <PublicIcon /> : 
             entityType === 'district' ? <AccountBalanceIcon /> : <SchoolIcon />}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">{entityName}</Typography>
            <Typography variant="body1" color="text.secondary">
              {entityType === 'region' ? 'Region' : entityType === 'district' ? 'District' : 'School'}
            </Typography>
          </Box>
        </Box>
        
        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Total Submissions</Typography>
                <Typography variant="h4" fontWeight="bold">{submissions.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">
                  {entityType === 'region' ? 'Districts' : 
                   entityType === 'district' ? 'Schools' : 'Teachers'}
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {entityType === 'region' ? hierarchyData.districts.length : 
                   entityType === 'district' ? hierarchyData.schools.length : 
                   hierarchyData.teachers.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Survey Types</Typography>
                <Typography variant="h4" fontWeight="bold">{Object.keys(submissionsByType).length}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Last Submission</Typography>
                <Typography variant="h6" fontWeight="bold">
                  {submissions.length > 0 ? 
                    formatDate(submissions.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0].submitted_at) : 
                    'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Filtering controls */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="medium" gutterBottom>Filters</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="itinerary-filter-label">Itinerary</InputLabel>
              <Select
                labelId="itinerary-filter-label"
                value={itineraryFilter}
                label="Itinerary"
                onChange={(e) => setItineraryFilter(e.target.value)}
              >
                {availableItineraries.map((itinerary) => (
                  <MenuItem key={itinerary} value={itinerary}>
                    {itinerary === 'all' ? 'All Itineraries' : itinerary}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Start Date"
                value={dateRangeFilter.start}
                onChange={(newValue) => {
                  setDateRangeFilter(prev => ({ ...prev, start: newValue }));
                }}
                slotProps={{
                  textField: { size: 'small', fullWidth: true }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid size={{ xs: 12, md: 4 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="End Date"
                value={dateRangeFilter.end}
                onChange={(newValue) => {
                  setDateRangeFilter(prev => ({ ...prev, end: newValue }));
                }}
                slotProps={{
                  textField: { size: 'small', fullWidth: true }
                }}
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid size={{ xs: 12 }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => {
                  setItineraryFilter('all');
                  setDateRangeFilter({ start: null, end: null });
                }}
                sx={{ mr: 1 }}
              >
                Clear Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Hierarchical View */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h6" fontWeight="medium" gutterBottom>
          Hierarchical View
        </Typography>
        
        {entityType === 'region' && (
          <Box>
            {hierarchyData.districts.map((district, index) => (
              <Accordion key={index} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                      <Typography fontWeight="medium">{district.name}</Typography>
                    </Box>
                    <Chip 
                      label={`${district.submissions.length} submissions`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ pl: 2 }}>
                    {district.schools.map((school, schoolIndex) => (
                      <Accordion key={schoolIndex}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <SchoolIcon color="secondary" sx={{ mr: 1 }} />
                              <Typography>{school.name}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Chip 
                                label={`${school.submissions.length} submissions`} 
                                size="small" 
                                color="secondary" 
                                variant="outlined"
                                sx={{ mr: 1 }}
                              />
                              <Button 
                                size="small" 
                                variant="outlined" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/admin/rtp-ui/hierarchy-view/school/${encodeURIComponent(school.name)}`);
                                }}
                              >
                                View
                              </Button>
                            </Box>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {school.teachers.map((teacher, teacherIndex) => (
                              <ListItem 
                                key={teacherIndex} 
                                divider={teacherIndex < school.teachers.length - 1}
                                secondaryAction={
                                  <Button 
                                    size="small" 
                                    variant="text"
                                    onClick={() => router.push(`/dashboard/admin/rtp-ui/teacher-submissions/${encodeURIComponent(teacher)}`)}
                                  >
                                    View Submissions
                                  </Button>
                                }
                              >
                                <ListItemIcon>
                                  <PersonIcon />
                                </ListItemIcon>
                                <ListItemText primary={teacher} />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
        
        {entityType === 'district' && (
          <Box>
            {hierarchyData.schools.map((school, index) => (
              <Accordion key={index} defaultExpanded={index === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <SchoolIcon color="primary" sx={{ mr: 1 }} />
                      <Typography fontWeight="medium">{school.name}</Typography>
                    </Box>
                    <Chip 
                      label={`${school.submissions.length} submissions`} 
                      size="small" 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {school.teachers.map((teacher, teacherIndex) => (
                      <ListItem 
                        key={teacherIndex} 
                        divider={teacherIndex < school.teachers.length - 1}
                        secondaryAction={
                          <Button 
                            size="small" 
                            variant="text"
                            onClick={() => router.push(`/dashboard/admin/rtp-ui/teacher-submissions/${encodeURIComponent(teacher.name)}`)}
                          >
                            View Submissions
                          </Button>
                        }
                      >
                        <ListItemIcon>
                          <PersonIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary={teacher.name} 
                          secondary={`${teacher.submissions.length} submissions`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
        
        {entityType === 'school' && (
          <List>
            {hierarchyData.teachers.map((teacher, index) => (
              <ListItem 
                key={index} 
                divider={index < hierarchyData.teachers.length - 1}
                secondaryAction={
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={() => router.push(`/dashboard/admin/rtp-ui/teacher-submissions/${encodeURIComponent(teacher.name)}`)}
                  >
                    View Submissions
                  </Button>
                }
              >
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText 
                  primary={teacher.name} 
                  secondary={`${teacher.submissions.length} submissions`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
      
      {/* Tabs for different survey types */}
      <Paper elevation={0} sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Submissions" />
          {Object.keys(submissionsByType).map((type, index) => (
            <Tab key={index} label={getSurveyTypeName(type)} icon={getSurveyTypeIcon(type)} iconPosition="start" />
          ))}
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {/* All Submissions Tab */}
          {activeTab === 0 && (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Survey Type</TableCell>
                    <TableCell>Teacher</TableCell>
                    <TableCell>School</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Itinerary</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((submission, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {getSurveyTypeIcon(submission.survey_type)}
                          <Typography variant="body2" sx={{ ml: 1 }}>
                            {getSurveyTypeName(submission.survey_type)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{submission.teacher}</TableCell>
                      <TableCell>{submission.school}</TableCell>
                      <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                      <TableCell>{submission.itinerary || 'N/A'}</TableCell>
                      <TableCell align="right">
                        <Button 
                          size="small" 
                          variant="outlined" 
                          startIcon={<VisibilityIcon />}
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
          )}
          
          {/* Survey Type Tabs */}
          {Object.keys(submissionsByType).map((type, index) => (
            activeTab === index + 1 && (
              <TableContainer key={index}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Teacher</TableCell>
                      <TableCell>School</TableCell>
                      <TableCell>Submitted</TableCell>
                      <TableCell>Itinerary</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submissionsByType[type].map((submission, subIndex) => (
                      <TableRow key={subIndex} hover>
                        <TableCell>{submission.teacher}</TableCell>
                        <TableCell>{submission.school}</TableCell>
                        <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                        <TableCell>{submission.itinerary || 'N/A'}</TableCell>
                        <TableCell align="right">
                          <Button 
                            size="small" 
                            variant="outlined" 
                            startIcon={<VisibilityIcon />}
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
            )
          ))}
        </Box>
      </Paper>
    </Box>
  );
}
