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
  LinearProgress,
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
  PregnantWoman, 
  TrendingUp, 
  TrendingDown, 
  TrendingFlat, 
  Download, 
  PersonAdd,
  Groups,
  AssignmentReturn,
  SupportAgent,
  FollowTheSigns,
  ChildCare
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,
  minimum: 0.1,
  easing: 'ease',
  speed: 500
});

const fetchReentryData = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/reentry-dashboard?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch reentry data');
  }

  const { data, summary, trends, availablePeriods, availableLevels } = result;

  // Process the data to fit the frontend structure
  const processedData = {
    summary: {},
    pregnancyStatus: [],
    reentryStatus: [],
    supportServices: [],
    trends: [],
  };

  if (data && data.length > 0) {
    // Summary statistics
    processedData.summary = {
      totalSchools: summary.total_schools,
      totalPregnantAttending: summary.total_pregnant_attending,
      totalPregnantNotAttending: summary.total_pregnant_not_attending,
      totalDroppedOutReturned: summary.total_dropped_out_returned,
      totalPregnantReturned: summary.total_pregnant_returned,
      reentryRate: summary.reentry_rate
    };

    // Process pregnancy status data
    processedData.pregnancyStatus = [
      {
        name: 'Pregnant Girls Attending School',
        value: summary.total_pregnant_attending,
        color: '#4CAF50',
        icon: <PregnantWoman />
      },
      {
        name: 'Pregnant Girls Not Attending School',
        value: summary.total_pregnant_not_attending,
        color: '#FF9800',
        icon: <School />
      }
    ];

    // Process reentry status data
    processedData.reentryStatus = [
      {
        name: 'Dropped Out but Returned',
        value: summary.total_dropped_out_returned,
        color: '#2196F3',
        icon: <AssignmentReturn />
      },
      {
        name: 'Pregnant Returned After Birth',
        value: summary.total_pregnant_returned,
        color: '#9C27B0',
        icon: <ChildCare />
      }
    ];

    // Process support services data
    // Safely check for support_activities and followup_activities with null checks
    const supportActivities = data.filter(d => {
      return d.indicators && d.indicators.support_activities && 
             typeof d.indicators.support_activities === 'string' && 
             d.indicators.support_activities.trim() !== '';
    }).length;
    
    const followupActivities = data.filter(d => {
      return d.indicators && d.indicators.followup_activities && 
             typeof d.indicators.followup_activities === 'string' && 
             d.indicators.followup_activities.trim() !== '';
    }).length;
    
    // Calculate percentages safely
    const totalSchools = data.length || 1; // Avoid division by zero
    const supportPercentage = ((supportActivities / totalSchools) * 100).toFixed(1);
    const followupPercentage = ((followupActivities / totalSchools) * 100).toFixed(1);
    
    processedData.supportServices = [
      {
        name: 'Schools with Support Activities',
        count: supportActivities,
        percentage: supportPercentage,
        icon: <SupportAgent />
      },
      {
        name: 'Schools with Follow-up Activities',
        count: followupActivities,
        percentage: followupPercentage,
        icon: <FollowTheSigns />
      }
    ];

    // Process trends from API with proper null checks
    if (trends && 
        trends.pregnant_attending_trend && 
        trends.reentry_trend && 
        trends.support_activities_trend &&
        trends.period_labels) {
      
      // Use the period labels from the API
      processedData.trends = trends.period_labels.map((period, i) => ({
        name: period,
        attending: trends.pregnant_attending_trend[i] !== undefined ? 
          parseInt(trends.pregnant_attending_trend[i]) || 0 : 0,
        reentry: trends.reentry_trend[i] !== undefined ? 
          parseInt(trends.reentry_trend[i]) || 0 : 0,
        support: trends.support_activities_trend[i] !== undefined ? 
          parseInt(trends.support_activities_trend[i]) || 0 : 0,
        followup: trends.followup_activities_trend[i] !== undefined ? 
          parseInt(trends.followup_activities_trend[i]) || 0 : 0
      }));
    } else {
      processedData.trends = [];
    }
  }

  // Include availablePeriods and availableLevels in the returned data
  return {
    ...processedData,
    availablePeriods,
    availableLevels
  };
};

const TrendIndicator = ({ value }) => {
  if (value > 0) return <TrendingUp color="success" fontSize="small" />;
  if (value < 0) return <TrendingDown color="error" fontSize="small" />;
  return <TrendingFlat color="action" fontSize="small" />;
};

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#F44336'];

