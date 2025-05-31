'use client';

import React, { use, useState, useEffect } from 'react';
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
  Chip,
  Divider,
  Stack,
  Breadcrumbs,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Avatar
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HomeIcon from '@mui/icons-material/Home';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EditIcon from '@mui/icons-material/Edit';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import GroupsIcon from '@mui/icons-material/Groups';
import PieChartIcon from '@mui/icons-material/PieChart';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// Import chart components - we're using ApexCharts
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// Categories constants
const CATEGORIES = [
  { id: 1, name: 'School Output Indicators', icon: <SchoolIcon /> },
  { id: 2, name: 'District Output Indicators', icon: <AssessmentIcon /> },
  { id: 3, name: 'Consolidated Checklist', icon: <PlaylistAddCheckIcon /> },
  { id: 4, name: 'Partners in Play', icon: <GroupsIcon /> }
];

export default function ItineraryDetailPage({ params }) {
  const router = useRouter();
  // params is async; unwrap with use()
  const { id: itineraryId } = use(params);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [categoryStats, setCategoryStats] = useState([]);
  const [schoolStats, setSchoolStats] = useState([]);
  const [districtStats, setDistrictStats] = useState([]);
  
  useEffect(() => {
    const fetchItineraryData = async () => {
      setLoading(true);
      try {
        // Fetch itinerary details from API
        const itineraryResponse = await fetch(`/api/rtp/itineraries/${itineraryId}`);
        if (!itineraryResponse.ok) {
          throw new Error(`Failed to fetch itinerary: ${itineraryResponse.status}`);
        }
        const itineraryData = await itineraryResponse.json();
        
        // Fetch analytics data for this itinerary
        const analyticsResponse = await fetch(`/api/rtp/analytics?itineraryId=${itineraryId}`);
        if (!analyticsResponse.ok) {
          throw new Error(`Failed to fetch analytics: ${analyticsResponse.status}`);
        }
        const analyticsData = await analyticsResponse.json();
        
        // Fetch outcome indicators for this itinerary
        const indicatorsResponse = await fetch(`/api/rtp/outcome-indicators?itineraryId=${itineraryId}`);
        if (!indicatorsResponse.ok) {
          throw new Error(`Failed to fetch indicators: ${indicatorsResponse.status}`);
        }
        const indicatorsData = await indicatorsResponse.json();
        
        // Fetch schools data for this itinerary
        const schoolsResponse = await fetch(`/api/rtp/schools?itineraryId=${itineraryId}`);
        if (!schoolsResponse.ok) {
          throw new Error(`Failed to fetch schools: ${schoolsResponse.status}`);
        }
        const schoolsData = await schoolsResponse.json();
        
        // Fetch districts data for this itinerary
        const districtsResponse = await fetch(`/api/rtp/districts?itineraryId=${itineraryId}`);
        if (!districtsResponse.ok) {
          throw new Error(`Failed to fetch districts: ${districtsResponse.status}`);
        }
        const districtsData = await districtsResponse.json();
        
        // Calculate response and completion rates
        const totalSchools = schoolsData.data?.length || 0;
        const respondedSchools = schoolsData.data?.filter(school => 
          school.responses && school.responses > 0
        ).length || 0;
        
        const totalQuestions = itineraryData.questions?.length || 0;
        const completedResponses = analyticsData.data?.summary?.totalResponses || 0;
        
        const responseRate = totalSchools > 0 ? Math.round((respondedSchools / totalSchools) * 100) : 0;
        const completionRate = totalQuestions > 0 ? Math.round((completedResponses / (totalSchools * totalQuestions)) * 100) : 0;
        
        // Enhance itinerary data with calculated stats
        const enhancedItinerary = {
          ...itineraryData,
          description: itineraryData.description || "This itinerary collects data on Right to Play implementation across schools.",
          stats: {
            totalSchools,
            respondedSchools,
            totalQuestions,
            completedResponses,
            responseRate,
            completionRate,
            schoolOutputResponses: itineraryData.stats?.school_output_responses || 0,
            districtOutputResponses: itineraryData.stats?.district_output_responses || 0,
            checklistResponses: itineraryData.stats?.checklist_responses || 0,
            pipResponses: itineraryData.stats?.pip_responses || 0
          }
        };
        
        setItinerary(enhancedItinerary);
        
        // Process category statistics
        const categories = [
          { 
            id: 1, 
            name: 'School Output Indicators', 
            total: analyticsData.data?.schoolOutput?.totalQuestions || 0,
            completed: analyticsData.data?.schoolOutput?.totalResponses || 0,
            progress: analyticsData.data?.schoolOutput?.completionRate || 0
          },
          { 
            id: 2, 
            name: 'District Output Indicators', 
            total: analyticsData.data?.districtOutput?.totalQuestions || 0,
            completed: analyticsData.data?.districtOutput?.totalResponses || 0,
            progress: analyticsData.data?.districtOutput?.completionRate || 0
          },
          { 
            id: 3, 
            name: 'Consolidated Checklist', 
            total: analyticsData.data?.consolidatedChecklist?.totalQuestions || 0,
            completed: analyticsData.data?.consolidatedChecklist?.totalResponses || 0,
            progress: analyticsData.data?.consolidatedChecklist?.completionRate || 0
          },
          { 
            id: 4, 
            name: 'Partners in Play', 
            total: analyticsData.data?.partnersInPlay?.totalQuestions || 0,
            completed: analyticsData.data?.partnersInPlay?.totalResponses || 0,
            progress: analyticsData.data?.partnersInPlay?.completionRate || 0
          }
        ];
        
        setCategoryStats(categories);
        
        // Process school statistics
        const schoolStats = schoolsData.data?.map(school => ({
          id: school.id,
          name: school.name,
          district: school.district_name,
          responseStatus: school.responses > 0 ? 
            (school.completion_rate >= 100 ? 'Completed' : 'Partial') : 
            'Not Started',
          submissionDate: school.last_submission_date,
          completionRate: school.completion_rate || 0
        })) || [];
        
        setSchoolStats(schoolStats);
        
        // Process district statistics
        const districtStats = districtsData.data?.map(district => ({
          id: district.id,
          name: district.name,
          schools: district.total_schools || 0,
          responded: district.responded_schools || 0,
          completionRate: district.completion_rate || 0
        })) || [];
        
        setDistrictStats(districtStats);
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching itinerary data:', err);
        setError(`Failed to load itinerary data: ${err.message}`);
        setLoading(false);
      }
    };
    
    if (itineraryId) {
      fetchItineraryData();
    }
  }, [itineraryId]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Chart configuration for completion by category
  const categoryChartOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: true,
        dataLabels: {
          position: 'bottom'
        }
      }
    },
    colors: ['#4CAF50'],
    dataLabels: {
      enabled: true,
      formatter: function (val) {
        return val + "%";
      },
      offsetX: 10,
      style: {
        fontSize: '12px',
        colors: ['#fff']
      }
    },
    xaxis: {
      categories: categoryStats.map(cat => cat.name),
      max: 100
    },
    title: {
      text: 'Completion Rate by Category',
      align: 'center'
    }
  };

  // Calculate school participation data from schoolStats
  const completedSchools = schoolStats.filter(school => school.responseStatus === 'Completed').length;
  const partialSchools = schoolStats.filter(school => school.responseStatus === 'Partial').length;
  const notStartedSchools = schoolStats.filter(school => school.responseStatus === 'Not Started').length;
  
  // Chart configuration for school participation
  const schoolParticipationOptions = {
    chart: {
      type: 'donut',
      height: 350
    },
    labels: ['Completed', 'Partial', 'Not Started'],
    colors: ['#4CAF50', '#FF9800', '#F44336'],
    title: {
      text: 'School Response Status',
      align: 'center'
    },
    legend: {
      position: 'bottom'
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              formatter: function (w) {
                const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                const completed = w.globals.series[0];
                return total > 0 ? Math.round((completed / total) * 100) + '%' : '0%';
              }
            }
          }
        }
      }
    }
  };

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
        <Link href="/dashboard/admin/rtp/itineraries" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <CalendarMonthIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Itineraries
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          {itinerary?.title || 'Itinerary Details'}
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <CalendarMonthIcon sx={{ mr: 2, fontSize: 35, color: 'primary.main' }} />
          Itinerary Details
        </Typography>
        
        <Box>
          <Button 
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            component={Link}
            href="/dashboard/admin/rtp/itineraries"
            sx={{ mr: 2 }}
          >
            Back to Itineraries
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<FormatListBulletedIcon />}
            component={Link}
            href={`/dashboard/admin/rtp/itineraries/${itineraryId}/questions`}
          >
            Manage Questions
          </Button>
        </Box>
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
          {/* Itinerary Overview Card */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h5" color="primary" gutterBottom>
                    {itinerary.title}
                  </Typography>
                  <Typography variant="body1" paragraph>
                    {itinerary.description}
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip 
                      label={itinerary.is_valid ? "Active" : "Inactive"} 
                      color={itinerary.is_valid ? "success" : "default"} 
                    />
                    <Typography variant="body2">
                      <strong>Period:</strong> {itinerary.period} {itinerary.type} {itinerary.year}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Date Range:</strong> {itinerary.from_date} to {itinerary.until_date}
                    </Typography>
                  </Stack>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    Summary
                  </Typography>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Total Schools:</Typography>
                      <Typography variant="body2" fontWeight="bold">{itinerary.stats.totalSchools}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Responded Schools:</Typography>
                      <Typography variant="body2" fontWeight="bold">{itinerary.stats.respondedSchools}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Response Rate:</Typography>
                      <Typography variant="body2" fontWeight="bold">{itinerary.stats.responseRate}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Completion Rate:</Typography>
                      <Typography variant="body2" fontWeight="bold">{itinerary.stats.completionRate}%</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Total Questions:</Typography>
                      <Typography variant="body2" fontWeight="bold">{itinerary.stats.totalQuestions}</Typography>
                    </Box>
                  </Stack>
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            {/* Quick Stats Cards */}
            <Typography variant="h6" gutterBottom>
              Response Metrics
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom variant="overline">
                          RESPONSE RATE
                        </Typography>
                        <Typography variant="h4">
                          {itinerary.stats.responseRate}%
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <PieChartIcon />
                      </Avatar>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={itinerary.stats.responseRate} 
                        sx={{ height: 6, borderRadius: 3 }} 
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom variant="overline">
                          COMPLETION RATE
                        </Typography>
                        <Typography variant="h4">
                          {itinerary.stats.completionRate}%
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'success.light' }}>
                        <AssessmentIcon />
                      </Avatar>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={itinerary.stats.completionRate} 
                        sx={{ height: 6, borderRadius: 3 }} 
                        color="success"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom variant="overline">
                          SCHOOLS PARTICIPATING
                        </Typography>
                        <Typography variant="h4">
                          {itinerary.stats.respondedSchools}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'info.light' }}>
                        <SchoolIcon />
                      </Avatar>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={(itinerary.stats.respondedSchools / itinerary.stats.totalSchools) * 100} 
                        sx={{ height: 6, borderRadius: 3 }} 
                        color="info"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography color="textSecondary" gutterBottom variant="overline">
                          QUESTIONS ANSWERED
                        </Typography>
                        <Typography variant="h4">
                          {itinerary.stats.completedResponses}
                        </Typography>
                      </Box>
                      <Avatar sx={{ bgcolor: 'warning.light' }}>
                        <FormatListBulletedIcon />
                      </Avatar>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={(itinerary.stats.completedResponses / itinerary.stats.totalQuestions) * 100} 
                        sx={{ height: 6, borderRadius: 3 }} 
                        color="warning"
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Tabs Section */}
          <Paper sx={{ mb: 4 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="fullWidth"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Category Analysis" />
              <Tab label="School Performance" />
              <Tab label="District Summary" />
            </Tabs>
            
            {/* Category Analysis Tab */}
            {tabValue === 0 && (
              <Box sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  {/* Category Completion Chart */}
                  <Grid item xs={12} md={6}>
                    <Chart
                      options={categoryChartOptions}
                      series={[{
                        name: 'Completion Rate',
                        data: categoryStats.map(cat => cat.progress || 0)
                      }]}
                      type="bar"
                      height={350}
                    />
                  </Grid>
                  
                  {/* School Participation Chart */}
                  <Grid item xs={12} md={6}>
                    <Chart
                      options={schoolParticipationOptions}
                      series={[completedSchools, partialSchools, notStartedSchools]} // [Completed, Partial, Not Started]
                      type="donut"
                      height={350}
                    />
                  </Grid>
                  
                  {/* Category Stats Table */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Category Details
                    </Typography>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Category</TableCell>
                            <TableCell>Questions</TableCell>
                            <TableCell>Completed</TableCell>
                            <TableCell>Completion Rate</TableCell>
                            <TableCell align="right">Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {categoryStats.map((category) => (
                            <TableRow key={category.id}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  {CATEGORIES.find(cat => cat.id === category.id)?.icon}
                                  <Typography sx={{ ml: 1 }}>{category.name}</Typography>
                                </Box>
                              </TableCell>
                              <TableCell>{category.total}</TableCell>
                              <TableCell>{category.completed}</TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Box sx={{ width: '100%', mr: 1 }}>
                                    <LinearProgress
                                      variant="determinate"
                                      value={category.progress}
                                      sx={{ height: 8, borderRadius: 5 }}
                                    />
                                  </Box>
                                  <Box sx={{ minWidth: 35 }}>
                                    <Typography variant="body2" color="text.secondary">
                                      {category.progress}%
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Button 
                                  size="small" 
                                  component={Link}
                                  href={`/dashboard/admin/rtp/itineraries/${itineraryId}/questions/${category.id}`}
                                >
                                  View Questions
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* School Performance Tab */}
            {tabValue === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  School Responses
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>School Name</TableCell>
                        <TableCell>District</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Submission Date</TableCell>
                        <TableCell>Completion</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {schoolStats.map((school) => (
                        <TableRow key={school.id}>
                          <TableCell>{school.name}</TableCell>
                          <TableCell>{school.district}</TableCell>
                          <TableCell>
                            <Chip 
                              label={school.responseStatus} 
                              color={
                                school.responseStatus === 'Completed' ? 'success' : 
                                school.responseStatus === 'Partial' ? 'warning' : 'error'
                              }
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{school.submissionDate || 'Not submitted'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={school.completionRate}
                                  sx={{ height: 8, borderRadius: 5 }}
                                  color={
                                    school.completionRate >= 80 ? 'success' : 
                                    school.completionRate >= 50 ? 'warning' : 'error'
                                  }
                                />
                              </Box>
                              <Box sx={{ minWidth: 35 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {school.completionRate}%
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" component={Link} href={`#school-details-${school.id}`}>
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            
            {/* District Summary Tab */}
            {tabValue === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  District Performance
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>District Name</TableCell>
                        <TableCell>Total Schools</TableCell>
                        <TableCell>Responded Schools</TableCell>
                        <TableCell>Response Rate</TableCell>
                        <TableCell>Completion Rate</TableCell>
                        <TableCell align="right">Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {districtStats.map((district) => (
                        <TableRow key={district.id}>
                          <TableCell>{district.name}</TableCell>
                          <TableCell>{district.schools}</TableCell>
                          <TableCell>{district.responded}</TableCell>
                          <TableCell>
                            {Math.round((district.responded / district.schools) * 100)}%
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box sx={{ width: '100%', mr: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={district.completionRate}
                                  sx={{ height: 8, borderRadius: 5 }}
                                  color={
                                    district.completionRate >= 80 ? 'success' : 
                                    district.completionRate >= 50 ? 'warning' : 'error'
                                  }
                                />
                              </Box>
                              <Box sx={{ minWidth: 35 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {district.completionRate}%
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Button size="small" component={Link} href={`#district-details-${district.id}`}>
                              View Details
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
          
          {/* Questions Summary Section */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                Questions Overview
              </Typography>
              <Button 
                variant="contained"
                color="primary"
                component={Link}
                href={`/dashboard/admin/rtp/itineraries/${itineraryId}/questions`}
                startIcon={<FormatListBulletedIcon />}
              >
                Manage Questions
              </Button>
            </Box>
            
            <Typography variant="body2" paragraph>
              There are a total of <strong>{itinerary.stats.totalQuestions}</strong> questions across <strong>{categoryStats.length}</strong> categories in this itinerary.
              Click on the button above to manage questions for each category, edit question details, or add new questions.
            </Typography>
            
            <Grid container spacing={2}>
              {categoryStats.map((category, index) => (
                <Grid item xs={12} sm={6} md={3} key={category.id}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ color: 'primary.main', mr: 1 }}>
                          {CATEGORIES.find(cat => cat.id === category.id)?.icon}
                        </Box>
                        <Typography variant="h6" noWrap>
                          {category.name}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {category.total} questions
                      </Typography>
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={category.progress} 
                          sx={{ height: 8, borderRadius: 5 }} 
                        />
                      </Box>
                      <Typography variant="body2">
                        {category.completed} of {category.total} answered ({category.progress}%)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </>
      )}
    </Container>
  );
}