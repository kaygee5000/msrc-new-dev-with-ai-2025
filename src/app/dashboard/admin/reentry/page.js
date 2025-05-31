'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Stack,
  Chip,
  Divider,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarMonth as CalendarIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  AssignmentReturn as ReturnIcon,
  BarChart as BarChartIcon,
  Visibility as VisibilityIcon,
  MoreVert as MoreVertIcon,
  FilterList as FilterListIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Chart from 'react-apexcharts';

// Mock data for initial development
const mockSummaryData = {
  pregnantInSchool: {
    count: 1234,
    change: 12,
    trend: 'up'
  },
  pregnantOutOfSchool: {
    count: 567,
    change: -5,
    trend: 'down'
  },
  reentryCount: {
    count: 789,
    change: 8,
    trend: 'up'
  },
  reentryRate: {
    value: 89,
    change: 2,
    trend: 'up'
  }
};

const mockRecentSubmissions = [
  { id: 1, school: 'Accra Girls SHS', region: 'Greater Accra', district: 'Accra Metro', submittedBy: 'John Doe', date: '2025-05-30', status: 'Complete', schoolId: 1 },
  { id: 2, school: 'Kumasi Academy', region: 'Ashanti', district: 'Kumasi Metro', submittedBy: 'Jane Smith', date: '2025-05-29', status: 'Incomplete', schoolId: 2 },
  { id: 3, school: 'Tamale SHS', region: 'Northern', district: 'Tamale Metro', submittedBy: 'Ibrahim Mahama', date: '2025-05-28', status: 'Complete', schoolId: 3 },
  { id: 4, school: 'Cape Coast Technical Institute', region: 'Central', district: 'Cape Coast', submittedBy: 'Akosua Mensah', date: '2025-05-27', status: 'Complete', schoolId: 4 },
  { id: 5, school: 'Ho Technical University', region: 'Volta', district: 'Ho Municipal', submittedBy: 'Edem Kpodo', date: '2025-05-26', status: 'Incomplete', schoolId: 5 },
];

// Chart options
const trendChartOptions = {
  chart: {
    type: 'line',
    toolbar: {
      show: true,
    },
    zoom: {
      enabled: true
    }
  },
  stroke: {
    curve: 'smooth',
    width: 3
  },
  xaxis: {
    categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12'],
  },
  colors: ['#4CAF50', '#F44336', '#2196F3'],
  legend: {
    position: 'top'
  },
  title: {
    text: 'Reentry Trends Over Time',
    align: 'left'
  }
};

const trendChartSeries = [
  {
    name: 'Pregnant In School',
    data: [800, 820, 850, 900, 950, 1000, 1050, 1100, 1150, 1200, 1220, 1234]
  },
  {
    name: 'Pregnant Out of School',
    data: [600, 590, 580, 570, 560, 550, 555, 560, 565, 570, 565, 567]
  },
  {
    name: 'Re-entries',
    data: [650, 670, 690, 700, 720, 730, 740, 750, 760, 770, 780, 789]
  }
];

const donutChartOptions = {
  chart: {
    type: 'donut',
  },
  labels: ['Primary', 'JHS', 'SHS', 'TVET'],
  colors: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'],
  title: {
    text: 'Distribution by Education Level',
    align: 'left'
  },
  legend: {
    position: 'bottom'
  },
  plotOptions: {
    pie: {
      donut: {
        size: '60%'
      }
    }
  }
};

const donutChartSeries = [30, 40, 20, 10]; // Percentages

const barChartOptions = {
  chart: {
    type: 'bar',
    toolbar: {
      show: false
    }
  },
  plotOptions: {
    bar: {
      horizontal: true,
      barHeight: '70%',
    }
  },
  dataLabels: {
    enabled: true,
    formatter: function (val) {
      return val + '%';
    },
    offsetX: 20
  },
  xaxis: {
    categories: ['Accra Metro', 'Kumasi Metro', 'Tamale Metro', 'Cape Coast', 'Ho Municipal'],
    labels: {
      formatter: function (val) {
        return val + '%';
      }
    }
  },
  colors: ['#4CAF50'],
  title: {
    text: 'Top 5 Districts by Re-entry Rate',
    align: 'left'
  }
};

