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
        // If real API functions are provided, use them
        const entityData = fetchEntityData ? 
          await fetchEntityData(entityType, entityId) : 
          await mockFetchEntityData(entityType, entityId);
        
        const metricsData = fetchMetricsData ? 
          await fetchMetricsData(entityType, entityId) : 
          await mockFetchMetricsData(entityType, entityId);
        
        const historicalData = fetchHistoricalData ? 
          await fetchHistoricalData(entityType, entityId) : 
          await mockFetchHistoricalData(entityType, entityId);
        
        const submissionsData = fetchSubmissionsData ? 
          await fetchSubmissionsData(entityType, entityId) : 
          await mockFetchSubmissionsData(entityType, entityId);
        
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

// Mock data functions (to be replaced with actual API calls)
async function mockFetchEntityData(entityType, entityId) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Mock school data
  if (entityType === 'school' && entityId === '1') {
    return {
      id: '1',
      name: 'Accra Girls Senior High School',
      type: 'school',
      location: 'Accra, Greater Accra',
      contactPerson: 'Mrs. Patience Ayekoo',
      phone: '+233 24 123 4567',
      email: 'info@accragirlsshs.edu.gh',
      lastSubmission: '2025-05-15',
      students: [
        { id: '101', name: 'Abena Mensah', age: 17, grade: 'SHS 2', status: 'In School', lastUpdate: '2025-05-10' },
        { id: '102', name: 'Akosua Owusu', age: 16, grade: 'SHS 1', status: 'Out of School', lastUpdate: '2025-05-12' },
        { id: '103', name: 'Ama Sarpong', age: 18, grade: 'SHS 3', status: 'Re-entered', lastUpdate: '2025-05-08' },
        { id: '104', name: 'Yaa Asantewaa', age: 17, grade: 'SHS 2', status: 'In School', lastUpdate: '2025-05-15' },
        { id: '105', name: 'Adwoa Boateng', age: 16, grade: 'SHS 1', status: 'In School', lastUpdate: '2025-05-14' }
      ]
    };
  }
  
  // Mock circuit data
  if (entityType === 'circuit' && entityId === '1') {
    return {
      id: '1',
      name: 'Accra Central Circuit',
      type: 'circuit',
      location: 'Accra, Greater Accra',
      contactPerson: 'Mr. John Mensah',
      phone: '+233 24 987 6543',
      email: 'accra.central@ghanaedu.gov.gh',
      lastSubmission: '2025-05-20'
    };
  }
  
  // Mock district data
  if (entityType === 'district' && entityId === '1') {
    return {
      id: '1',
      name: 'Accra Metro',
      type: 'district',
      location: 'Greater Accra',
      contactPerson: 'Dr. Emmanuel Addo',
      phone: '+233 24 555 7890',
      email: 'accra.metro@ghanaedu.gov.gh',
      lastSubmission: '2025-05-22'
    };
  }
  
  // Mock region data
  if (entityType === 'region' && entityId === '1') {
    return {
      id: '1',
      name: 'Greater Accra',
      type: 'region',
      location: 'Ghana',
      contactPerson: 'Prof. Sarah Adjei',
      phone: '+233 24 111 2222',
      email: 'greater.accra@ghanaedu.gov.gh',
      lastSubmission: '2025-05-25'
    };
  }
  
  // Default mock entity
  return {
    id: entityId,
    name: `${entityType.charAt(0).toUpperCase() + entityType.slice(1)} ${entityId}`,
    type: entityType,
    location: 'Ghana',
    contactPerson: 'Contact Person',
    phone: '+233 24 000 0000',
    email: `contact@${entityType}${entityId}.edu.gh`,
    lastSubmission: '2025-05-01'
  };
}

async function mockFetchMetricsData(entityType, entityId) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Return mock metrics data
  return {
    pregnantInSchool: {
      value: 45,
      change: 12,
      trend: 'up'
    },
    pregnantOutOfSchool: {
      value: 23,
      change: -5,
      trend: 'down'
    },
    reentryCount: {
      value: 18,
      change: 8,
      trend: 'up'
    },
    reentryRate: {
      value: 78,
      change: 3,
      trend: 'up',
      isPercentage: true
    }
  };
}

