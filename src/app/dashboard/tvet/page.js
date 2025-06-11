'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Alert, 
  Card, 
  CardContent, 
  Stack, 
  Chip, 
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Breadcrumbs,
  Link,
  Skeleton
} from '@mui/material';
import { 
  School, 
  Work, 
  TrendingUp, 
  TrendingDown, 
  TrendingFlat, 
  Download, 
  Engineering,
  Groups,
  Assessment,
  Business,
  Verified,
  Build,
  People,
  Person,
  Female
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import Avatar from '@mui/material/Avatar';
import progressBar from '@/utils/nprogress';

const fetchTvetData = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/tvet-dashboard?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch TVET data');
  }

  const { data, summary, trends, availablePeriods, availableLevels, availableRegions } = result;

  // Process the data to fit the frontend structure
  const processedData = {
    summary: {},
    programs: [],
    infrastructure: [],
    performance: [],
    partnerships: [],
    trends: [],
    availablePeriods: availablePeriods || [],
    availableLevels: availableLevels || [],
    availableRegions: availableRegions || [],
  };

  if (data && data.length > 0) {
    // Aggregate indicators across all records
    const totalRecords = data.length;
    
    // Summary statistics
    processedData.summary = {
      totalInstitutions: summary.total_institutions,
      averageEnrollment: summary.average_enrollment,
      completionRate: summary.completion_rate_avg,
      employmentRate: summary.employment_rate_avg,
      accreditedPercentage: summary.accredited_percentage
    };

    // Process programs data
    const programCounts = {};
    data.forEach(record => {
      if (record.indicators.programs_offered && Array.isArray(record.indicators.programs_offered)) {
        record.indicators.programs_offered.forEach(program => {
          programCounts[program] = (programCounts[program] || 0) + 1;
        });
      }
    });

    processedData.programs = Object.entries(programCounts).map(([program, count]) => ({
      name: program,
      count,
      percentage: ((count / totalRecords) * 100).toFixed(1)
    }));

    // Process infrastructure data - only use what's available in the database
    // We'll check if schools have teachers with capacity as an infrastructure indicator
    processedData.infrastructure = [];
    
    // Check if teachers_with_capacity data exists
    const teachersWithCapacityData = data.filter(d => d.indicators.teachers_with_capacity !== null);
    if (teachersWithCapacityData.length > 0) {
      const teachersWithCapacity = teachersWithCapacityData.filter(d => 
        d.indicators.teachers_with_capacity === 'yes' || 
        d.indicators.teachers_with_capacity === 'most' || 
        d.indicators.teachers_with_capacity === 'some'
      ).length;
      
      processedData.infrastructure.push({
        name: 'Teachers with Capacity',
        available: teachersWithCapacity,
        notAvailable: teachersWithCapacityData.length - teachersWithCapacity,
        percentage: ((teachersWithCapacity / teachersWithCapacityData.length) * 100).toFixed(1)
      });
    }
    
    // Check if student services data exists
    const studentServicesData = data.filter(d => d.indicators.student_services_offered !== null);
    if (studentServicesData.length > 0) {
      const withStudentServices = studentServicesData.filter(d => 
        d.indicators.student_services_offered === 'yes'
      ).length;
      
      processedData.infrastructure.push({
        name: 'Student Services',
        available: withStudentServices,
        notAvailable: studentServicesData.length - withStudentServices,
        percentage: ((withStudentServices / studentServicesData.length) * 100).toFixed(1)
      });
    }

    // Process performance data - only use actual data from the database
    processedData.performance = [];
    
    // Calculate total enrollment
    const totalEnrollment = summary.total_boys_enrolled + summary.total_girls_enrolled;
    if (totalEnrollment > 0) {
      processedData.performance.push({
        metric: 'Total Enrollment',
        value: totalEnrollment,
        icon: <Groups />,
        color: 'primary',
        isAbsolute: true
      });
    }
    
    // Calculate gender ratio
    if (summary.total_boys_enrolled > 0 || summary.total_girls_enrolled > 0) {
      const girlsPercentage = summary.total_girls_enrolled > 0 ? 
        ((summary.total_girls_enrolled / totalEnrollment) * 100).toFixed(1) : 0;
      
      processedData.performance.push({
        metric: 'Girls Enrollment',
        value: girlsPercentage,
        icon: <Assessment />,
        color: 'secondary'
      });
    }
    
    // Add partnership percentage if available
    if (summary.schools_with_partnerships_percentage) {
      processedData.performance.push({
        metric: 'Schools with Partnerships',
        value: summary.schools_with_partnerships_percentage,
        icon: <Business />,
        color: 'success'
      });
    }

    // Process partnerships data - only use actual data from the database
    processedData.partnerships = [];
    
    // Check for schools with partnerships data
    const schoolsWithPartnershipsData = data.filter(d => d.indicators.schools_with_partnerships !== null);
    if (schoolsWithPartnershipsData.length > 0) {
      // Count schools with active placement partnerships
      const activePartnerships = schoolsWithPartnershipsData.filter(d => 
        d.indicators.schools_with_partnerships === 'yes_with_active_placement'
      ).length;
      
      if (activePartnerships > 0) {
        processedData.partnerships.push({
          name: 'Active Placement Partnerships',
          count: activePartnerships,
          percentage: ((activePartnerships / schoolsWithPartnershipsData.length) * 100).toFixed(1)
        });
      }
      
      // Count schools with partnerships but no active placement
      const nonActivePlacements = schoolsWithPartnershipsData.filter(d => 
        d.indicators.schools_with_partnerships === 'yes_without_active_placement'
      ).length;
      
      if (nonActivePlacements > 0) {
        processedData.partnerships.push({
          name: 'Partnerships without Placement',
          count: nonActivePlacements,
          percentage: ((nonActivePlacements / schoolsWithPartnershipsData.length) * 100).toFixed(1)
        });
      }
      
      // Count schools with no partnerships
      const noPartnerships = schoolsWithPartnershipsData.filter(d => 
        d.indicators.schools_with_partnerships === 'no'
      ).length;
      
      if (noPartnerships > 0) {
        processedData.partnerships.push({
          name: 'No Industry Partnerships',
          count: noPartnerships,
          percentage: ((noPartnerships / schoolsWithPartnershipsData.length) * 100).toFixed(1)
        });
      }
    }

    // Process trends from API using actual data
    if (trends && trends.enrollment_trend && trends.teacher_strength_trend && trends.partnerships_trend && trends.period_labels) {
      processedData.trends = trends.period_labels.map((period, index) => ({
        name: period,
        enrollment: parseInt(trends.enrollment_trend[index]) || 0,
        teachers: parseInt(trends.teacher_strength_trend[index]) || 0,
        partnerships: parseFloat(trends.partnerships_trend[index]) || 0
      }));
    } else {
      processedData.trends = [];
    }
  }

  return processedData;
};