const barChartSeries = [{
  name: 'Re-entry Rate',
  data: [95, 92, 88, 85, 82]
}];

export default function ReentryDashboard() {
  // State for period selection
  const [timeRange, setTimeRange] = useState({
    year: null,
    term: null,
    week: null,
    startDate: null,
    endDate: null
  });

  // State for period options
  const [periodOptions, setPeriodOptions] = useState({
    years: [],
    terms: [],
    weeks: [],
    groupedPeriods: {},
    entityCounts: {}
  });

  // State for data
  const [summaryData, setSummaryData] = useState(null);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for entity filter
  const [entityFilter, setEntityFilter] = useState({
    type: null,
    name: null
  });

  // Fetch available periods
  const fetchPeriods = async (entityType = null, entityId = null) => {
    try {
      // Build query parameters for the periods API
      const params = new URLSearchParams();
      if (entityType && entityId) {
        params.append('entityType', entityType);
        params.append('entityId', entityId);
      }
      
      const response = await fetch(`/api/reentry/periods?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Periods data:', data);
      
      // Check if the response contains the expected data structure
      if (!data) {
        console.warn('Empty periods API response');
        throw new Error('Empty periods data');
      }
      
      // Create entity counts map from periods data
      const entityCounts = {};
      if (Array.isArray(data.periods)) {
        data.periods.forEach(period => {
          if (period && period.year && period.term && period.week && period.counts) {
            const key = `${period.year}-${period.term}-${period.week}`;
            entityCounts[key] = period.counts;
          }
        });
      }
      
      setPeriodOptions({
        years: Array.isArray(data.years) ? data.years : [],
        terms: Array.isArray(data.terms) ? data.terms : [],
        weeks: [],
        groupedPeriods: data.groupedPeriods || {},
        entityCounts
      });
      
      // Set initial period to the latest one if available
      if (data.latestPeriod && data.latestPeriod.year && data.latestPeriod.term && data.latestPeriod.week) {
        setTimeRange({
          year: data.latestPeriod.year,
          term: data.latestPeriod.term,
          week: data.latestPeriod.week,
          startDate: null,
          endDate: null
        });
        
        // Update available weeks based on the latest year and term
        updateAvailableWeeks(data.latestPeriod.year, data.latestPeriod.term, data.groupedPeriods);
      } else if (data.years && data.years.length > 0 && data.terms && data.terms.length > 0) {
        // If no latest period but we have years and terms, set to first available
        setTimeRange({
          year: data.years[0],
          term: data.terms[0],
          week: null,
          startDate: null,
          endDate: null
        });
        
        // Update available weeks based on the selected year and term
        updateAvailableWeeks(data.years[0], data.terms[0], data.groupedPeriods);
      }
      
      // Update entity filter if provided in the response
      if (data.entityFilter && data.entityFilter.type && data.entityFilter.id) {
        setEntityFilter({
          type: data.entityFilter.type,
          id: data.entityFilter.id,
          name: data.entityFilter.name || 'Selected Entity'
        });
      }
    } catch (err) {
      console.error('Error fetching periods:', err);
      // Set empty options if API fails
      setPeriodOptions({
        years: [],
        terms: [],
        weeks: [],
        groupedPeriods: {},
        entityCounts: {}
      });
      
      // Reset time range
      setTimeRange({
        year: null,
        term: null,
        week: null,
        startDate: null,
        endDate: null
      });
    }
  };

  // Update available weeks based on selected year and term
  const updateAvailableWeeks = (year, term, groupedPeriods = periodOptions.groupedPeriods) => {
    if (groupedPeriods && groupedPeriods[year] && groupedPeriods[year][term]) {
      const availableWeeks = groupedPeriods[year][term].map(w => ({
        value: w.week,
        label: w.label
      }));
      
      setPeriodOptions(prev => ({
        ...prev,
        weeks: availableWeeks
      }));
      
      // If current week is not in available weeks, set to first available week
      if (availableWeeks.length > 0 && !availableWeeks.some(w => w.value === timeRange.week)) {
        setTimeRange(prev => ({
          ...prev,
          week: availableWeeks[0].value
        }));
      }
    } else {
      // If no weeks available for this year/term, set empty weeks array
      setPeriodOptions(prev => ({
        ...prev,
        weeks: []
      }));
    }
  };

  // Handle period selection changes
  const handleYearChange = (event) => {
    const newYear = event.target.value;
    
    setTimeRange(prev => ({
      ...prev,
      year: newYear
    }));
    
    // Update available terms for this year
    const availableTerms = Object.keys(periodOptions.groupedPeriods[newYear] || {}).map(Number);
    
    // If current term is not available for this year, set to first available term
    if (availableTerms.length > 0 && !availableTerms.includes(timeRange.term)) {
      const newTerm = availableTerms[0];
      setTimeRange(prev => ({
        ...prev,
        term: newTerm
      }));
      
      // Update available weeks for this year and term
      updateAvailableWeeks(newYear, newTerm);
    } else {
      // Update available weeks for this year and current term
      updateAvailableWeeks(newYear, timeRange.term);
    }
  };

  const handleTermChange = (event) => {
    const newTerm = event.target.value;
    
    setTimeRange(prev => ({
      ...prev,
      term: newTerm
    }));
    
    // Update available weeks for this year and term
    updateAvailableWeeks(timeRange.year, newTerm);
  };

  const handleWeekChange = (event) => {
    setTimeRange(prev => ({
      ...prev,
      week: event.target.value
    }));
  };

  // Fetch data from API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (timeRange.year) params.append('year', timeRange.year);
      if (timeRange.term) params.append('term', timeRange.term);
      if (timeRange.week) params.append('week', timeRange.week);
      
      // Fetch data from API
      const response = await fetch(`/api/reentry/national/summary?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);
      
      // Transform API data to match the expected format for the dashboard
      const transformedSummaryData = {
        pregnantInSchool: {
          count: data.summary?.in_school || 0,
          change: 0, // We'll calculate this if we have historical data
          trend: 'up'
        },
        pregnantOutOfSchool: {
          count: data.summary?.out_of_school || 0,
          change: 0,
          trend: 'down'
        },
        pregnantReturned: {
          count: data.summary?.returned || 0,
          change: 0,
          trend: 'up'
        },
        reentryRate: {
          rate: data.summary?.reentry_rate || 0,
          change: 0,
          trend: 'up'
        }
      };
      
      // Transform trend data for charts
      const transformedTrendData = Array.isArray(data.trends) 
        ? data.trends.map(trend => ({
            year: trend.year,
            term: trend.term,
            inSchool: trend.in_school || 0,
            outOfSchool: trend.out_of_school || 0,
            returned: trend.returned || 0,
            reentryRate: trend.reentry_rate || 0
          }))
        : [];
      
      // Calculate trend changes if we have trend data
      if (transformedTrendData.length >= 2) {
        // Sort trends by year and term in descending order
        const sortedTrends = [...transformedTrendData].sort((a, b) => {
          if (a.year !== b.year) return b.year - a.year;
          return b.term - a.term;
        });
        
        // Get current and previous period data
        const current = sortedTrends[0];
        const previous = sortedTrends[1];
        
        if (current && previous) {
          // Calculate percentage changes
          if (previous.inSchool > 0) {
            transformedSummaryData.pregnantInSchool.change = Math.round(
              ((current.inSchool - previous.inSchool) / previous.inSchool) * 100
            );
            transformedSummaryData.pregnantInSchool.trend = 
              transformedSummaryData.pregnantInSchool.change >= 0 ? 'up' : 'down';
          }
          
          if (previous.outOfSchool > 0) {
            transformedSummaryData.pregnantOutOfSchool.change = Math.round(
              ((current.outOfSchool - previous.outOfSchool) / previous.outOfSchool) * 100
            );
            // For out of school, a decrease is positive
            transformedSummaryData.pregnantOutOfSchool.trend = 
              transformedSummaryData.pregnantOutOfSchool.change <= 0 ? 'down' : 'up';
          }
          
          if (previous.returned > 0) {
            transformedSummaryData.pregnantReturned.change = Math.round(
              ((current.returned - previous.returned) / previous.returned) * 100
            );
            transformedSummaryData.pregnantReturned.trend = 
              transformedSummaryData.pregnantReturned.change >= 0 ? 'up' : 'down';
          }
          
          if (previous.reentryRate > 0) {
            transformedSummaryData.reentryRate.change = Math.round(
              current.reentryRate - previous.reentryRate
            );
            transformedSummaryData.reentryRate.trend = 
              transformedSummaryData.reentryRate.change >= 0 ? 'up' : 'down';
          }
        }
      }
      
      // Transform recent submissions
      const transformedSubmissions = Array.isArray(data.recentSubmissions)
        ? data.recentSubmissions.map(submission => ({
            id: submission.id || `${submission.school_id}-${submission.year}-${submission.term}-${submission.week}`,
            school: submission.school_name || 'Unknown School',
            schoolId: submission.school_id || 0,
            region: submission.region_name || 'Unknown Region',
            regionId: submission.region_id || 0,
            district: submission.district_name || 'Unknown District',
            districtId: submission.district_id || 0,
            circuit: submission.circuit_name || 'Unknown Circuit',
            circuitId: submission.circuit_id || 0,
            submittedBy: submission.submitted_by || 'System',
            date: submission.submission_date || new Date(),
            status: 'Complete', // Assuming all submissions in the API are complete
            inSchool: submission.in_school || 0,
            outOfSchool: submission.out_of_school || 0,
            returned: submission.returned || 0
          }))
        : [];
      
      // Update state with transformed data
      setSummaryData(transformedSummaryData);
      setTrendData(transformedTrendData);
      setRecentSubmissions(transformedSubmissions);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
      
      // Fallback to mock data in case of error
      setSummaryData(mockSummaryData);
      setRecentSubmissions(mockRecentSubmissions);
    } finally {
      setLoading(false);
    }
  };

  // Handle apply filters button click
  const handleApplyFilters = () => {
    fetchData();
  };

  // Fetch initial data on component mount
  useEffect(() => {
    // First fetch available periods
    fetchPeriods();
  }, []);

  // Fetch dashboard data when period changes or on initial load
  useEffect(() => {
    // Only fetch data if we have all period values
    if (timeRange.year && timeRange.term && timeRange.week) {
      fetchData();
    }
  }, [timeRange.year, timeRange.term, timeRange.week]);

  // Update trend chart options based on API data
  const getTrendChartOptions = () => {
    // Default options
    const options = { ...trendChartOptions };
    
    if (trendData && trendData.length > 0) {
      // Extract categories (x-axis labels) from trend data
      options.xaxis.categories = trendData.map(item => `${item.year} Term ${item.term}`);
    }
    
    return options;
  };

  // Update trend chart series based on API data
  const getTrendChartSeries = () => {
    if (!trendData || trendData.length === 0) {
      return trendChartSeries;
    }
    
    return [
      {
        name: 'In School',
        data: trendData.map(item => item.inSchool)
      },
      {
        name: 'Out of School',
        data: trendData.map(item => item.outOfSchool)
      },
      {
        name: 'Returned',
        data: trendData.map(item => item.returned)
      }
    ];
  };

  // Clear entity filter
  const clearEntityFilter = () => {
    setEntityFilter({
      type: null,
      name: null
    });
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Pregnancy Reentry Dashboard
        </Typography>
        
        {/* Period Selector */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Year</InputLabel>
                <Select
                  value={timeRange.year || ''}
                  label="Year"
                  onChange={handleYearChange}
                  disabled={loading || periodOptions.years.length === 0}
                >
                  {periodOptions.years.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Term</InputLabel>
                <Select
                  value={timeRange.term || ''}
                  label="Term"
                  onChange={handleTermChange}
                  disabled={loading || !timeRange.year}
                >
                  {Object.keys(periodOptions.groupedPeriods[timeRange.year] || {})
                    .map(term => (
                      <MenuItem key={term} value={Number(term)}>Term {term}</MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Week</InputLabel>
                <Select
                  value={timeRange.week || ''}
                  label="Week"
                  onChange={handleWeekChange}
                  disabled={loading || !timeRange.year || !timeRange.term}
                >
                  {periodOptions.weeks.map(week => {
                    // Get entity counts for this period if available
                    const periodKey = `${timeRange.year}-${timeRange.term}-${week.value}`;
                    const counts = periodOptions.entityCounts[periodKey];
                    
                    return (
                      <MenuItem key={week.value} value={week.value}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <span>{week.label}</span>
                          {counts && (
                            <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                              {entityFilter.type === 'school' ? '' : 
                               entityFilter.type === 'circuit' ? `(${counts.schools} schools)` :
                               entityFilter.type === 'district' ? `(${counts.schools} schools, ${counts.circuits} circuits)` :
                               entityFilter.type === 'region' ? `(${counts.schools} schools, ${counts.districts} districts)` :
                               `(${counts.schools} schools)`}
                            </Typography>
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={2}>
              <Button 
                variant="contained" 
                onClick={handleApplyFilters}
                disabled={loading || !timeRange.year || !timeRange.term || !timeRange.week}
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'Loading...' : 'Apply Filters'}
              </Button>
            </Grid>
          </Grid>
        </Paper>
        
        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
            <Button 
              color="inherit" 
              size="small" 
              onClick={fetchData}
              sx={{ ml: 2 }}
            >
              Retry
            </Button>
          </Alert>
        )}
        
        {/* Main Content */}
        {loading && !summaryData ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Pregnant In School */}
              <Grid size={{xs: 12, sm: 6, md: 3}} sx={{ display: 'flex' }}>
                <Card sx={{ flex: 1, borderLeft: '4px solid #4CAF50' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom variant="overline">
                          PREGNANT STUDENTS IN SCHOOL
                        </Typography>
                        <Typography variant="h4">
                          {summaryData.pregnantInSchool.count.toLocaleString()}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          {summaryData.pregnantInSchool.trend === 'up' ? (
                            <TrendingUpIcon color="success" fontSize="small" />
                          ) : (
                            <TrendingDownIcon color="error" fontSize="small" />
                          )}
                          <Typography 
                            variant="body2" 
                            color={summaryData.pregnantInSchool.change > 0 ? 'success.main' : 'error.main'}
                            sx={{ ml: 0.5 }}
                          >
                            {summaryData.pregnantInSchool.change > 0 ? '+' : ''}{summaryData.pregnantInSchool.change}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ bgcolor: 'success.light', p: 1, borderRadius: 1 }}>
                        <SchoolIcon color="success" />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Pregnant Out of School */}
              <Grid size={{xs: 12, sm: 6, md: 3}} sx={{ display: 'flex' }}>
                <Card sx={{ flex: 1, borderLeft: '4px solid #F44336' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom variant="overline">
                          PREGNANT STUDENTS OUT OF SCHOOL
                        </Typography>
                        <Typography variant="h4">
                          {summaryData.pregnantOutOfSchool.count.toLocaleString()}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          {summaryData.pregnantOutOfSchool.trend === 'up' ? (
                            <TrendingUpIcon color="error" fontSize="small" />
                          ) : (
                            <TrendingDownIcon color="success" fontSize="small" />
                          )}
                          <Typography 
                            variant="body2" 
                            color={summaryData.pregnantOutOfSchool.change > 0 ? 'error.main' : 'success.main'}
                            sx={{ ml: 0.5 }}
                          >
                            {summaryData.pregnantOutOfSchool.change > 0 ? '+' : ''}{summaryData.pregnantOutOfSchool.change}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ bgcolor: 'error.light', p: 1, borderRadius: 1 }}>
                        <PersonIcon color="error" />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Re-entry Count */}
              <Grid size={{xs: 12, sm: 6, md: 3}} sx={{ display: 'flex' }}>
                <Card sx={{ flex: 1, borderLeft: '4px solid #2196F3' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom variant="overline">
                          RE-ENTRY COUNT
                        </Typography>
                        <Typography variant="h4">
                          {summaryData.pregnantReturned.count.toLocaleString()}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          {summaryData.pregnantReturned.trend === 'up' ? (
                            <TrendingUpIcon color="success" fontSize="small" />
                          ) : (
                            <TrendingDownIcon color="error" fontSize="small" />
                          )}
                          <Typography 
                            variant="body2" 
                            color={summaryData.pregnantReturned.change > 0 ? 'success.main' : 'error.main'}
                            sx={{ ml: 0.5 }}
                          >
                            {summaryData.pregnantReturned.change > 0 ? '+' : ''}{summaryData.pregnantReturned.change}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ bgcolor: 'info.light', p: 1, borderRadius: 1 }}>
                        <ReturnIcon color="info" />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Re-entry Rate */}
              <Grid size={{xs: 12, sm: 6, md: 3}} sx={{ display: 'flex' }}>
                <Card sx={{ flex: 1, borderLeft: '4px solid #FF9800' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom variant="overline">
                          RE-ENTRY RATE
                        </Typography>
                        <Typography variant="h4">
                          {summaryData.reentryRate.rate}%
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                          {summaryData.reentryRate.trend === 'up' ? (
                            <TrendingUpIcon color="success" fontSize="small" />
                          ) : (
                            <TrendingDownIcon color="error" fontSize="small" />
                          )}
                          <Typography 
                            variant="body2" 
                            color={summaryData.reentryRate.change > 0 ? 'success.main' : 'error.main'}
                            sx={{ ml: 0.5 }}
                          >
                            {summaryData.reentryRate.change > 0 ? '+' : ''}{summaryData.reentryRate.change}%
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ bgcolor: 'warning.light', p: 1, borderRadius: 1 }}>
                        <BarChartIcon color="warning" />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Entity Navigation Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Trend Line Chart */}
              <Grid size={{xs: 12, md: 8}}>
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6" component="h2">
                      Trend Data
                    </Typography>
                    {entityFilter.type && entityFilter.name && (
                      <Chip 
                        label={`${entityFilter.type}: ${entityFilter.name}`} 
                        color="primary" 
                        variant="outlined"
                        size="small"
                        onDelete={clearEntityFilter}
                      />
                    )}
                  </Box>
                  <Chart
                    options={getTrendChartOptions()}
                    series={getTrendChartSeries()}
                    type="line"
                    height={350}
                  />
                </Paper>
              </Grid>

              {/* Distribution Charts */}
              <Grid size={{xs: 12, md: 4}}>
                <Grid container spacing={3}>
                  <Grid size={12}>
                    <Paper sx={{ p: 2 }}>
                      <Chart
                        options={donutChartOptions}
                        series={donutChartSeries}
                        type="donut"
                        height={200}
                      />
                    </Paper>
                  </Grid>
                  <Grid size={12}>
                    <Paper sx={{ p: 2 }}>
                      <Chart
                        options={barChartOptions}
                        series={barChartSeries}
                        type="bar"
                        height={250}
                      />
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>

            {/* Recent Submissions Table */}
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Recent Submissions
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {entityFilter.type && entityFilter.name && (
                    <Chip 
                      label={`${entityFilter.type}: ${entityFilter.name}`} 
                      color="primary" 
                      variant="outlined"
                      size="small"
                      onDelete={clearEntityFilter}
                      sx={{ mr: 1 }}
                    />
                  )}
                  <Button 
                    component={Link}
                    href="/dashboard/admin/reentry/schools"
                    size="small"
                  >
                    View All Schools
                  </Button>
                </Box>
              </Box>
              {recentSubmissions.length === 0 ? (
                <Box sx={{ py: 4, textAlign: 'center' }}>
                  <Typography color="textSecondary">
                    No recent submissions found
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>School</TableCell>
                        <TableCell>Region</TableCell>
                        <TableCell>District</TableCell>
                        <TableCell>Submitted By</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {recentSubmissions.map((submission) => (
                        <TableRow key={submission.id}>
                          <TableCell>{submission.school}</TableCell>
                          <TableCell>{submission.region}</TableCell>
                          <TableCell>{submission.district}</TableCell>
                          <TableCell>{submission.submittedBy}</TableCell>
                          <TableCell>{new Date(submission.date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Chip 
                              label={submission.status} 
                              color={submission.status === 'Complete' ? 'success' : 'warning'} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="View School Submissions">
                              <IconButton 
                                size="small" 
                                component={Link}
                                href={`/dashboard/admin/reentry/schools/${submission.schoolId}?tab=submissions`}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </>
        )}
      </Box>
    </Container>
  );
}
