'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Breadcrumbs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  IconButton,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Icons
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import BarChartIcon from '@mui/icons-material/BarChart';
import WomanIcon from '@mui/icons-material/Woman';
import ManIcon from '@mui/icons-material/Man';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InfoIcon from '@mui/icons-material/Info';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import SupervisedUserCircleIcon from '@mui/icons-material/SupervisedUserCircle';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TableChartIcon from '@mui/icons-material/TableChart';

// Import dynamic charts component
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Import export utility functions
import { 
  downloadCSV, 
  createExportFilename,
  fetchAndExportCSV
} from '@/utils/export';

// TabPanel component for Tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function GenderAnalysisPage() {
  const router = useRouter();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedItinerary, setSelectedItinerary] = useState('');
  const [itineraries, setItineraries] = useState([]);
  const [schoolType, setSchoolType] = useState('all');
  const [comparisonView, setComparisonView] = useState('counts');
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch active itineraries
        const itinerariesRes = await fetch('/api/rtp/itineraries');
        const itinerariesData = await itinerariesRes.json();
        const activeItineraries = itinerariesData.itineraries?.filter(it => it.is_valid) || [];
        setItineraries(activeItineraries);
        
        if (activeItineraries.length > 0) {
          setSelectedItinerary(activeItineraries[0].id);
          await fetchAnalyticsData(activeItineraries[0].id, 'all');
        } else {
          setAnalyticsData(null);
          setError("No active itineraries found");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Fetch analytics data
  const fetchAnalyticsData = async (itineraryId, schoolTypeFilter) => {
    setLoading(true);
    try {
      const url = `/api/rtp/analytics?itineraryId=${itineraryId}&schoolType=${schoolTypeFilter}&viewMode=gender-disaggregated`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'success') {
        setAnalyticsData(data.data);
      } else {
        setError("Failed to fetch analytics data");
      }
    } catch (err) {
      console.error(err);
      setError("Error fetching analytics data");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle itinerary selection change
  const handleItineraryChange = (event) => {
    const newItineraryId = event.target.value;
    setSelectedItinerary(newItineraryId);
    fetchAnalyticsData(newItineraryId, schoolType);
  };
  
  // Handle school type filter change
  const handleSchoolTypeChange = (event) => {
    const newSchoolType = event.target.value;
    setSchoolType(newSchoolType);
    fetchAnalyticsData(selectedItinerary, newSchoolType);
  };
  
  // Handle comparison view change
  const handleComparisonViewChange = (event, newValue) => {
    if (newValue !== null) {
      setComparisonView(newValue);
    }
  };
  
  // Handle export menu open/close
  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };
  
  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };
  
  // Export data to CSV
  const handleExportCSV = (event) => {
    handleExportMenuOpen(event);
  };
  
  // Handle exporting specific data type
  const handleExportData = async (exportType) => {
    handleExportMenuClose();
    setExportLoading(true);
    
    try {
      // Determine export filename based on type
      const filenamePrefix = `rtp-gender-analysis-${exportType}`;
      const filename = createExportFilename(filenamePrefix, {
        itinerary: selectedItinerary,
        schoolType
      });
      
      // Define the export headers based on the export type
      let headers = [];
      
      switch (exportType) {
        case 'teachers':
          headers = [
            { key: 'category', display: 'Teacher Category' },
            { key: 'male', display: 'Male Count' },
            { key: 'female', display: 'Female Count' },
            { key: 'total', display: 'Total' },
            { key: 'femalePercentage', display: 'Female %' },
            { key: 'district', display: 'District' }
          ];
          break;
        case 'students':
          headers = [
            { key: 'category', display: 'Student Category' },
            { key: 'male', display: 'Male Count' },
            { key: 'female', display: 'Female Count' },
            { key: 'total', display: 'Total' },
            { key: 'femalePercentage', display: 'Female %' },
            { key: 'district', display: 'District' }
          ];
          break;
        case 'districts':
          headers = [
            { key: 'category', display: 'Category' },
            { key: 'male', display: 'Male Count' },
            { key: 'female', display: 'Female Count' },
            { key: 'total', display: 'Total' },
            { key: 'femalePercentage', display: 'Female %' },
            { key: 'district', display: 'District' }
          ];
          break;
        case 'outcomes':
          headers = [
            { key: 'category', display: 'Outcome Measure' },
            { key: 'male', display: 'Male %' },
            { key: 'female', display: 'Female %' },
            { key: 'gap', display: 'Gender Gap (pp)' },
            { key: 'district', display: 'District' },
            { key: 'term', display: 'Term' },
            { key: 'notes', display: 'Notes' }
          ];
          break;
        case 'trends':
          headers = [
            { key: 'category', display: 'Category' },
            { key: 'male', display: 'Male' },
            { key: 'female', display: 'Female' },
            { key: 'total', display: 'Total' },
            { key: 'femalePercentage', display: 'Female %' },
            { key: 'gap', display: 'Gender Gap' },
            { key: 'term', display: 'Term' },
            { key: 'notes', display: 'Notes' }
          ];
          break;
        case 'all':
        default:
          headers = [
            { key: 'dataType', display: 'Data Category' },
            { key: 'category', display: 'Subcategory' },
            { key: 'male', display: 'Male' },
            { key: 'female', display: 'Female' },
            { key: 'total', display: 'Total' },
            { key: 'femalePercentage', display: 'Female %' },
            { key: 'gap', display: 'Gender Gap' },
            { key: 'district', display: 'District' },
            { key: 'term', display: 'Term' },
            { key: 'notes', display: 'Notes' }
          ];
          break;
      }
      
      // Fetch data from API and export to CSV
      const apiUrl = `/api/rtp/export/gender-analysis?itineraryId=${selectedItinerary}&schoolType=${schoolType}&exportType=${exportType}`;
      
      const result = await fetchAndExportCSV(
        apiUrl,
        headers,
        filename,
        (response) => response.data // Extract the data property from the API response
      );
      
      if (!result.success) {
        setError(`Failed to export data: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error exporting data:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };
  
  // Export all datasets
  const handleExportAll = async () => {
    await handleExportData('all');
  };
  
  // Calculate gender ratio indicator value (for gauges)
  const calculateGenderRatio = (male, female) => {
    const total = male + female;
    return total === 0 ? 50 : Math.round((female / total) * 100);
  };
  
  // Render gender ratio gauge
  const renderGenderRatioGauge = (title, male, female, icon) => {
    const ratio = calculateGenderRatio(male, female);
    const total = male + female;
    
    // Color calculation based on balance
    // 50% is perfect balance (green)
    // Below 40% or above 60% starts to get more red
    const getColor = (ratio) => {
      if (ratio >= 45 && ratio <= 55) return '#4CAF50'; // Green for balanced (45-55%)
      if (ratio >= 40 && ratio < 45) return '#FFC107'; // Yellow for slight imbalance (40-45%)
      if (ratio > 55 && ratio <= 60) return '#FFC107'; // Yellow for slight imbalance (55-60%)
      return '#F44336'; // Red for significant imbalance (<40% or >60%)
    };
    
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom align="center">
            {title}
            <Tooltip title="Shows the proportion of females to total participants. 50% represents perfect gender balance.">
              <IconButton size="small">
                <InfoIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Typography>
          
          <Box sx={{ position: 'relative', textAlign: 'center', mt: 1, mb: 3 }}>
            {icon}
          </Box>
          
          <Box sx={{ mt: 2 }}>
            <Chart
              options={{
                chart: {
                  type: 'radialBar',
                  offsetY: -10,
                  sparkline: {
                    enabled: true
                  }
                },
                plotOptions: {
                  radialBar: {
                    startAngle: -90,
                    endAngle: 90,
                    track: {
                      background: '#e7e7e7',
                      strokeWidth: '97%',
                      margin: 5,
                      dropShadow: {
                        enabled: false
                      }
                    },
                    dataLabels: {
                      name: {
                        show: false
                      },
                      value: {
                        offsetY: -2,
                        fontSize: '22px'
                      }
                    },
                    hollow: {
                      margin: 15,
                      size: '50%'
                    }
                  }
                },
                fill: {
                  type: 'solid',
                  colors: [getColor(ratio)]
                },
                labels: ['Female %'],
                colors: [getColor(ratio)]
              }}
              series={[ratio]}
              type="radialBar"
              height={180}
            />
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">Male</Typography>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MaleIcon sx={{ color: '#2196F3', mr: 0.5 }} />
                {male.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">Female</Typography>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FemaleIcon sx={{ color: '#F06292', mr: 0.5 }} />
                {female.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">Total</Typography>
              <Typography variant="h6">
                {total.toLocaleString()}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  // Chart generation helpers
  const generateTeacherTrainingChart = () => ({
    options: {
      chart: { type: comparisonView === 'pie' ? 'pie' : 'bar' },
      xaxis: { categories: ['Teacher Champions','PBL Training','ECE Training','Other Training','No Training'] }
    },
    series: [
      { name: 'Male', data: analyticsData.outputIndicators.schoolLevel.teacherChampions.male ? [analyticsData.outputIndicators.schoolLevel.teacherChampions.male, analyticsData.outputIndicators.schoolLevel.teachersPBL.male, analyticsData.outputIndicators.schoolLevel.teachersECE.male, analyticsData.outputIndicators.schoolLevel.teachersOther.male, analyticsData.outputIndicators.schoolLevel.teachersNoTraining.male] : [] },
      { name: 'Female', data: analyticsData.outputIndicators.schoolLevel.teacherChampions.female ? [analyticsData.outputIndicators.schoolLevel.teacherChampions.female, analyticsData.outputIndicators.schoolLevel.teachersPBL.female, analyticsData.outputIndicators.schoolLevel.teachersECE.female, analyticsData.outputIndicators.schoolLevel.teachersOther.female, analyticsData.outputIndicators.schoolLevel.teachersNoTraining.female] : [] }
    ]
  });

  const generateEnrollmentChart = () => ({
    options: {
      chart: { type: comparisonView === 'pie' ? 'pie' : 'bar' },
      xaxis: { categories: ['Total Enrollment','Special Needs Students'] }
    },
    series: [
      { name: 'Male', data: [analyticsData.outputIndicators.schoolLevel.studentsEnrolled.male, analyticsData.outputIndicators.schoolLevel.studentsSpecialNeeds.male] },
      { name: 'Female', data: [analyticsData.outputIndicators.schoolLevel.studentsEnrolled.female, analyticsData.outputIndicators.schoolLevel.studentsSpecialNeeds.female] }
    ]
  });

  const generateEnrollmentByDistrictChart = () => {
    const data = analyticsData.outputIndicators.schoolLevel.studentsEnrolled.byDistrict || [];
    return {
      options: { chart: { type: 'bar' }, xaxis: { categories: data.map(d => d.district) } },
      series: [ { name: 'Male', data: data.map(d => d.male) }, { name: 'Female', data: data.map(d => d.female) } ]
    };
  };

  const generateGenderGapChart = () => ({
    options: {
      chart: { type: 'bar' },
      xaxis: { categories: ['Teacher Champions','PBL Training','ECE Training','Other Training','No Training'] }
    },
    series: [{
      name: 'Gender Gap',
      data: [
        analyticsData.genderAnalysis.teacherTrainingGap.teacherChampions.gap,
        analyticsData.genderAnalysis.teacherTrainingGap.teachersPBL.gap,
        analyticsData.genderAnalysis.teacherTrainingGap.teachersECE.gap,
        analyticsData.genderAnalysis.teacherTrainingGap.teachersOther.gap,
        analyticsData.genderAnalysis.teacherTrainingGap.teachersNoTraining.gap
      ]
    }]
  });

  const generateOutcomeChart = () => {
    const o = analyticsData.outputIndicators.outcomeIndicators;
    return {
      options: {
        chart: { type: 'bar' },
        xaxis: { categories: ['Implementation Plans','LTP Dev Plans','Lesson Plans','Learning Environments','Teaching Skills'] }
      },
      series: [{
        name: 'Percentage',
        data: [
          o.implementationPlans.percentage,
          o.developmentPlans.percentage,
          o.lessonPlans.percentage,
          o.learningEnvironments.percentage,
          o.teacherSkills.percentage
        ]
      }]
    };
  };

  const generateTrendsChart = () => ({
    options: { chart: { type: 'line' }, xaxis: { categories: analyticsData.trends.itineraries.map(i => i.term || i.title) } },
    series: [ { name: 'Male', data: analyticsData.trends.teacherTraining.male }, { name: 'Female', data: analyticsData.trends.teacherTraining.female } ]
  });

  const generateDistrictLevelChart = () => ({
    options: { chart: { type: 'bar' }, xaxis: { categories: ['Team Members','Planning Attendees','Trainers'] } },
    series: [ { name: 'Male', data: [analyticsData.districtLevelGaps.teamMembers.male, analyticsData.districtLevelGaps.planningAttendees.male, analyticsData.districtLevelGaps.trainers.male] }, { name: 'Female', data: [analyticsData.districtLevelGaps.teamMembers.female, analyticsData.districtLevelGaps.planningAttendees.female, analyticsData.districtLevelGaps.trainers.female] } ]
  });

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Link href="/dashboard/admin/rtp" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <SportsSoccerIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Right to Play
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <BarChartIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Gender Analysis
        </Typography>
      </Breadcrumbs>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <BarChartIcon sx={{ mr: 2, fontSize: 35, color: 'primary.main' }} />
          Gender-Disaggregated Analysis
        </Typography>
        <Button 
          variant="contained" 
          startIcon={exportLoading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
          onClick={handleExportCSV}
          disabled={exportLoading}
        >
          Export Data
        </Button>
        {/* Export Menu */}
        <Menu
          anchorEl={exportMenuAnchor}
          open={Boolean(exportMenuAnchor)}
          onClose={handleExportMenuClose}
        >
          <MenuItem onClick={() => handleExportData('teachers')}>
            <ListItemIcon>
              <PeopleIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export Teacher Training Data</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExportData('students')}>
            <ListItemIcon>
              <SchoolIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export Student Enrollment Data</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExportData('districts')}>
            <ListItemIcon>
              <LocationCityIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export District Teams Data</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExportData('outcomes')}>
            <ListItemIcon>
              <AssessmentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export Teaching Outcomes Data</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleExportData('trends')}>
            <ListItemIcon>
              <TrendingUpIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export Trends Analysis Data</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleExportAll}>
            <ListItemIcon>
              <TableChartIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Export All Data</ListItemText>
          </MenuItem>
        </Menu>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Filters */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="itinerary-select-label">Itinerary</InputLabel>
                  <Select
                    labelId="itinerary-select-label"
                    id="itinerary-select"
                    value={selectedItinerary}
                    label="Itinerary"
                    onChange={handleItineraryChange}
                  >
                    {itineraries.map((itinerary) => (
                      <MenuItem key={itinerary.id} value={itinerary.id}>
                        {itinerary.title} ({itinerary.from_date} to {itinerary.until_date})
                      </MenuItem>
                    ))}
                    {itineraries.length === 0 && (
                      <MenuItem disabled>No active itineraries available</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="school-type-select-label">School Type</InputLabel>
                  <Select
                    labelId="school-type-select-label"
                    id="school-type-select"
                    value={schoolType}
                    label="School Type"
                    onChange={handleSchoolTypeChange}
                  >
                    <MenuItem value="all">All Schools</MenuItem>
                    <MenuItem value="galop">GALOP Schools Only</MenuItem>
                    <MenuItem value="non-galop">Non-GALOP Schools Only</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  Chart Display Options:
                </Typography>
                <ToggleButtonGroup
                  value={comparisonView}
                  exclusive
                  onChange={handleComparisonViewChange}
                  aria-label="chart display options"
                  size="small"
                >
                  <ToggleButton value="counts" aria-label="side by side">
                    Side by Side
                  </ToggleButton>
                  <ToggleButton value="stacked" aria-label="stacked">
                    Stacked
                  </ToggleButton>
                  <ToggleButton value="percentage" aria-label="percentage">
                    Percentage
                  </ToggleButton>
                  <ToggleButton value="horizontal" aria-label="horizontal">
                    Horizontal
                  </ToggleButton>
                  <ToggleButton value="pie" aria-label="pie">
                    Pie
                  </ToggleButton>
                </ToggleButtonGroup>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Gender Balance Summary Cards */}
          {analyticsData && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={3}>
                {renderGenderRatioGauge(
                  "Teachers Trained",
                  analyticsData.summary.totalTeachersTrained.male,
                  analyticsData.summary.totalTeachersTrained.female,
                  <PeopleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                )}
              </Grid>
              <Grid item xs={12} md={3}>
                {renderGenderRatioGauge(
                  "Student Enrollment",
                  analyticsData.outputIndicators.schoolLevel.studentsEnrolled.male,
                  analyticsData.outputIndicators.schoolLevel.studentsEnrolled.female,
                  <SchoolIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                )}
              </Grid>
              <Grid item xs={12} md={3}>
                {renderGenderRatioGauge(
                  "Special Needs Students",
                  analyticsData.outputIndicators.schoolLevel.studentsSpecialNeeds.male,
                  analyticsData.outputIndicators.schoolLevel.studentsSpecialNeeds.female,
                  <AccessibilityNewIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                )}
              </Grid>
              <Grid item xs={12} md={3}>
                {renderGenderRatioGauge(
                  "District Team Members",
                  analyticsData.outputIndicators.districtLevel.districtTeamMembersTrained.male,
                  analyticsData.outputIndicators.districtLevel.districtTeamMembersTrained.female,
                  <SupervisedUserCircleIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                )}
              </Grid>
            </Grid>
          )}
          
          {/* Tabs for different analysis views */}
          <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="gender analysis tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab 
                icon={<PeopleIcon />} 
                iconPosition="start" 
                label="Teacher Training" 
                id="tab-0" 
                aria-controls="tabpanel-0" 
              />
              <Tab 
                icon={<SchoolIcon />} 
                iconPosition="start" 
                label="Student Enrollment" 
                id="tab-1" 
                aria-controls="tabpanel-1" 
              />
              <Tab 
                icon={<PersonSearchIcon />} 
                iconPosition="start" 
                label="Gender Gap Analysis" 
                id="tab-2" 
                aria-controls="tabpanel-2" 
              />
              <Tab 
                icon={<AssessmentIcon />} 
                iconPosition="start" 
                label="Teaching Outcomes" 
                id="tab-3" 
                aria-controls="tabpanel-3" 
              />
              <Tab 
                icon={<TrendingUpIcon />} 
                iconPosition="start" 
                label="Training Trends" 
                id="tab-4" 
                aria-controls="tabpanel-4" 
              />
              <Tab 
                icon={<LocationCityIcon />} 
                iconPosition="start" 
                label="District Analysis" 
                id="tab-5" 
                aria-controls="tabpanel-5" 
              />
            </Tabs>
          </Paper>
          
          {analyticsData ? (
            <>
              {/* Teacher Training Tab */}
              <TabPanel value={activeTab} index={0}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>Teacher Training Analysis</Typography>
                  <Typography variant="body1" paragraph>
                    This analysis shows the gender breakdown of teachers who have participated in various types of training programs.
                  </Typography>
                  
                  <Chart
                    options={generateTeacherTrainingChart().options}
                    series={generateTeacherTrainingChart().series}
                    type={comparisonView === 'pie' ? 'pie' : 'bar'}
                    height={400}
                  />
                  
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Analysis Insights</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Gender Balance in Training Programs
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {analyticsData.genderAnalysis.teacherTrainingGap.totalTeachers.gap > 0 ? 
                            `There are ${Math.abs(analyticsData.genderAnalysis.teacherTrainingGap.totalTeachers.gap)} more female teachers than male teachers participating in training programs.` :
                            `There are ${Math.abs(analyticsData.genderAnalysis.teacherTrainingGap.totalTeachers.gap)} more male teachers than female teachers participating in training programs.`
                          }
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Female teachers make up {calculateGenderRatio(
                            analyticsData.summary.totalTeachersTrained.male,
                            analyticsData.summary.totalTeachersTrained.female
                          )}% of all trained teachers.
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Training Type Distribution
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {analyticsData.genderAnalysis.teacherTrainingGap.teacherChampions.gap > 0 ?
                            `Female teachers represent a higher proportion (${calculateGenderRatio(
                              analyticsData.outputIndicators.schoolLevel.teacherChampions.male,
                              analyticsData.outputIndicators.schoolLevel.teacherChampions.female
                            )}%) of Teacher Champions.` :
                            `Male teachers represent a higher proportion (${100 - calculateGenderRatio(
                              analyticsData.outputIndicators.schoolLevel.teacherChampions.male,
                              analyticsData.outputIndicators.schoolLevel.teacherChampions.female
                            )}%) of Teacher Champions.`
                          }
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {analyticsData.genderAnalysis.teacherTrainingGap.teachersPBL.gap > 0 ?
                            `PBL training shows the highest female participation at ${calculateGenderRatio(
                              analyticsData.outputIndicators.schoolLevel.teachersPBL.male,
                              analyticsData.outputIndicators.schoolLevel.teachersPBL.female
                            )}%.` :
                            `PBL training shows the highest male participation at ${100 - calculateGenderRatio(
                              analyticsData.outputIndicators.schoolLevel.teachersPBL.male,
                              analyticsData.outputIndicators.schoolLevel.teachersPBL.female
                            )}%.`
                          }
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </TabPanel>
              
              {/* Student Enrollment Tab */}
              <TabPanel value={activeTab} index={1}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h5" gutterBottom>Student Enrollment Analysis</Typography>
                  <Typography variant="body1" paragraph>
                    This analysis shows the gender breakdown of student enrollment, including students with special needs.
                  </Typography>
                  
                  <Chart
                    options={generateEnrollmentChart().options}
                    series={generateEnrollmentChart().series}
                    type={comparisonView === 'pie' ? 'pie' : 'bar'}
                    height={400}
                  />
                  
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Analysis Insights</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Gender Balance in Enrollment
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {analyticsData.genderAnalysis.enrollmentGap.totalEnrollment.gap > 0 ? 
                            `There are ${Math.abs(analyticsData.genderAnalysis.enrollmentGap.totalEnrollment.gap)} more female students than male students enrolled.` :
                            `There are ${Math.abs(analyticsData.genderAnalysis.enrollmentGap.totalEnrollment.gap)} more male students than female students enrolled.`
                          }
                        </Typography>
                        <Typography variant="body2" paragraph>
                          The gender gap in enrollment represents a {Math.abs(analyticsData.genderAnalysis.enrollmentGap.totalEnrollment.gapPercentage)}% 
                          difference, with {analyticsData.genderAnalysis.enrollmentGap.totalEnrollment.gap > 0 ? 'females' : 'males'} being the majority.
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Special Needs Students
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Among students with special needs, there {analyticsData.genderAnalysis.enrollmentGap.specialNeeds.gap > 0 ?
                            `are ${Math.abs(analyticsData.genderAnalysis.enrollmentGap.specialNeeds.gap)} more females than males.` :
                            `are ${Math.abs(analyticsData.genderAnalysis.enrollmentGap.specialNeeds.gap)} more males than females.`
                          }
                        </Typography>
                        <Typography variant="body2" paragraph>
                          This represents a significant gender gap of {Math.abs(analyticsData.genderAnalysis.enrollmentGap.specialNeeds.gapPercentage)}%, 
                          which is {Math.abs(analyticsData.genderAnalysis.enrollmentGap.specialNeeds.gapPercentage) > 
                              Math.abs(analyticsData.genderAnalysis.enrollmentGap.totalEnrollment.gapPercentage) ? 
                              'larger' : 'smaller'} than the overall enrollment gender gap.
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
                
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>Enrollment by District</Typography>
                  <Typography variant="body1" paragraph>
                    This chart shows the gender breakdown of student enrollment across different districts.
                  </Typography>
                  
                  <Chart
                    options={generateEnrollmentByDistrictChart().options}
                    series={generateEnrollmentByDistrictChart().series}
                    type="bar"
                    height={400}
                  />
                </Paper>
              </TabPanel>
              
              {/* Gender Gap Analysis Tab */}
              <TabPanel value={activeTab} index={2}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>Gender Gap Analysis</Typography>
                  <Typography variant="body1" paragraph>
                    This analysis shows the gender gap (difference between female and male numbers) across various indicators.
                    Positive values indicate more females, negative values indicate more males.
                  </Typography>
                  
                  <Chart
                    options={generateGenderGapChart().options}
                    series={generateGenderGapChart().series}
                    type="bar"
                    height={400}
                  />
                  
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Analysis Insights</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Teacher Training Gaps
                        </Typography>
                        <Typography variant="body2" paragraph>
                          The largest gender gap is in PBL Training, with 
                          {analyticsData.genderAnalysis.teacherTrainingGap.teachersPBL.gap > 0 ?
                            ` ${analyticsData.genderAnalysis.teacherTrainingGap.teachersPBL.gap} more female teachers` :
                            ` ${Math.abs(analyticsData.genderAnalysis.teacherTrainingGap.teachersPBL.gap)} more male teachers`
                          } participating.
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {analyticsData.genderAnalysis.teacherTrainingGap.teachersNoTraining.gap > 0 ?
                            `There are more female teachers (${analyticsData.genderAnalysis.teacherTrainingGap.teachersNoTraining.gap}) who have received no training.` :
                            `There are more male teachers (${Math.abs(analyticsData.genderAnalysis.teacherTrainingGap.teachersNoTraining.gap)}) who have received no training.`
                          }
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Participation Observations
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {analyticsData.genderAnalysis.teacherTrainingGap.teacherChampions.gap > 0 &&
                            analyticsData.genderAnalysis.teacherTrainingGap.teachersPBL.gap > 0 &&
                            analyticsData.genderAnalysis.teacherTrainingGap.teachersECE.gap > 0 ?
                            "Female teachers have higher participation rates across all major training categories (Champions, PBL, and ECE)." :
                            analyticsData.genderAnalysis.teacherTrainingGap.teacherChampions.gap < 0 &&
                            analyticsData.genderAnalysis.teacherTrainingGap.teachersPBL.gap < 0 &&
                            analyticsData.genderAnalysis.teacherTrainingGap.teachersECE.gap < 0 ?
                            "Male teachers have higher participation rates across all major training categories (Champions, PBL, and ECE)." :
                            "There is a mixed pattern of gender participation across different training categories."
                          }
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Teacher transfers show a gender gap of 
                          {analyticsData.outputIndicators.schoolLevel.teacherTransfers.male - 
                            analyticsData.outputIndicators.schoolLevel.teacherTransfers.female > 0 ?
                            ` ${analyticsData.outputIndicators.schoolLevel.teacherTransfers.male - 
                              analyticsData.outputIndicators.schoolLevel.teacherTransfers.female} more males` :
                            ` ${analyticsData.outputIndicators.schoolLevel.teacherTransfers.female - 
                              analyticsData.outputIndicators.schoolLevel.teacherTransfers.male} more females`
                          } being transferred during this period.
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </TabPanel>
              
              {/* Teaching Outcomes Tab */}
              <TabPanel value={activeTab} index={3}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>Teaching Outcomes by Gender</Typography>
                  <Typography variant="body1" paragraph>
                    This analysis compares teaching outcomes between male and female teachers, focusing on 
                    lesson plan incorporation and teaching skills related to Right to Play methodologies.
                  </Typography>
                  
                  <Chart
                    options={generateOutcomeChart().options}
                    series={generateOutcomeChart().series}
                    type="radar"
                    height={400}
                  />
                  
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Analysis Insights</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Lesson Plan Incorporation
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {analyticsData.genderAnalysis.performanceComparison.lessonPlans.gap > 0 ?
                            `Female teachers show higher rates (${analyticsData.outcomeIndicators.teachersWithLTPLessonPlans.female}%) 
                            of incorporating LtP methodologies in their lesson plans compared to male teachers 
                            (${analyticsData.outcomeIndicators.teachersWithLTPLessonPlans.male}%).` :
                            analyticsData.genderAnalysis.performanceComparison.lessonPlans.gap < 0 ?
                            `Male teachers show higher rates (${analyticsData.outcomeIndicators.teachersWithLTPLessonPlans.male}%) 
                            of incorporating LtP methodologies in their lesson plans compared to female teachers 
                            (${analyticsData.outcomeIndicators.teachersWithLTPLessonPlans.female}%).` :
                            `Both male and female teachers show equal rates (${analyticsData.outcomeIndicators.teachersWithLTPLessonPlans.male}%) 
                            of incorporating LtP methodologies in their lesson plans.`
                          }
                        </Typography>
                        <Typography variant="body2" paragraph>
                          The difference in lesson plan incorporation is 
                          {Math.abs(analyticsData.genderAnalysis.performanceComparison.lessonPlans.gap)} percentage points.
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Teaching Skills Assessment
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {analyticsData.genderAnalysis.performanceComparison.teachingSkills.gap > 0 ?
                            `Female teachers demonstrate higher proficiency (${analyticsData.outcomeIndicators.teachersWithLTPSkills.female}%) 
                            in LtP teaching skills compared to male teachers (${analyticsData.outcomeIndicators.teachersWithLTPSkills.male}%).` :
                            analyticsData.genderAnalysis.performanceComparison.teachingSkills.gap < 0 ?
                            `Male teachers demonstrate higher proficiency (${analyticsData.outcomeIndicators.teachersWithLTPSkills.male}%) 
                            in LtP teaching skills compared to female teachers (${analyticsData.outcomeIndicators.teachersWithLTPSkills.female}%).` :
                            `Both male and female teachers demonstrate equal proficiency (${analyticsData.outcomeIndicators.teachersWithLTPSkills.male}%) 
                            in LtP teaching skills.`
                          }
                        </Typography>
                        <Typography variant="body2" paragraph>
                          The gap in teaching skills proficiency is 
                          {Math.abs(analyticsData.genderAnalysis.performanceComparison.teachingSkills.gap)} percentage points, which
                          {Math.abs(analyticsData.genderAnalysis.performanceComparison.teachingSkills.gap) ===
                           Math.abs(analyticsData.genderAnalysis.performanceComparison.lessonPlans.gap) ? 
                           ' equals' : 
                           Math.abs(analyticsData.genderAnalysis.performanceComparison.teachingSkills.gap) >
                           Math.abs(analyticsData.genderAnalysis.performanceComparison.lessonPlans.gap) ?
                           ' exceeds' : ' is less than'} the gap in lesson plan incorporation.
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </TabPanel>
              
              {/* Training Trends Tab */}
              <TabPanel value={activeTab} index={4}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>Teacher Training Trends</Typography>
                  <Typography variant="body1" paragraph>
                    This analysis shows the trends in teacher training participation by gender over time.
                  </Typography>
                  
                  <Chart
                    options={generateTrendsChart().options}
                    series={generateTrendsChart().series}
                    type="line"
                    height={400}
                  />
                  
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Analysis Insights</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Overall Training Trends
                        </Typography>
                        <Typography variant="body2" paragraph>
                          Total teacher training participation has increased from 
                          {analyticsData.trends.teacherTraining.total[0]} in Term 1 to 
                          {analyticsData.trends.teacherTraining.total[2]} in the current term, 
                          representing a {Math.round((analyticsData.trends.teacherTraining.total[2] - 
                            analyticsData.trends.teacherTraining.total[0]) / 
                            analyticsData.trends.teacherTraining.total[0] * 100)}% increase.
                        </Typography>
                        <Typography variant="body2" paragraph>
                          The most significant increase occurred between Term 
                          {analyticsData.trends.teacherTraining.total[1] - analyticsData.trends.teacherTraining.total[0] >
                           analyticsData.trends.teacherTraining.total[2] - analyticsData.trends.teacherTraining.total[1] ?
                           '1 and Term 2' : '2 and the current term'}.
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          Gender-specific Trends
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {(analyticsData.trends.teacherTraining.female[2] - analyticsData.trends.teacherTraining.female[0]) / 
                           analyticsData.trends.teacherTraining.female[0] >
                           (analyticsData.trends.teacherTraining.male[2] - analyticsData.trends.teacherTraining.male[0]) / 
                           analyticsData.trends.teacherTraining.male[0] ?
                            `Female teacher participation has grown at a faster rate (${Math.round((analyticsData.trends.teacherTraining.female[2] - 
                              analyticsData.trends.teacherTraining.female[0]) / 
                              analyticsData.trends.teacherTraining.female[0] * 100)}%) compared to male teacher participation 
                              (${Math.round((analyticsData.trends.teacherTraining.male[2] - 
                              analyticsData.trends.teacherTraining.male[0]) / 
                              analyticsData.trends.teacherTraining.male[0] * 100)}%).` :
                            `Male teacher participation has grown at a faster rate (${Math.round((analyticsData.trends.teacherTraining.male[2] - 
                              analyticsData.trends.teacherTraining.male[0]) / 
                              analyticsData.trends.teacherTraining.male[0] * 100)}%) compared to female teacher participation 
                              (${Math.round((analyticsData.trends.teacherTraining.female[2] - 
                              analyticsData.trends.teacherTraining.female[0]) / 
                              analyticsData.trends.teacherTraining.female[0] * 100)}%).`
                          }
                        </Typography>
                        <Typography variant="body2" paragraph>
                          The gender ratio has {
                            calculateGenderRatio(
                              analyticsData.trends.teacherTraining.male[0],
                              analyticsData.trends.teacherTraining.female[0]
                            ) === calculateGenderRatio(
                              analyticsData.trends.teacherTraining.male[2],
                              analyticsData.trends.teacherTraining.female[2]
                            ) ? 'remained stable' :
                            calculateGenderRatio(
                              analyticsData.trends.teacherTraining.male[0],
                              analyticsData.trends.teacherTraining.female[0]
                            ) < calculateGenderRatio(
                              analyticsData.trends.teacherTraining.male[2],
                              analyticsData.trends.teacherTraining.female[2]
                            ) ? 'shifted toward higher female participation' :
                            'shifted toward higher male participation'
                          } over the three terms.
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </TabPanel>
              
              {/* District Analysis Tab */}
              <TabPanel value={activeTab} index={5}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h5" gutterBottom>District-level Gender Analysis</Typography>
                  <Typography variant="body1" paragraph>
                    This analysis examines gender participation at the district level, focusing on team members, planning meeting attendees, and trainers.
                  </Typography>
                  
                  <Chart
                    options={generateDistrictLevelChart().options}
                    series={generateDistrictLevelChart().series}
                    type="bar"
                    height={400}
                  />
                  
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" gutterBottom>Analysis Insights</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          District Team Gender Balance
                        </Typography>
                        <Typography variant="body2" paragraph>
                          At the district level, there is a {Math.abs(analyticsData.genderAnalysis.districtLevelGaps.teamMembers.gapPercentage)}% 
                          gap in team member participation, with {analyticsData.genderAnalysis.districtLevelGaps.teamMembers.gap > 0 ?
                            'more female participants' : 'more male participants'}.
                        </Typography>
                        <Typography variant="body2" paragraph>
                          The largest gender gap at the district level is in {
                            Math.abs(analyticsData.genderAnalysis.districtLevelGaps.teamMembers.gapPercentage) >
                            Math.abs(analyticsData.genderAnalysis.districtLevelGaps.planningAttendees.gapPercentage) &&
                            Math.abs(analyticsData.genderAnalysis.districtLevelGaps.teamMembers.gapPercentage) >
                            Math.abs(analyticsData.genderAnalysis.districtLevelGaps.trainers.gapPercentage) ?
                            'team member composition' :
                            Math.abs(analyticsData.genderAnalysis.districtLevelGaps.planningAttendees.gapPercentage) >
                            Math.abs(analyticsData.genderAnalysis.districtLevelGaps.teamMembers.gapPercentage) &&
                            Math.abs(analyticsData.genderAnalysis.districtLevelGaps.planningAttendees.gapPercentage) >
                            Math.abs(analyticsData.genderAnalysis.districtLevelGaps.trainers.gapPercentage) ?
                            'planning meeting attendance' : 'trainer composition'
                          }.
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                          District vs. School Level Comparison
                        </Typography>
                        <Typography variant="body2" paragraph>
                          {Math.abs(analyticsData.genderAnalysis.districtLevelGaps.teamMembers.gapPercentage) >
                           Math.abs(analyticsData.genderAnalysis.enrollmentGap.totalEnrollment.gapPercentage) ?
                            `The gender gap is more pronounced at the district level (${Math.abs(analyticsData.genderAnalysis.districtLevelGaps.teamMembers.gapPercentage)}%) 
                             than at the school enrollment level (${Math.abs(analyticsData.genderAnalysis.enrollmentGap.totalEnrollment.gapPercentage)}%).` :
                            `The gender gap is less pronounced at the district level (${Math.abs(analyticsData.genderAnalysis.districtLevelGaps.teamMembers.gapPercentage)}%) 
                             than at the school enrollment level (${Math.abs(analyticsData.genderAnalysis.enrollmentGap.totalEnrollment.gapPercentage)}%).`
                          }
                        </Typography>
                        <Typography variant="body2" paragraph>
                          District planning meetings have a gender ratio of {calculateGenderRatio(
                            analyticsData.outputIndicators.districtLevel.planningAttendees.male,
                            analyticsData.outputIndicators.districtLevel.planningAttendees.female
                          )}% female participation, compared to {calculateGenderRatio(
                            analyticsData.outputIndicators.schoolLevel.teacherChampions.male,
                            analyticsData.outputIndicators.schoolLevel.teacherChampions.female
                          )}% female participation among Teacher Champions at the school level.
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Paper>
              </TabPanel>
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6">
                No analytics data available. Please select an active itinerary or check for errors.
              </Typography>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
}