// Function to fetch hierarchical entities (districts, circuits, schools)
const fetchHierarchyEntities = async (level, parentId) => {
  try {
    // Only include parentId in params if it's provided and not for national level
    const params = new URLSearchParams({ level });
    if (parentId && level !== 'national') {
      params.append('parentId', parentId);
    }
    
    const response = await fetch(`/api/tvet-dashboard/hierarchy?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch hierarchy data');
    }

    return result.entities || [];
  } catch (err) {
    console.error(`Error fetching ${level}:`, err);
    return [];
  }
};

const TrendIndicator = ({ value }) => {
  if (value > 0) return <TrendingUp color="success" fontSize="small" />;
  if (value < 0) return <TrendingDown color="error" fontSize="small" />;
  return <TrendingFlat color="action" fontSize="small" />;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function TvetDashboard() {
  const [tvetData, setTvetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Period filter state
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  
  // Drill-down state
  const [selectedLevel, setSelectedLevel] = useState('national');
  const [selectedLevelId, setSelectedLevelId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ level: 'national', name: 'National', id: null }]);
  
  // Available entities for drill-down
  const [availableRegions, setAvailableRegions] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableCircuits, setAvailableCircuits] = useState([]);
  const [availableSchools, setAvailableSchools] = useState([]);
  
  // Available periods for filtering
  const [availablePeriods, setAvailablePeriods] = useState([]);
  
  // Years for period selector
  const [availableYears, setAvailableYears] = useState([
    '2023', '2024', '2025'
  ]);
  
  // Terms for period selector
  const [availableTerms, setAvailableTerms] = useState([
    'Term 1', 'Term 2', 'Term 3'
  ]);
  
  // Weeks for period selector
  const [availableWeeks, setAvailableWeeks] = useState([
    'Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 
    'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10'
  ]);

  useEffect(() => {
    // Use the setup method from the progressBar utility
    progressBar.setup();
    
    // No need to add custom styles here as they're already in the utility
    
    loadData();
    
  }, []);
  
  // Handle period filter submission
  const handlePeriodSubmit = () => {
    progressBar.start();
    loadData({
      year: selectedYear,
      term: selectedTerm,
      week: selectedWeek,
      level: selectedLevel,
      levelId: selectedLevelId
    });
  };
  
  // Handle level change for drill-down
  const handleLevelChange = async (level, levelId, levelName) => {
    setSelectedLevel(level);
    setSelectedLevelId(levelId);
    
    // Update breadcrumbs
    const newBreadcrumbs = [...breadcrumbs];
    // Find the index of the current level in breadcrumbs
    const index = newBreadcrumbs.findIndex(b => b.level === level);
    
    if (index !== -1) {
      // If level exists in breadcrumbs, truncate array to this level
      newBreadcrumbs.splice(index + 1);
      // Update the ID of the current level
      newBreadcrumbs[index].id = levelId;
    } else {
      // Add new level to breadcrumbs
      newBreadcrumbs.push({ level, name: levelName, id: levelId });
    }
    
    setBreadcrumbs(newBreadcrumbs);
    
    // Load data for the selected level
    progressBar.start();
    loadData({ level, levelId });
  };

  // Navigate to a specific breadcrumb
  const navigateToBreadcrumb = (index) => {
    const breadcrumb = breadcrumbs[index];
    // Truncate breadcrumbs to this level
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    
    // Load data for this level
    setSelectedLevel(breadcrumb.level);
    setSelectedLevelId(breadcrumb.id);
    progressBar.start();
    loadData({ level: breadcrumb.level, levelId: breadcrumb.id });
  };

  // Load data with filters
  const loadData = async (filters = {}) => {
    try {
      setLoading(true);
      progressBar.start();
      
      const finalFilters = {
        year: filters.year || selectedYear,
        term: filters.term || selectedTerm,
        week: filters.week || selectedWeek,
        level: filters.level || selectedLevel,
        levelId: filters.levelId || selectedLevelId
      };
      
      const data = await fetchTvetData(finalFilters);
      setTvetData(data);
      
      // Store available periods
      if (data.availablePeriods && data.availablePeriods.length > 0) {
        setAvailablePeriods(data.availablePeriods);
      }
      
      // Store available regions for initial drill-down
      if (data.availableRegions && data.availableRegions.length > 0) {
        setAvailableRegions(data.availableRegions);
      }
      
      // Fetch entities for the current level if needed
      if (selectedLevel === 'region' && selectedLevelId) {
        const districts = await fetchHierarchyEntities('district', selectedLevelId);
        setAvailableDistricts(districts);
      } else if (selectedLevel === 'district' && selectedLevelId) {
        const circuits = await fetchHierarchyEntities('circuit', selectedLevelId);
        setAvailableCircuits(circuits);
      } else if (selectedLevel === 'circuit' && selectedLevelId) {
        const schools = await fetchHierarchyEntities('school', selectedLevelId);
        setAvailableSchools(schools);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      progressBar.done();
    }
  };

  const handleExport = () => {
    alert('Export functionality will be implemented here!');
  };

  // Skeleton loading components
  const SkeletonSummaryCard = () => (
    <Card elevation={2} sx={{ height: '100%' }}>
      <CardContent>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="40%" height={24} sx={{ mt: 1 }} />
        <Skeleton variant="text" width="80%" height={24} sx={{ mt: 1 }} />
      </CardContent>
    </Card>
  );
  
  const SkeletonChart = () => (
    <Box sx={{ width: '100%', height: 300, p: 2 }}>
      <Skeleton variant="rectangular" width="100%" height="100%" />
    </Box>
  );
  
  const SkeletonTable = () => (
    <Box sx={{ width: '100%', p: 2 }}>
      <Skeleton variant="text" width="100%" height={40} />
      <Skeleton variant="text" width="100%" height={40} />
      <Skeleton variant="text" width="100%" height={40} />
      <Skeleton variant="text" width="100%" height={40} />
      <Skeleton variant="text" width="100%" height={40} />
    </Box>
  );

  if (loading) return (
    <Box sx={{ p: 3 }}>
      {/* Period Selector */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Period Selection</Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="">All Years</MenuItem>
                {availableYears.map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Term</InputLabel>
              <Select
                value={selectedTerm}
                label="Term"
                onChange={(e) => setSelectedTerm(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="">All Terms</MenuItem>
                {availableTerms.map(term => (
                  <MenuItem key={term} value={term}>{term}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Week</InputLabel>
              <Select
                value={selectedWeek}
                label="Week"
                onChange={(e) => setSelectedWeek(e.target.value)}
                disabled={loading}
              >
                <MenuItem value="">All Weeks</MenuItem>
                {availableWeeks.map(week => (
                  <MenuItem key={week} value={week}>{week}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12 }} sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handlePeriodSubmit}
              disabled={loading}
            >
              Load Data
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Skeleton loading state */}
      <Grid container spacing={3}>
        {/* Summary Cards */}
        {[1, 2, 3, 4].map(i => (
          <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
            <SkeletonSummaryCard />
          </Grid>
        ))}
        
        {/* Charts */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />
            <SkeletonChart />
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Skeleton variant="text" width="70%" height={32} sx={{ mb: 2 }} />
            <SkeletonChart />
          </Paper>
        </Grid>
        
        {/* Tables */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
            <SkeletonTable />
          </Paper>
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper sx={{ p: 2 }}>
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
            <SkeletonTable />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  if (error) return (
    <Alert severity="error" sx={{ m: 2 }}>Error loading TVET data: {error}</Alert>
  );

  if (!tvetData) return (
    <Alert severity="info" sx={{ m: 2 }}>No TVET data available.</Alert>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>TVET Dashboard</Typography>
        <IconButton color="primary" onClick={handleExport}>
          <Download /> Export Report
        </IconButton>
      </Stack>

      {/* Period Selection */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filter by Period</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{xs:12, sm:3}}>
            <FormControl fullWidth size="small">
              <InputLabel>Year</InputLabel>
              <Select
                value={selectedYear}
                label="Year"
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <MenuItem value="">All Years</MenuItem>
                {[...new Set(availablePeriods?.map(p => p.year) || [])].map(year => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:12, sm:3}}>
            <FormControl fullWidth size="small">
              <InputLabel>Term</InputLabel>
              <Select
                value={selectedTerm}
                label="Term"
                onChange={(e) => setSelectedTerm(e.target.value)}
              >
                <MenuItem value="">All Terms</MenuItem>
                {[...new Set(availablePeriods?.map(p => p.term) || [])].map(term => (
                  <MenuItem key={term} value={term}>{term}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:12, sm:3}}>
            <FormControl fullWidth size="small">
              <InputLabel>Week</InputLabel>
              <Select
                value={selectedWeek}
                label="Week"
                onChange={(e) => setSelectedWeek(e.target.value)}
              >
                <MenuItem value="">All Weeks</MenuItem>
                {[...new Set(availablePeriods?.map(p => p.week) || [])].map(week => (
                  <MenuItem key={week} value={week}>{week}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{xs:12, sm:3}}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handlePeriodSubmit}
              fullWidth
            >
              Apply Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Drill-down Navigation */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Drill Down</Typography>
        <Box mb={2}>
          <Breadcrumbs aria-label="breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <Link
                key={crumb.level}
                color={index === breadcrumbs.length - 1 ? "text.primary" : "inherit"}
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToBreadcrumb(index);
                }}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {crumb.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Box>
        
        {/* Show appropriate entities based on current level */}
        {selectedLevel === 'national' && (
          <Grid container spacing={2}>
            <Grid size={{xs:12}}>
              <Typography variant="subtitle1">Regions</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {availableRegions.map(region => (
                  <Chip 
                    key={region.id}
                    label={region.name}
                    onClick={() => handleLevelChange('region', region.id, region.name)}
                    clickable
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
        
        {selectedLevel === 'region' && (
          <Grid container spacing={2}>
            <Grid size={{xs:12}}>
              <Typography variant="subtitle1">Districts</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {availableDistricts.map(district => (
                  <Chip 
                    key={district.id}
                    label={district.name}
                    onClick={() => handleLevelChange('district', district.id, district.name)}
                    clickable
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
        
        {selectedLevel === 'district' && (
          <Grid container spacing={2}>
            <Grid size={{xs:12}}>
              <Typography variant="subtitle1">Circuits</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {availableCircuits.map(circuit => (
                  <Chip 
                    key={circuit.id}
                    label={circuit.name}
                    onClick={() => handleLevelChange('circuit', circuit.id, circuit.name)}
                    clickable
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
        
        {selectedLevel === 'circuit' && (
          <Grid container spacing={2}>
            <Grid size={{xs:12}}>
              <Typography variant="subtitle1">Schools</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {availableSchools.map(school => (
                  <Chip 
                    key={school.id}
                    label={school.name}
                    onClick={() => handleLevelChange('school', school.id, school.name)}
                    clickable
                  />
                ))}
              </Box>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Summary Cards */}
      <Typography variant="h5" gutterBottom>Overview</Typography>
      <Grid container spacing={3} mb={4}>
        <Grid size={{xs:12, sm:6, md:3}}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <School />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">TVET Schools</Typography>
                  <Typography variant="h6">{tvetData.summary.total_schools || 0}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12, sm:6, md:3}}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Total Enrollment</Typography>
                  <Typography variant="h6">{tvetData.summary.total_enrollment || 0}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12, sm:6, md:3}}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <Person />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Boys Enrolled</Typography>
                  <Typography variant="h6">{tvetData.summary.boys_enrolled || 0}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12, sm:6, md:3}}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <Female />
                </Avatar>
                <Box>
                  <Typography variant="body2" color="text.secondary">Girls Enrolled</Typography>
                  <Typography variant="h6">{tvetData.summary.girls_enrolled || 0}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Programs Offered */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Programs Offered</Typography>
      <Grid container spacing={3} mb={4}>
        {tvetData.programs.slice(0, 8).map((program, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Engineering color="primary" />
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {program.name}
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Chip label={`${program.count} institutions`} color="primary" size="small" />
                  <Chip label={`${program.percentage}% coverage`} color="info" size="small" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Infrastructure Status */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Infrastructure Status</Typography>
      <Grid container spacing={3} mb={4}>
        {tvetData.infrastructure.map((infra, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Build color="secondary" />
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {infra.name}
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Chip label={`Available: ${infra.available}`} color="success" size="small" />
                  <Chip label={`Not Available: ${infra.notAvailable}`} color="error" size="small" />
                  <Chip label={`${infra.percentage}% availability`} color="info" size="small" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Performance Metrics */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Performance Metrics</Typography>
      <Grid container spacing={3} mb={4}>
        {tvetData.performance.map((perf, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  {perf.icon}
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {perf.metric}
                  </Typography>
                </Stack>
                <Typography variant="h4" color={`${perf.color}.main`}>
                  {perf.value}{!perf.isAbsolute && '%'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Industry Partnerships */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Industry Partnerships</Typography>
      <Grid container spacing={3} mb={4}>
        {tvetData.partnerships.map((partnership, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Business color="warning" />
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {partnership.name}
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Chip label={`${partnership.count} institutions`} color="warning" size="small" />
                  <Chip label={`${partnership.percentage}% participation`} color="info" size="small" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Trends */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Key Trends</Typography>
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={tvetData.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Line type="monotone" dataKey="enrollment" stroke="#8884d8" name="Enrollment" />
            <Line type="monotone" dataKey="teachers" stroke="#82ca9d" name="Teacher Strength" />
            <Line type="monotone" dataKey="partnerships" stroke="#ffc658" name="Partnerships %" />
          </LineChart>
        </ResponsiveContainer>
        <Typography variant="caption" display="block" sx={{ mt: 2 }}>
          Note: Trend data shows progress over the last 5 periods. Enrollment and teacher strength are in absolute values, while partnerships are shown as percentages.
        </Typography>
      </Paper>

      {/* Drill-down */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Drill-down Capabilities</Typography>
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1">
          Click on summary cards or trend data points to drill down to specific institutions, circuits, districts, or regions. 
          This functionality will be fully implemented once the backend APIs are ready for detailed data exploration.
        </Typography>
      </Paper>
    </Box>
  );
}
