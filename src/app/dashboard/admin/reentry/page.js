'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
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
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
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
  Download as DownloadIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });
import { ToggleButton, ToggleButtonGroup } from '@mui/material';

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
    categories: [], // Will be populated from API data
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

const donutChartOptions = {
  chart: {
    type: 'donut',
  },
  labels: [], // Will be populated from API data
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
    categories: [], // Will be populated from API data
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

const trendMetrics = [
  { key: 'in_school', label: 'Pregnant Girls In School' },
  { key: 'out_of_school', label: 'Pregnant Girls Out of School' },
  { key: 'returned', label: 'Girls Returned To School' },
  { key: 'reentry_rate', label: 'Re-entry Rate' },
];

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

  // State for breakdown dialog
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [breakdownTitle, setBreakdownTitle] = useState('');
  const [breakdownMetric, setBreakdownMetric] = useState('');
  const [breakdownGroupBy, setBreakdownGroupBy] = useState('school');
  const [breakdownData, setBreakdownData] = useState([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);
  const [breakdownError, setBreakdownError] = useState(null);

  // State for Trends Section
  const [trendViewBy, setTrendViewBy] = useState('terms'); // 'terms' or 'years'
  const [trendsLoading, setTrendsLoading] = useState(false);
  const [trendsError, setTrendsError] = useState(null);
  const [selectedTrendMetricKey, setSelectedTrendMetricKey] = useState(trendMetrics[0].key); // Default to first metric

  // Fetch available periods
  const fetchPeriods = async (entityType = null, entityId = null) => {
    try {
      // Build query parameters for the periods API using manual query string
      const queryParts = [];
      if (entityType && entityId) {
        queryParts.push(`entityType=${encodeURIComponent(entityType)}`);
        queryParts.push(`entityId=${encodeURIComponent(entityId)}`);
      }

      const queryString = queryParts.join('&');
      // console.log("Query string for periods:", queryString);

      const response = await fetch(`/api/reentry/periods?${queryString}`);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      // console.log('Periods data:', data);

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
      // console.log('API Response:', data);

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
          in_school: submission.in_school || 0,
          outOfSchool: submission.out_of_school || 0,
          out_of_school: submission.out_of_school || 0,
          returned: submission.returned || 0,
          returned: submission.returned || 0
        }))
        : [];

      // Update state with transformed data
      setSummaryData(transformedSummaryData);
      // setTrendData(transformedTrendData); 
      setRecentSubmissions(transformedSubmissions);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch trend data
  const fetchTrendData = useCallback(async (view, currentFilters) => {
    setTrendsLoading(true);
    setTrendsError(null);
    try {
      const params = new URLSearchParams({
        viewBy: view,
        year: currentFilters.year, // Used as context or endYear for year trends
        term: currentFilters.term,  // Used as context for term trends
        // startYear could be a fixed value like '2020' for year trends, or configurable
      });
      if (view === 'years') {
        params.append('startYear', '2020'); // Example: fixed start year for yearly trends
      }

      const response = await fetch(`/api/reentry/trends?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // console.log(`Fetched ${view} trends. API Response Data:`, JSON.stringify(data)); // Log API response
      setTrendData(data);
    } catch (err) {
      console.error(`Error fetching ${view} trends:`, err);
      setTrendsError(err.message);
      setTrendData([]); // Clear data on error
    } finally {
      setTrendsLoading(false);
    }
  }, []); // Add dependencies if currentFilters is used from component state directly and not passed as arg

  // Handle apply filters button click
  const handleApplyFilters = () => {
    fetchData();
    fetchTrendData(trendViewBy, timeRange);
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
      fetchTrendData(trendViewBy, timeRange);
    }
  }, [timeRange.year, timeRange.term, timeRange.week, trendViewBy]);

  // Update trend chart options based on API data
  const getTrendChartOptions = (metricName, dataKey) => {
    const currentMetric = trendMetrics.find(m => m.key === dataKey);
    const displayName = currentMetric ? currentMetric.label : metricName;

    const categories = trendData.map(item => 
      trendViewBy === 'terms' ? `FY${item.year} T${item.term}` : item.year.toString()
    );

    return {
      chart: {
        type: 'line',
        height: 350,
        toolbar: { show: true },
        animations: {
          enabled: true, // Keep animations enabled, but monitor if this causes issues
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
              enabled: true,
              delay: 150
          },
          dynamicAnimation: {
              enabled: true,
              speed: 350
          }
        }
      },
      stroke: {
        curve: 'smooth',
      },
      title: {
        text: `${displayName} Trend (${trendViewBy === 'terms' ? 'by Term' : 'by Year'})`,
        align: 'left'
      },
      xaxis: {
        categories: categories,
        title: {
          text: trendViewBy === 'terms' ? 'Term' : 'Year'
        }
      },
      yaxis: {
        title: {
          text: metricName
        },
        labels: {
          formatter: function (value) {
            return dataKey === 'reentry_rate' ? value.toFixed(1) + "%" : Math.round(value); 
          }
        }
      },
      tooltip: {
        y: {
          formatter: function (value) {
            return dataKey === 'reentry_rate' ? value.toFixed(1) + "%" : Math.round(value);
          }
        }
      },
      dataLabels: {
        enabled: false
      }
    };
  };

  const trendChartSeries = (dataKey) => {
    const metricConfig = trendMetrics.find(m => m.key === dataKey);
    const seriesName = metricConfig ? metricConfig.label : dataKey; // Use label from config for series name

    if (!trendData || trendData.length === 0) {
      // console.warn(`trendChartSeries called for ${dataKey} but trendData is empty. Returning empty series.`);
      return [{ name: seriesName, data: [] }];
    }

    // console.log(`trendChartSeries: Processing ${dataKey}. Full trendData: ${JSON.stringify(trendData.slice(0,2))}...`); // Log first few items

    return [{ 
      name: seriesName, 
      data: trendData.map((item, index) => {
        const rawValue = item[dataKey];
        const numericValue = Number(rawValue);
        
        // Log detailed information for debugging NaN issues, especially if rawValue is unexpected
        if (typeof rawValue === 'undefined' || isNaN(numericValue)) {
          console.warn(
            `Problematic value for metric "${dataKey}" at index ${index}: ` +
            `Item: ${JSON.stringify(item)}, ` +
            `Raw value (item["${dataKey}"]): ${rawValue} (type: ${typeof rawValue}), ` +
            `Converted to Number: ${numericValue}`
          );
        }
        
        // Temporarily default NaN to 0 to prevent chart errors
        // This helps in visualizing other valid data points but hides the underlying data issue.
        return isNaN(numericValue) ? 0 : numericValue;
      }) 
    }];
  };

  // Clear entity filter
  const clearEntityFilter = () => {
    setEntityFilter({
      type: null,
      name: null
    });
  };

  // Handle breakdown dialog open
  const handleOpenBreakdown = useCallback((title, metric) => {
    // console.log('handleOpenBreakdown triggered with title:', title, 'and metric:', metric);
    setBreakdownTitle(title);
    setBreakdownMetric(metric);
    setBreakdownGroupBy('school');
    setBreakdownOpen(true);
  }, []);

  // Handle breakdown dialog close
  const handleCloseBreakdown = useCallback(() => {
    setBreakdownOpen(false);
  }, []);

  // Handle breakdown group by change
  const handleBreakdownGroupByChange = useCallback((event) => {
    setBreakdownGroupBy(event.target.value);
  }, []);

  // Fetch breakdown data
  const fetchBreakdownData = useCallback(async () => {
    if (!breakdownOpen || !breakdownMetric) return;
    
    setBreakdownLoading(true);
    setBreakdownError(null);

    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (timeRange.year) params.append('year', timeRange.year);
      if (timeRange.term) params.append('term', timeRange.term);
      if (timeRange.week) params.append('week', timeRange.week);
      params.append('metric', breakdownMetric);
      params.append('groupBy', breakdownGroupBy);

      // Fetch data from API
      const response = await fetch(`/api/reentry/breakdown?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      // console.log('Breakdown API Response:', data);
      setBreakdownData(data.results || []);
    } catch (err) {
      console.error('Error fetching breakdown data:', err);
      setBreakdownError('Failed to load breakdown data. Please try again later.');
    } finally {
      setBreakdownLoading(false);
    }
  }, [breakdownOpen, breakdownMetric, breakdownGroupBy, timeRange]);

  // Fetch breakdown data when dialog opens or groupBy changes
  useEffect(() => {
    fetchBreakdownData();
  }, [fetchBreakdownData, breakdownOpen, breakdownGroupBy]);

  console.log('ReentryDashboard RENDER. trendData:', JSON.stringify(trendData)); // Re-enable this log
  // console.log('timeRange:', JSON.stringify(timeRange));
  // console.log('trendViewBy:', trendViewBy);
  // console.log('selectedTrendMetricKey:', selectedTrendMetricKey);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Pregnancy Reentry Dashboard
        </Typography>

        {/* Period Selector */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ sm: 12, md: 3 }}>
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
            <Grid size={{ sm: 12, md: 3 }}>
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
            <Grid size={{ sm: 12, md: 3 }}>
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
            <Grid size={{ sm: 12, md: 3 }}>
              <Button
                sx={{
                  width: '100%'
                }}
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
              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
                <Card 
                  sx={{ 
                    flex: 1, 
                    borderLeft: '4px solid #4CAF50',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 6
                    }
                  }}
                  onClick={() => handleOpenBreakdown('Pregnant Girls In School', 'in_school')}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Pregnant Girls In School
                        </Typography>
                        <Typography variant="h4">
                          {loading ? <CircularProgress size={24} /> : (summaryData?.pregnantInSchool?.count ?? 0)}
                        </Typography>
                        {summaryData?.pregnantInSchool && (summaryData.pregnantInSchool.trend && typeof summaryData.pregnantInSchool.change === 'number') && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            {summaryData.pregnantInSchool.trend === 'up' ? (
                              <TrendingUpIcon sx={{ color: 'success.main' }} fontSize="small" />
                            ) : summaryData.pregnantInSchool.trend === 'down' ? (
                              <TrendingDownIcon sx={{ color: 'error.main' }} fontSize="small" />
                            ) : null}
                            <Typography
                              variant="caption"
                              color={
                                summaryData.pregnantInSchool.change > 0 ? 'success.main' :
                                summaryData.pregnantInSchool.change < 0 ? 'error.main' :
                                'text.secondary'
                              }
                              sx={{ ml: 0.5 }}
                            >
                              {summaryData.pregnantInSchool.change > 0 ? '+' : ''}
                              {summaryData.pregnantInSchool.change}% vs prev. period
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <SchoolIcon sx={{ color: '#4CAF50', fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Pregnant Out of School */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
                <Card 
                  sx={{ 
                    flex: 1, 
                    borderLeft: '4px solid #F44336',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 6
                    }
                  }}
                  onClick={() => handleOpenBreakdown('Pregnant Girls Out of School', 'out_of_school')}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Pregnant Girls Out of School
                        </Typography>
                        <Typography variant="h4">
                          {loading ? <CircularProgress size={24} /> : (summaryData?.pregnantOutOfSchool?.count ?? 0)}
                        </Typography>
                        {summaryData?.pregnantOutOfSchool && (summaryData.pregnantOutOfSchool.trend && typeof summaryData.pregnantOutOfSchool.change === 'number') && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            {summaryData.pregnantOutOfSchool.trend === 'up' ? (
                              <TrendingUpIcon sx={{ color: 'success.main' }} fontSize="small" />
                            ) : summaryData.pregnantOutOfSchool.trend === 'down' ? (
                              <TrendingDownIcon sx={{ color: 'error.main' }} fontSize="small" />
                            ) : null}
                            <Typography
                              variant="caption"
                              color={
                                summaryData.pregnantOutOfSchool.change > 0 ? 'success.main' :
                                summaryData.pregnantOutOfSchool.change < 0 ? 'error.main' :
                                'text.secondary'
                              }
                              sx={{ ml: 0.5 }}
                            >
                              {summaryData.pregnantOutOfSchool.change > 0 ? '+' : ''}
                              {summaryData.pregnantOutOfSchool.change}% vs prev. period
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <PersonIcon sx={{ color: '#F44336', fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Re-entry Count */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
                <Card 
                  sx={{ 
                    flex: 1, 
                    borderLeft: '4px solid #2196F3',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 6
                    }
                  }}
                  onClick={() => handleOpenBreakdown('Girls Returned to School', 'returned')}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box> {/* Left content block */}
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Girls Returned to School
                        </Typography>
                        <Typography variant="h4">
                          {loading ? <CircularProgress size={24} /> : (summaryData?.pregnantReturned?.count ?? 0)}
                        </Typography>
                        {summaryData?.pregnantReturned && (summaryData.pregnantReturned.trend && typeof summaryData.pregnantReturned.change === 'number') && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            {summaryData.pregnantReturned.trend === 'up' ? (
                              <TrendingUpIcon sx={{ color: 'success.main' }} fontSize="small" />
                            ) : summaryData.pregnantReturned.trend === 'down' ? (
                              <TrendingDownIcon sx={{ color: 'error.main' }} fontSize="small" />
                            ) : null}
                            <Typography
                              variant="caption"
                              color={
                                summaryData.pregnantReturned.change > 0 ? 'success.main' :
                                summaryData.pregnantReturned.change < 0 ? 'error.main' :
                                'text.secondary'
                              }
                              sx={{ ml: 0.5 }}
                            >
                              {summaryData.pregnantReturned.change > 0 ? '+' : ''}
                              {summaryData.pregnantReturned.change}% vs prev. period
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <TrendingUpIcon sx={{ color: '#2196F3', fontSize: 40 }} /> {/* Main icon on the right */}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* Re-entry Rate */}
              <Grid size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: 'flex' }}>
                <Card 
                  sx={{ 
                    flex: 1, 
                    borderLeft: '4px solid #FF9800',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: 6
                    }
                  }}
                  onClick={() => handleOpenBreakdown('Re-entry Rate', 'reentry_rate')}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                          Re-entry Rate
                        </Typography>
                        <Typography variant="h4">
                          {loading ? <CircularProgress size={24} /> : `${summaryData?.reentryRate?.rate ?? 0}%`}
                        </Typography>
                        {summaryData?.reentryRate && (summaryData.reentryRate.trend && typeof summaryData.reentryRate.change === 'number') && (
                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                            {summaryData.reentryRate.trend === 'up' ? (
                              <TrendingUpIcon sx={{ color: 'success.main' }} fontSize="small" />
                            ) : summaryData.reentryRate.trend === 'down' ? (
                              <TrendingDownIcon sx={{ color: 'error.main' }} fontSize="small" />
                            ) : null}
                            <Typography
                              variant="caption"
                              color={
                                summaryData.reentryRate.change > 0 ? 'success.main' :
                                summaryData.reentryRate.change < 0 ? 'error.main' :
                                'text.secondary'
                              }
                              sx={{ ml: 0.5 }}
                            >
                              {summaryData.reentryRate.change > 0 ? '+' : ''}
                              {summaryData.reentryRate.change}pp vs prev. period {/* Using 'pp' for percentage points */}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                      <BarChartIcon sx={{ color: '#FF9800', fontSize: 40 }} />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Entity Navigation Cards */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              {/* Trend Line Chart */}
              <Grid size={{ xs: 12 }}> 
                <Paper sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
                    <Typography variant="h6" component="h2" sx={{ mr: 2, mb: { xs: 1, sm: 0} }} >
                      Trends Analysis
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                      <FormControl sx={{ minWidth: 220, mr: {sm: 1} }} size="small">
                        <InputLabel id="select-trend-metric-label">Metric</InputLabel>
                        <Select
                          labelId="select-trend-metric-label"
                          id="select-trend-metric"
                          value={selectedTrendMetricKey}
                          label="Metric"
                          onChange={(e) => setSelectedTrendMetricKey(e.target.value)}
                        >
                          {trendMetrics.map((metric) => (
                            <MenuItem key={metric.key} value={metric.key}>
                              {metric.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                      <ToggleButtonGroup
                        color="primary"
                        value={trendViewBy}
                        exclusive
                        onChange={(event, newValue) => {
                          if (newValue !== null) {
                            setTrendViewBy(newValue);
                          }
                        }}
                        aria-label="Trend view by"
                        size="small"
                      >
                        <ToggleButton value="terms">By Term</ToggleButton>
                        <ToggleButton value="years">By Year</ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                    {entityFilter.type && entityFilter.name && (
                      <Chip
                        label={`${entityFilter.type}: ${entityFilter.name}`}
                        color="primary"
                        variant="outlined"
                        size="small"
                        onDelete={clearEntityFilter}
                        sx={{ ml: {sm: 'auto'}, mt: {xs: 1, sm: 0} }} // Adjust margin for filter chip
                      />
                    )}
                  </Box>
                  
                  {trendsLoading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>}
                  {trendsError && <Alert severity="error" sx={{ my: 3 }}>{trendsError}</Alert>}
                  {!trendsLoading && !trendsError && trendData.length > 0 && (
                    <Chart 
                      options={getTrendChartOptions(selectedTrendMetricKey, selectedTrendMetricKey)} 
                      series={trendChartSeries(selectedTrendMetricKey)}
                      type="line" 
                      height={350} 
                    />
                  )}
                  {!trendsLoading && !trendsError && trendData.length === 0 && (
                    <Typography sx={{ textAlign: 'center', my: 3 }}>No trend data available for the selected criteria.</Typography>
                  )}
                </Paper>
              </Grid>

              {/* Removed obsolete Donut and Bar chart components */}
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

      {/* Breakdown Dialog */}
      <Dialog
        open={breakdownOpen}
        onClose={handleCloseBreakdown}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">{breakdownTitle} Breakdown</Typography>
            <IconButton onClick={handleCloseBreakdown} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Group By</InputLabel>
              <Select
                value={breakdownGroupBy}
                onChange={handleBreakdownGroupByChange}
                label="Group By"
              >
                <MenuItem value="school">Schools</MenuItem>
                <MenuItem value="district">Districts</MenuItem>
                <MenuItem value="circuit">Circuits</MenuItem>
                <MenuItem value="region">Regions</MenuItem>
                <MenuItem value="question">Questions</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {breakdownLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : breakdownError ? (
            <Alert severity="error">{breakdownError}</Alert>
          ) : (
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Parent</TableCell>
                    {breakdownGroupBy !== 'school' && (
                      <TableCell align="right">Schools</TableCell>
                    )}
                    <TableCell align="right">Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {breakdownData.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell component="th" scope="row">
                        {item.name}
                        {item.question && (
                          <Typography variant="caption" display="block" color="textSecondary">
                            {item.question}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{item.type}</TableCell>
                      <TableCell>{item.parent?.name || '-'}</TableCell>
                      {breakdownGroupBy !== 'school' && (
                        <TableCell align="right">{item.schoolCount}</TableCell>
                      )}
                      <TableCell align="right">
                        {breakdownMetric === 'reentry_rate' ? `${item.value}%` : item.value}
                      </TableCell>
                    </TableRow>
                  ))}
                  {breakdownData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={breakdownGroupBy !== 'school' ? 5 : 4} align="center">
                        No data available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBreakdown}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