async function mockFetchHistoricalData(entityType, entityId) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 400));
  
  // Return mock historical data
  return {
    trendChart: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      series: [
        {
          name: 'Pregnant In School',
          data: [30, 32, 35, 38, 40, 42, 43, 44, 45, 45, 45, 45]
        },
        {
          name: 'Pregnant Out of School',
          data: [28, 27, 26, 25, 25, 24, 24, 23, 23, 23, 23, 23]
        },
        {
          name: 'Re-entries',
          data: [5, 7, 9, 10, 12, 13, 14, 15, 16, 17, 18, 18]
        }
      ]
    },
    yearlyComparison: {
      categories: ['2023', '2024', '2025'],
      series: [
        {
          name: 'Pregnant In School',
          data: [35, 40, 45]
        },
        {
          name: 'Pregnant Out of School',
          data: [30, 25, 23]
        },
        {
          name: 'Re-entries',
          data: [10, 15, 18]
        }
      ]
    },
    reentryRateTrend: {
      categories: ['2020', '2021', '2022', '2023', '2024', '2025'],
      series: [
        {
          name: 'Re-entry Rate',
          data: [45, 52, 60, 68, 75, 78]
        }
      ]
    }
  };
}

async function mockFetchSubmissionsData(entityType, entityId) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 350));
  
  // Return mock submissions data with more details
  return [
    { 
      id: 1, 
      schoolId: entityId,
      schoolName: 'Accra High School',
      districtId: '45',
      districtName: 'Accra Metropolitan',
      circuitId: '67',
      circuitName: 'Accra Central Circuit',
      regionId: '8',
      regionName: 'Greater Accra',
      submittedBy: 'John Doe',
      submittedAt: '2025-05-15T10:30:00Z',
      year: 2025,
      term: 2,
      week: 8,
      status: 'approved',
      pregnantInSchool: 45, 
      pregnantOutOfSchool: 23, 
      reentries: 18, 
      reentryRate: 78,
      data: {
        totalStudents: 1250,
        pregnantInSchool: 45,
        pregnantOutOfSchool: 23,
        reenteredStudents: 18,
        comments: 'Regular monitoring and counseling sessions are helping with reentry rates.',
        challenges: 'Transportation remains a challenge for some students.',
        recommendations: 'Consider providing transportation stipends for at-risk students.'
      },
      history: [
        { action: 'created', timestamp: '2025-05-15T10:30:00Z', user: 'John Doe', notes: 'Initial submission' },
        { action: 'reviewed', timestamp: '2025-05-16T09:15:00Z', user: 'Jane Smith', notes: 'Data verified with school records' },
        { action: 'approved', timestamp: '2025-05-16T14:45:00Z', user: 'Robert Johnson', notes: 'Approved for dashboard' }
      ]
    },
    { 
      id: 2, 
      schoolId: entityId,
      schoolName: 'Accra High School',
      districtId: '45',
      districtName: 'Accra Metropolitan',
      circuitId: '67',
      circuitName: 'Accra Central Circuit',
      regionId: '8',
      regionName: 'Greater Accra',
      submittedBy: 'Jane Smith',
      submittedAt: '2025-04-15T11:45:00Z',
      year: 2025,
      term: 2,
      week: 4,
      status: 'approved',
      pregnantInSchool: 44, 
      pregnantOutOfSchool: 23, 
      reentries: 17, 
      reentryRate: 74,
      data: {
        totalStudents: 1245,
        pregnantInSchool: 44,
        pregnantOutOfSchool: 23,
        reenteredStudents: 17,
        comments: 'Continued improvement in reentry rates.',
        challenges: 'Some students still facing stigma in the community.',
        recommendations: 'Community sensitization programs should be intensified.'
      },
      history: [
        { action: 'created', timestamp: '2025-04-15T11:45:00Z', user: 'Jane Smith', notes: 'Initial submission' },
        { action: 'reviewed', timestamp: '2025-04-16T10:30:00Z', user: 'John Doe', notes: 'Data verified' },
        { action: 'approved', timestamp: '2025-04-16T15:20:00Z', user: 'Robert Johnson', notes: 'Approved for dashboard' }
      ]
    },
    { 
      id: 3, 
      schoolId: entityId,
      schoolName: 'Accra High School',
      districtId: '45',
      districtName: 'Accra Metropolitan',
      circuitId: '67',
      circuitName: 'Accra Central Circuit',
      regionId: '8',
      regionName: 'Greater Accra',
      submittedBy: 'John Doe',
      submittedAt: '2025-03-15T09:20:00Z',
      year: 2025,
      term: 1,
      week: 12,
      status: 'approved',
      pregnantInSchool: 43, 
      pregnantOutOfSchool: 24, 
      reentries: 15, 
      reentryRate: 63,
      data: {
        totalStudents: 1240,
        pregnantInSchool: 43,
        pregnantOutOfSchool: 24,
        reenteredStudents: 15,
        comments: 'Counseling program showing positive results.',
        challenges: 'Need more resources for the counseling department.',
        recommendations: 'Allocate additional budget for counseling resources.'
      },
      history: [
        { action: 'created', timestamp: '2025-03-15T09:20:00Z', user: 'John Doe', notes: 'Initial submission' },
        { action: 'reviewed', timestamp: '2025-03-16T11:10:00Z', user: 'Jane Smith', notes: 'Data verified' },
        { action: 'approved', timestamp: '2025-03-16T16:05:00Z', user: 'Robert Johnson', notes: 'Approved for dashboard' }
      ]
    },
    { 
      id: 4, 
      schoolId: entityId,
      schoolName: 'Accra High School',
      districtId: '45',
      districtName: 'Accra Metropolitan',
      circuitId: '67',
      circuitName: 'Accra Central Circuit',
      regionId: '8',
      regionName: 'Greater Accra',
      submittedBy: 'Jane Smith',
      submittedAt: '2025-02-15T10:15:00Z',
      year: 2025,
      term: 1,
      week: 8,
      status: 'approved',
      pregnantInSchool: 40, 
      pregnantOutOfSchool: 25, 
      reentries: 12, 
      reentryRate: 48,
      data: {
        totalStudents: 1235,
        pregnantInSchool: 40,
        pregnantOutOfSchool: 25,
        reenteredStudents: 12,
        comments: 'Starting to see improvements in reentry rates.',
        challenges: 'Financial constraints for some students.',
        recommendations: 'Explore scholarship opportunities for affected students.'
      },
      history: [
        { action: 'created', timestamp: '2025-02-15T10:15:00Z', user: 'Jane Smith', notes: 'Initial submission' },
        { action: 'reviewed', timestamp: '2025-02-16T09:45:00Z', user: 'John Doe', notes: 'Data verified' },
        { action: 'approved', timestamp: '2025-02-16T14:30:00Z', user: 'Robert Johnson', notes: 'Approved for dashboard' }
      ]
    },
    { 
      id: 5, 
      schoolId: entityId,
      schoolName: 'Accra High School',
      districtId: '45',
      districtName: 'Accra Metropolitan',
      circuitId: '67',
      circuitName: 'Accra Central Circuit',
      regionId: '8',
      regionName: 'Greater Accra',
      submittedBy: 'John Doe',
      submittedAt: '2025-01-15T11:00:00Z',
      year: 2025,
      term: 1,
      week: 4,
      status: 'approved',
      pregnantInSchool: 38, 
      pregnantOutOfSchool: 25, 
      reentries: 10, 
      reentryRate: 40,
      data: {
        totalStudents: 1230,
        pregnantInSchool: 38,
        pregnantOutOfSchool: 25,
        reenteredStudents: 10,
        comments: 'Implemented new counseling program this term.',
        challenges: 'Stigma and lack of support from some families.',
        recommendations: 'Organize parent-teacher meetings to address concerns.'
      },
      history: [
        { action: 'created', timestamp: '2025-01-15T11:00:00Z', user: 'John Doe', notes: 'Initial submission' },
        { action: 'reviewed', timestamp: '2025-01-16T10:20:00Z', user: 'Jane Smith', notes: 'Data verified' },
        { action: 'approved', timestamp: '2025-01-16T15:10:00Z', user: 'Robert Johnson', notes: 'Approved for dashboard' }
      ]
    }
  ];
}
