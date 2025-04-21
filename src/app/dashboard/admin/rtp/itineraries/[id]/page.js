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
  const itineraryId = params.id;
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
        // In a real implementation, fetch from API
        // const response = await fetch(`/api/rtp/itineraries/${itineraryId}`);
        // const data = await response.json();
        // setItinerary(data.itinerary);
        
        // Simulate API response with mock data
        setTimeout(() => {
          const mockItinerary = {
            id: itineraryId,
            title: `Term 2 Sports Assessment ${new Date().getFullYear()}`,
            period: "Term",
            type: "Regular",
            year: new Date().getFullYear(),
            from_date: "2025-03-01",
            until_date: "2025-04-15",
            is_valid: true,
            description: "This itinerary assesses the implementation of sports programs across schools in the district for the second term of the school year.",
            stats: {
              totalSchools: 124,
              respondedSchools: 96,
              totalQuestions: 245,
              completedResponses: 187,
              responseRate: 77,
              completionRate: 65
            }
          };
          
          setItinerary(mockItinerary);
          
          // Mock category statistics
          setCategoryStats([
            { id: 1, name: 'School Output Indicators', total: 65, completed: 48, progress: 74 },
            { id: 2, name: 'District Output Indicators', total: 45, completed: 38, progress: 84 },
            { id: 3, name: 'Consolidated Checklist', total: 75, completed: 62, progress: 83 },
            { id: 4, name: 'Partners in Play', total: 60, completed: 39, progress: 65 }
          ]);
          
          // Mock school statistics
          setSchoolStats([
            { id: 1, name: 'Accra Basic School', district: 'Accra', responseStatus: 'Completed', submissionDate: '2025-03-15', completionRate: 100 },
            { id: 2, name: 'Tema Elementary', district: 'Tema', responseStatus: 'Partial', submissionDate: '2025-03-18', completionRate: 78 },
            { id: 3, name: 'Kumasi Middle School', district: 'Kumasi', responseStatus: 'Completed', submissionDate: '2025-03-10', completionRate: 95 },
            { id: 4, name: 'Takoradi Primary', district: 'Takoradi', responseStatus: 'Not Started', submissionDate: null, completionRate: 0 },
            { id: 5, name: 'Cape Coast Elementary', district: 'Cape Coast', responseStatus: 'Completed', submissionDate: '2025-03-12', completionRate: 100 },
          ]);
          
          // Mock district statistics
          setDistrictStats([
            { id: 1, name: 'Accra', schools: 28, responded: 22, completionRate: 89 },
            { id: 2, name: 'Tema', schools: 32, responded: 26, completionRate: 76 },
            { id: 3, name: 'Kumasi', schools: 35, responded: 29, completionRate: 82 },
            { id: 4, name: 'Takoradi', schools: 15, responded: 9, completionRate: 65 },
            { id: 5, name: 'Cape Coast', schools: 14, responded: 10, completionRate: 78 },
          ]);
          
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error(err);
        setError('Failed to load itinerary data');
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
                return Math.round((completed / total) * 100) + '%';
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
                        name: 'Completion',
                        data: categoryStats.map(cat => cat.progress)
                      }]}
                      type="bar"
                      height={350}
                    />
                  </Grid>
                  
                  {/* School Participation Chart */}
                  <Grid item xs={12} md={6}>
                    <Chart
                      options={schoolParticipationOptions}
                      series={[60, 25, 15]} // Completed, Partial, Not Started
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
                                  href={`/dashboard/admin/rtp/itineraries/${itineraryId}/questions?category=${category.id}`}
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