export default function ReentryDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reentryData, setReentryData] = useState(null);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [availableLevels, setAvailableLevels] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('national');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [availableRegions, setAvailableRegions] = useState([]);
  const [availableDistricts, setAvailableDistricts] = useState([]);
  const [availableCircuits, setAvailableCircuits] = useState([]);
  const [availableSchools, setAvailableSchools] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([{ level: 'national', name: 'National', id: '' }]);

  // Function to fetch available entities for drill-down
  const fetchAvailableEntities = async (level, parentId) => {
    try {
      const response = await fetch(`/api/hierarchy/${level}?parentId=${parentId || ''}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      return result.data || [];
    } catch (err) {
      console.error(`Error fetching ${level}:`, err);
      return [];
    }
  };

  // Handle level change for drill-down
  const handleLevelChange = async (level, levelId, levelName) => {
    setSelectedLevel(level);
    setSelectedLevelId(levelId);
    NProgress.start();
    
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
    loadData({ level, levelId });
  };

  // Navigate to a specific breadcrumb
  const navigateToBreadcrumb = (index) => {
    const breadcrumb = breadcrumbs[index];
    NProgress.start();
    
    // Truncate breadcrumbs to this level
    const newBreadcrumbs = breadcrumbs.slice(0, index + 1);
    setBreadcrumbs(newBreadcrumbs);
    
    // Load data for this level
    setSelectedLevel(breadcrumb.level);
    setSelectedLevelId(breadcrumb.id);
    loadData({ level: breadcrumb.level, levelId: breadcrumb.id });
  };

  // Load data with filters
  const loadData = async (filters = {}) => {
    try {
      setLoading(true);
      NProgress.start();
      const finalFilters = {
        ...filters,
        year: selectedYear || undefined,
        term: selectedTerm || undefined,
        week: selectedWeek || undefined
      };
      
      const result = await fetchReentryData(finalFilters);
      setReentryData(result);
      
      // Store available periods and levels
      if (result.availablePeriods) {
        setAvailablePeriods(result.availablePeriods);
      }
      
      if (result.availableLevels) {
        setAvailableLevels(result.availableLevels);
      }
      
      // Load available entities for drill-down based on current level
      if (selectedLevel === 'national') {
        const regions = await fetchAvailableEntities('region');
        setAvailableRegions(regions);
      } else if (selectedLevel === 'region' && selectedLevelId) {
        const districts = await fetchAvailableEntities('district', selectedLevelId);
        setAvailableDistricts(districts);
      } else if (selectedLevel === 'district' && selectedLevelId) {
        const circuits = await fetchAvailableEntities('circuit', selectedLevelId);
        setAvailableCircuits(circuits);
      } else if (selectedLevel === 'circuit' && selectedLevelId) {
        const schools = await fetchAvailableEntities('school', selectedLevelId);
        setAvailableSchools(schools);
      }
      
    } catch (err) {
      console.error('Error loading pregnancy & re-entry data:', err);
      setError(`Error loading pregnancy & re-entry data: ${err.message}`);
    } finally {
      setLoading(false);
      NProgress.done();
    }
  };

  // Handle period selection
  const handlePeriodSubmit = () => {
    loadData({
      level: selectedLevel,
      levelId: selectedLevelId
    });
  };

  useEffect(() => {
    // Initial data load
    loadData();
  }, []);

  const handleExport = () => {
    alert('Export functionality will be implemented here!');
  };

  if (loading) return (
    <Box sx={{ p: 3 }}>
      {/* Header Skeleton */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Skeleton variant="text" width={350} height={40} />
        <Skeleton variant="circular" width={40} height={40} />
      </Stack>

      {/* Period Selection Skeleton */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Skeleton variant="text" width={200} height={30} sx={{ mb: 2 }} />
        <Grid container spacing={2} alignItems="center">
          <Grid size={{xs:12, sm:3}}>
            <Skeleton variant="rectangular" width="100%" height={40} />
          </Grid>
          <Grid size={{xs:12, sm:3}}>
            <Skeleton variant="rectangular" width="100%" height={40} />
          </Grid>
          <Grid size={{xs:12, sm:3}}>
            <Skeleton variant="rectangular" width="100%" height={40} />
          </Grid>
          <Grid size={{xs:12, sm:3}}>
            <Skeleton variant="rectangular" width="100%" height={40} />
          </Grid>
        </Grid>
      </Paper>

      {/* Breadcrumbs Skeleton */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Skeleton variant="text" width="60%" height={24} />
      </Paper>

      {/* Summary Stats Skeleton */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Array(4).fill(0).map((_, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Skeleton variant="text" width="70%" height={24} />
                  <Skeleton variant="text" width="40%" height={30} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Charts Skeleton */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="50%" height={30} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={300} />
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Skeleton variant="text" width="50%" height={30} sx={{ mb: 2 }} />
              <Skeleton variant="rectangular" width="100%" height={300} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Support Services Skeleton */}
      <Skeleton variant="text" width={250} height={30} sx={{ mt: 4, mb: 2 }} />
      <Grid container spacing={3}>
        {Array(2).fill(0).map((_, index) => (
          <Grid size={{ xs: 12, md: 6 }} key={index}>
            <Card>
              <CardContent>
                <Stack spacing={1}>
                  <Skeleton variant="text" width="80%" height={24} />
                  <Skeleton variant="rectangular" width="100%" height={100} />
                  <Skeleton variant="text" width="40%" height={24} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Trends Skeleton */}
      <Skeleton variant="text" width={250} height={30} sx={{ mt: 4, mb: 2 }} />
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={350} />
      </Paper>
    </Box>
  );

  if (error) return (
    <Alert severity="error" sx={{ m: 2 }}>Error loading pregnancy & re-entry data: {error}</Alert>
  );

  if (!reentryData) return (
    <Alert severity="info" sx={{ m: 2 }}>No pregnancy & re-entry data available.</Alert>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>Pregnancy & Re-entry Dashboard</Typography>
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
            <Grid  size={{xs:12}}>
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
        <Grid size={{xs:12, sm:6, md:2}}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <School color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{reentryData.summary.totalSchools}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Schools</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12, sm:6, md:2}}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PregnantWoman color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{reentryData.summary.totalPregnantAttending}</Typography>
                  <Typography variant="body2" color="text.secondary">Pregnant Attending</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12, sm:6, md:2}}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PersonAdd color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{reentryData.summary.totalPregnantNotAttending}</Typography>
                  <Typography variant="body2" color="text.secondary">Not Attending</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12, sm:6, md:2}}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <AssignmentReturn color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{reentryData.summary.totalDroppedOutReturned}</Typography>
                  <Typography variant="body2" color="text.secondary">Returned to School</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12, sm:6, md:2}}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <ChildCare color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{reentryData.summary.totalPregnantReturned}</Typography>
                  <Typography variant="body2" color="text.secondary">Returned After Birth</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{xs:12, sm:6, md:2}}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{reentryData.summary.reentryRate}%</Typography>
                  <Typography variant="body2" color="text.secondary">Re-entry Rate</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pregnancy Status */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Pregnancy Status</Typography>
      <Grid container spacing={3} mb={4}>
        {reentryData.pregnancyStatus.map((status, index) => (
          <Grid size={{xs:12, sm:6, md:6}} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  {status.icon}
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {status.name}
                  </Typography>
                </Stack>
                <Typography variant="h3" sx={{ color: status.color, mb: 1 }}>
                  {status.value}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(status.value / (reentryData.summary.totalPregnantAttending + reentryData.summary.totalPregnantNotAttending)) * 100} 
                  sx={{ height: 8, borderRadius: 4, backgroundColor: '#f0f0f0' }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Re-entry Status */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Re-entry Status</Typography>
      <Grid container spacing={3} mb={4}>
        {reentryData.reentryStatus.map((status, index) => (
          <Grid size={{xs:12, sm:6, md:2}} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  {status.icon}
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {status.name}
                  </Typography>
                </Stack>
                <Typography variant="h3" sx={{ color: status.color, mb: 1 }}>
                  {status.value}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(status.value / (reentryData.summary.totalDroppedOutReturned + reentryData.summary.totalPregnantReturned)) * 100} 
                  sx={{ height: 8, borderRadius: 4, backgroundColor: '#f0f0f0' }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Support Services */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Support Services</Typography>
      <Grid container spacing={3} mb={4}>
        {reentryData.supportServices.map((service, index) => (
          <Grid size={{xs:12, sm:6, md:6}} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  {service.icon}
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {service.name}
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Chip label={`${service.count} schools`} color="primary" size="small" />
                  <Chip label={`${service.percentage}% coverage`} color="info" size="small" />
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
          <LineChart data={reentryData.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Line type="monotone" dataKey="attending" stroke="#4CAF50" name="Pregnant Attending" />
            <Line type="monotone" dataKey="reentry" stroke="#2196F3" name="Re-entry Rate %" />
            <Line type="monotone" dataKey="support" stroke="#FF9800" name="Support Activities %" />
            <Line type="monotone" dataKey="followup" stroke="#9C27B0" name="Follow-up Activities %" />
          </LineChart>
        </ResponsiveContainer>
        <Typography variant="caption" display="block" sx={{ mt: 2 }}>
          Note: Trend data shows progress over the last 5 periods. Values represent counts and percentages for different indicators.
        </Typography>
      </Paper>

      {/* Drill-down */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Drill-down Capabilities</Typography>
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1">
          Click on summary cards or trend data points to drill down to specific schools, circuits, districts, or regions. 
          This functionality will be fully implemented once the backend APIs are ready for detailed data exploration.
        </Typography>
      </Paper>
    </Box>
  );
}
