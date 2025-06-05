'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Breadcrumbs,
  Link as MuiLink,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Button,
  Tabs,
  Tab,
  Avatar,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  AssignmentReturn as ReturnIcon,
  BarChart as BarChartIcon,
  ArrowBack as ArrowBackIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Person as UserIcon,
  CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import Link from 'next/link';
import Chart from 'react-apexcharts';

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`entity-tabpanel-${index}`}
      aria-labelledby={`entity-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Metric card component
function MetricCard({ title, value, change, trend, icon, color, isPercentage = false }) {
  return (
    <Card sx={{ borderLeft: `4px solid ${color}`, height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography color="textSecondary" gutterBottom variant="overline">
              {title}
            </Typography>
            <Typography variant="h4">
              {isPercentage ? `${value}%` : value.toLocaleString()}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              {trend === 'up' ? (
                <TrendingUpIcon color={change > 0 ? "success" : "error"} fontSize="small" />
              ) : (
                <TrendingDownIcon color={change < 0 ? "success" : "error"} fontSize="small" />
              )}
              <Typography 
                variant="body2" 
                color={change > 0 ? 'success.main' : 'error.main'}
                sx={{ ml: 0.5 }}
              >
                {change > 0 ? '+' : ''}{change}%
              </Typography>
            </Box>
          </Box>
          <Box sx={{ bgcolor: color, p: 1, borderRadius: 1, opacity: 0.8 }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * Reusable component for displaying entity details
 * @param {Object} props
 * @param {string} props.entityType - Type of entity (school, circuit, district, region)
 * @param {string} props.entityId - ID of the entity
 * @param {Object} props.breadcrumbs - Breadcrumb configuration
 * @param {Function} props.fetchEntityData - Function to fetch entity data
 * @param {Function} props.fetchMetricsData - Function to fetch metrics data
 * @param {Function} props.fetchHistoricalData - Function to fetch historical data
 * @param {Function} props.fetchSubmissionsData - Function to fetch submissions data
 */
export default function ReentryEntityDetailView({
  entityType,
  entityId,
  breadcrumbs,
  fetchEntityData,
  fetchMetricsData,
  fetchHistoricalData,
  fetchSubmissionsData
}) {
  // Get tab from URL using native URLSearchParams
  const getTabFromUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('tab');
    }
    return null;
  };
  
  // State for data
  const [entity, setEntity] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [historicalData, setHistoricalData] = useState(null);
  const [submissions, setSubmissions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters
  const [yearFilter, setYearFilter] = useState('all');
  const [termFilter, setTermFilter] = useState('all');
  const [weekFilter, setWeekFilter] = useState('all');

  // Set initial tab value based on URL query parameter
  const getInitialTabValue = () => {
    const tabParam = getTabFromUrl();
    if (tabParam === 'overview') return 0;
    if (tabParam === 'trends') return 1;
    if (tabParam === 'submissions') return 2;
    if (tabParam === 'students' && entityType === 'school') return 3;
    return 0; // Default to overview
  };

  // Handle tab change
  const [tabValue, setTabValue] = useState(getInitialTabValue());
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    
    // Update URL with tab parameter
    let tabName;
    switch (newValue) {
      case 0:
        tabName = 'overview';
        break;
      case 1:
        tabName = 'trends';
        break;
      case 2:
        tabName = 'submissions';
        break;
      case 3:
        tabName = 'students';
        break;
      default:
        tabName = 'overview';
    }
    
    // Create a new URL with the updated tab parameter
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabName);
      
      // Update the URL without refreshing the page
      window.history.pushState({}, '', url);
    }
  };

  // Fetch entity data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Use the provided API functions
        const entityData = await fetchEntityData(entityType, entityId);
        const metricsData = await fetchMetricsData(entityType, entityId);
        const historicalData = await fetchHistoricalData(entityType, entityId);
        const submissionsData = await fetchSubmissionsData(entityType, entityId);
        
        setEntity(entityData);
        setMetrics(metricsData);
        setHistoricalData(historicalData);
        setSubmissions(submissionsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [entityType, entityId, fetchEntityData, fetchMetricsData, fetchHistoricalData, fetchSubmissionsData]);

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 5, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error || !entity) {
    return (
      <Container maxWidth="xl">
        <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main', my: 5 }}>
          {error || `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} not found`}
        </Paper>
      </Container>
    );
  }

  // Get back URL based on entity type
  const getBackUrl = () => {
    switch (entityType) {
      case 'school':
        return '/dashboard/admin/reentry/schools';
      case 'circuit':
        return '/dashboard/admin/reentry/circuits';
      case 'district':
        return '/dashboard/admin/reentry/districts';
      case 'region':
        return '/dashboard/admin/reentry/regions';
      default:
        return '/dashboard/admin/reentry';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Breadcrumb Navigation */}
        <Box sx={{ mb: 3 }}>
          <Breadcrumbs aria-label="breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              index === breadcrumbs.length - 1 ? (
                <Typography key={index} color="text.primary">{crumb.label}</Typography>
              ) : (
                <MuiLink key={index} component={Link} href={crumb.href} color="inherit">
                  {crumb.label}
                </MuiLink>
              )
            ))}
          </Breadcrumbs>
        </Box>

        {/* Back Button */}
        <Button
          startIcon={<ArrowBackIcon />}
          component={Link}
          href={getBackUrl()}
          sx={{ mb: 2 }}
        >
          Back
        </Button>

        {/* Entity Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                bgcolor: getEntityColor(entityType), 
                width: 64, 
                height: 64,
                mr: 2
              }}
            >
              {getEntityIcon(entityType)}
            </Avatar>
            <Box>
              <Typography variant="h4">{entity.name}</Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {getEntityTypeLabel(entityType)} • {entity.location}
              </Typography>
            </Box>
          </Box>
          
          {/* Entity Details */}
          <Grid container spacing={2} sx={{ mt: 2 }}>
            {entity.contactPerson && (
              <Grid size={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <UserIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{entity.contactPerson}</Typography>
                </Box>
              </Grid>
            )}
            {entity.phone && (
              <Grid size={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{entity.phone}</Typography>
                </Box>
              </Grid>
            )}
            {entity.email && (
              <Grid size={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">{entity.email}</Typography>
                </Box>
              </Grid>
            )}
            {entity.lastSubmission && (
              <Grid size={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2">Last submission: {new Date(entity.lastSubmission).toLocaleDateString()}</Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Metrics Summary */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid size={{xs: 12, sm: 6, md: 3}} sx={{ display: 'flex' }}>
            <MetricCard
              title="Pregnant Students In School"
              value={metrics.pregnantInSchool.value}
              change={metrics.pregnantInSchool.change}
              trend={metrics.pregnantInSchool.trend}
              icon={<SchoolIcon sx={{ color: 'white' }} />}
              color="#4CAF50"
            />
          </Grid>
          <Grid size={{xs: 12, sm: 6, md: 3}} sx={{ display: 'flex' }}>
            <MetricCard
              title="Pregnant Students Out of School"
              value={metrics.pregnantOutOfSchool.value}
              change={metrics.pregnantOutOfSchool.change}
              trend={metrics.pregnantOutOfSchool.trend}
              icon={<PersonIcon sx={{ color: 'white' }} />}
              color="#F44336"
            />
          </Grid>
          <Grid size={{xs: 12, sm: 6, md: 3}} sx={{ display: 'flex' }}>
            <MetricCard
              title="Re-entry Count"
              value={metrics.reentryCount.value}
              change={metrics.reentryCount.change}
              trend={metrics.reentryCount.trend}
              icon={<ReturnIcon sx={{ color: 'white' }} />}
              color="#2196F3"
            />
          </Grid>
          <Grid size={{xs: 12, sm: 6, md: 3}} sx={{ display: 'flex' }}>
            <MetricCard
              title="Re-entry Rate"
              value={metrics.reentryRate.value}
              change={metrics.reentryRate.change}
              trend={metrics.reentryRate.trend}
              icon={<BarChartIcon sx={{ color: 'white' }} />}
              color="#FF9800"
              isPercentage={true}
            />
          </Grid>
        </Grid>

        {/* Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Overview" />
            <Tab label="Historical Trends" />
            <Tab label="Submissions" />
            {entityType === 'school' && <Tab label="Students" />}
          </Tabs>

          {/* Overview Tab */}
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid size={{xs: 12, md: 8}}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Trends Over Time
                  </Typography>
                  <Chart
                    options={{
                      chart: {
                        type: 'line',
                        toolbar: {
                          show: true,
                        }
                      },
                      stroke: {
                        curve: 'smooth',
                        width: 3
                      },
                      xaxis: {
                        categories: historicalData.trendChart.categories,
                      },
                      colors: ['#4CAF50', '#F44336', '#2196F3'],
                      legend: {
                        position: 'top'
                      }
                    }}
                    series={historicalData.trendChart.series}
                    type="line"
                    height={350}
                  />
                </Paper>
              </Grid>
              <Grid size={{xs: 12, md: 4}}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Current Distribution
                  </Typography>
                  <Chart
                    options={{
                      chart: {
                        type: 'donut',
                      },
                      labels: ['In School', 'Out of School', 'Re-entered'],
                      colors: ['#4CAF50', '#F44336', '#2196F3'],
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
                    }}
                    series={[
                      metrics.pregnantInSchool.value,
                      metrics.pregnantOutOfSchool.value,
                      metrics.reentryCount.value
                    ]}
                    type="donut"
                    height={350}
                  />
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Historical Trends Tab */}
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid size={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Yearly Comparison
                  </Typography>
                  <Chart
                    options={{
                      chart: {
                        type: 'bar',
                      },
                      plotOptions: {
                        bar: {
                          horizontal: false,
                          columnWidth: '55%',
                          endingShape: 'rounded'
                        },
                      },
                      dataLabels: {
                        enabled: false
                      },
                      xaxis: {
                        categories: historicalData.yearlyComparison.categories,
                      },
                      colors: ['#4CAF50', '#F44336', '#2196F3'],
                      legend: {
                        position: 'top'
                      }
                    }}
                    series={historicalData.yearlyComparison.series}
                    type="bar"
                    height={350}
                  />
                </Paper>
              </Grid>
              <Grid size={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Re-entry Rate Trend
                  </Typography>
                  <Chart
                    options={{
                      chart: {
                        type: 'line',
                      },
                      stroke: {
                        curve: 'smooth',
                        width: 3
                      },
                      xaxis: {
                        categories: historicalData.reentryRateTrend.categories,
                      },
                      yaxis: {
                        min: 0,
                        max: 100,
                        labels: {
                          formatter: (val) => `${val}%`
                        }
                      },
                      colors: ['#FF9800'],
                      markers: {
                        size: 6
                      }
                    }}
                    series={historicalData.reentryRateTrend.series}
                    type="line"
                    height={350}
                  />
                </Paper>
              </Grid>
            </Grid>
          </TabPanel>

          {/* Submissions Tab */}
          <TabPanel value={tabValue} index={2}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Recent Submissions
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Submitted By</TableCell>
                      <TableCell>Pregnant In School</TableCell>
                      <TableCell>Pregnant Out of School</TableCell>
                      <TableCell>Re-entries</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>{new Date(submission.submittedAt).toLocaleDateString()}</TableCell>
                        <TableCell>{submission.submittedBy}</TableCell>
                        <TableCell>{submission.pregnantInSchool}</TableCell>
                        <TableCell>{submission.pregnantOutOfSchool}</TableCell>
                        <TableCell>{submission.reentries}</TableCell>
                        <TableCell>
                          <Chip 
                            label={submission.status} 
                            color={submission.status === 'Complete' ? 'success' : 'warning'} 
                            size="small" 
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              component={Link}
                              href={`/dashboard/admin/reentry/submissions/${submission.id}`}
                            >
                              <BarChartIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </TabPanel>

          {/* Students Tab (only for schools) */}
          {entityType === 'school' && (
            <TabPanel value={tabValue} index={3}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Student Records
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Name</TableCell>
                        <TableCell>Age</TableCell>
                        <TableCell>Grade/Class</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Last Update</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {entity.students && entity.students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.age}</TableCell>
                          <TableCell>{student.grade}</TableCell>
                          <TableCell>
                            <Chip 
                              label={student.status} 
                              color={
                                student.status === 'In School' ? 'success' : 
                                student.status === 'Out of School' ? 'error' : 
                                'info'
                              } 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>{new Date(student.lastUpdate).toLocaleDateString()}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="View Student Details">
                              <IconButton 
                                size="small" 
                                component={Link}
                                href={`/dashboard/admin/reentry/students/${student.id}`}
                              >
                                <BarChartIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </TabPanel>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

// Helper functions
function getEntityTypeLabel(entityType) {
  switch (entityType) {
    case 'school':
      return 'School';
    case 'circuit':
      return 'Circuit';
    case 'district':
      return 'District';
    case 'region':
      return 'Region';
    default:
      return 'Entity';
  }
}

function getEntityColor(entityType) {
  switch (entityType) {
    case 'school':
      return '#4CAF50';
    case 'circuit':
      return '#2196F3';
    case 'district':
      return '#FF9800';
    case 'region':
      return '#9C27B0';
    default:
      return '#757575';
  }
}

function getEntityIcon(entityType) {
  switch (entityType) {
    case 'school':
      return <SchoolIcon />;
    case 'circuit':
      return <LocationIcon />;
    case 'district':
      return <LocationIcon />;
    case 'region':
      return <LocationIcon />;
    default:
      return <LocationIcon />;
  }
}
