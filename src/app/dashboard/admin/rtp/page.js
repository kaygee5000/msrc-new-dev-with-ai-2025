'use client';

import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  Grid,
  Card,
  CardContent,
  CardActions,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Divider,
  Stack,
  Link as MuiLink,
  Tooltip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TuneIcon from '@mui/icons-material/Tune';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PieChartIcon from '@mui/icons-material/PieChart';
import BarChartIcon from '@mui/icons-material/BarChart';
import SchoolIcon from '@mui/icons-material/School';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import GroupsIcon from '@mui/icons-material/Groups';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DownloadIcon from '@mui/icons-material/FileDownload';

import { createExportFilename, fetchAndExportCSV } from '@/utils/export';

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

export default function RTPOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itineraries, setItineraries] = useState([]);
  const [activeItinerary, setActiveItinerary] = useState(null);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    activeSchools: 0,
    responseRate: 0,
    completionRate: 0,
    categorySummary: {
      schoolOutput: { total: 0, completed: 0 },
      districtOutput: { total: 0, completed: 0 },
      consolidatedChecklist: { total: 0, completed: 0 },
      partnersInPlay: { total: 0, completed: 0 }
    }
  });

  const [exportAnchor, setExportAnchor] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  const handleExportClick = (event) => setExportAnchor(event.currentTarget);
  const handleExportClose = () => setExportAnchor(null);

  const exportData = async (type) => {
    setExportLoading(true);
    try {
      let apiUrl = '';
      let headers = [];
      let filenamePrefix = '';
      let isExcel = false;
      switch(type) {
        case 'output':
          apiUrl = `/api/rtp/export/output?itineraryId=${activeItinerary?.id || ''}&schoolType=all&level=all`;
          headers = [
            { key: 'schoolName', display: 'School' },
            { key: 'district', display: 'District' },
            { key: 'region', display: 'Region' },
            { key: 'indicator', display: 'Indicator' },
            { key: 'value', display: 'Value' }
          ];
          filenamePrefix = 'rtp-output';
          break;
        case 'outcome':
          apiUrl = `/api/rtp/export/outcome?itineraryId=${activeItinerary?.id || ''}&schoolType=all&surveyType=all`;
          headers = [
            { key: 'schoolName', display: 'School' },
            { key: 'indicator', display: 'Question' },
            { key: 'responseValue', display: 'Response' }
          ];
          filenamePrefix = 'rtp-outcome';
          break;
        case 'excel-output':
          apiUrl = `/api/rtp/export/outputxlsx?itineraryId=${activeItinerary?.id || ''}&schoolType=all&level=all`;
          filenamePrefix = 'rtp-output';
          isExcel = true;
          break;
        case 'excel-outcome':
          apiUrl = `/api/rtp/export/outcomexlsx?itineraryId=${activeItinerary?.id || ''}&schoolType=all&surveyType=all`;
          filenamePrefix = 'rtp-outcome';
          isExcel = true;
          break;
        default:
          return;
      }
      const filename = createExportFilename(filenamePrefix, { itinerary: activeItinerary?.id });
      if (isExcel) {
        const response = await fetch(apiUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename.replace('.csv', '.xlsx');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const result = await fetchAndExportCSV(apiUrl, headers, filename, resp => resp.data);
        if (!result.success) console.error(result.error);
      }
    } catch(err) {
      console.error(err);
    } finally {
      setExportLoading(false);
      handleExportClose();
    }
  };

  useEffect(() => {
    const fetchRTPData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch itineraries
        const itineraryRes = await fetch('/api/rtp/itineraries');
        const itineraryData = await itineraryRes.json();
        
        if (itineraryData.itineraries && itineraryData.itineraries.length > 0) {
          const sortedItineraries = itineraryData.itineraries.sort((a, b) => {
            // Sort by is_valid (active first), then by date (newest first)
            if (a.is_valid !== b.is_valid) return b.is_valid - a.is_valid;
            return new Date(b.from_date) - new Date(a.from_date);
          });
          
          setItineraries(sortedItineraries);
          setActiveItinerary(sortedItineraries.find(it => it.is_valid) || sortedItineraries[0]);
        }

        // Mock statistics data - in a real implementation, this would come from API
        setStats({
          totalSubmissions: 283,
          activeSchools: 124,
          responseRate: 78,
          completionRate: 65,
          categorySummary: {
            schoolOutput: { total: 245, completed: 187 },
            districtOutput: { total: 128, completed: 89 },
            consolidatedChecklist: { total: 187, completed: 112 },
            partnersInPlay: { total: 205, completed: 143 }
          }
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load RTP data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchRTPData();
  }, []);

  // Chart configuration for school participation by category
  const categoryChartOptions = {
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
      }
    },
    stroke: {
      width: 1,
      colors: ['#fff']
    },
    xaxis: {
      categories: CATEGORIES.map(cat => cat.name)
    },
    yaxis: {
      title: {
        text: 'Number of Schools'
      }
    },
    fill: {
      opacity: 1
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left'
    },
    colors: ['#4CAF50', '#FF9800'],
    title: {
      text: 'Participation by Category',
      align: 'center'
    }
  };

  // Chart configuration for submission trends
  const trendChartOptions = {
    chart: {
      type: 'line',
      height:350,
      toolbar: {
        show: false
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
    },
    yaxis: {
      title: {
        text: 'Submissions'
      }
    },
    colors: ['#2196F3', '#4CAF50', '#FF9800', '#9C27B0'],
    title: {
      text: 'Submission Trends',
      align: 'center'
    },
    markers: {
      size: 5
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <SportsSoccerIcon sx={{ mr: 2, fontSize: 35, color: 'primary.main' }} />
          Right to Play Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            color="primary" 
            component={Link}
            href="/dashboard/admin/rtp/itineraries"
            startIcon={<CalendarMonthIcon />}
          >
            Manage Itineraries
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            component={Link}
            href="/dashboard/admin/rtp/settings"
            startIcon={<TuneIcon />}
          >
            RTP Configuration
          </Button>
          <Button
            variant="outlined"
            color="primary"
            onClick={handleExportClick}
            startIcon={exportLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
          >
            Export Data
          </Button>
          <Menu
            anchorEl={exportAnchor}
            open={Boolean(exportAnchor)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={() => exportData('output')}>Export Output Indicators (CSV)</MenuItem>
            <MenuItem onClick={() => exportData('outcome')}>Export Outcome Indicators (CSV)</MenuItem>
            <Divider />
            <MenuItem onClick={() => exportData('excel-output')}>Export Output Indicators (Excel)</MenuItem>
            <MenuItem onClick={() => exportData('excel-outcome')}>Export Outcome Indicators (Excel)</MenuItem>
          </Menu>
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
          {/* Active Itinerary Section */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                Active Itinerary
              </Typography>
              <Button 
                component={Link}
                href="/dashboard/admin/rtp/itineraries"
                endIcon={<ArrowForwardIcon />}
                size="small"
              >
                View All Itineraries
              </Button>
            </Box>
            
            {activeItinerary ? (
              <Box>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={8}>
                    <Typography variant="h6" color="primary">
                      {activeItinerary.title}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Period:</strong> {activeItinerary.period} {activeItinerary.type} {activeItinerary.year} •
                      <strong> Date Range:</strong> {activeItinerary.from_date} to {activeItinerary.until_date}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, gap: 2 }}>
                      <Chip 
                        label={activeItinerary.is_valid ? "Active" : "Inactive"} 
                        color={activeItinerary.is_valid ? "success" : "default"} 
                        size="small" 
                      />
                      <Typography variant="body2" color="text.secondary">
                        Questions: <strong>245</strong> • 
                        Schools: <strong>124</strong> • 
                        Response Rate: <strong>78%</strong>
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Stack direction="row" spacing={1}>
                      <Button 
                        variant="contained" 
                        color="primary"
                        component={Link}
                        href={`/dashboard/admin/rtp/itineraries/${activeItinerary.id}`}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="outlined"
                        component={Link}
                        href={`/dashboard/admin/rtp/itineraries/${activeItinerary.id}/questions`}
                      >
                        Manage Questions
                      </Button>
                    </Stack>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 2 }} />
                
                {/* Category Progress Bars */}
                <Typography variant="h6" gutterBottom>Category Completion</Typography>
                <Grid container spacing={2}>
                  {CATEGORIES.map((category, index) => {
                    const categoryData = Object.values(stats.categorySummary)[index];
                    const progress = categoryData ? Math.round((categoryData.completed / categoryData.total) * 100) : 0;
                    
                    return (
                      <Grid item xs={12} md={6} key={category.id}>
                        <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ mr: 1, color: 'primary.main' }}>{category.icon}</Box>
                            <Typography variant="body2">{category.name}</Typography>
                          </Box>
                          <Typography variant="body2">
                            {categoryData ? `${categoryData.completed}/${categoryData.total}` : '0/0'}
                          </Typography>
                        </Box>
                        <Box sx={{ width: '100%', mr: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={progress} 
                            sx={{ 
                              height: 8, 
                              borderRadius: 5,
                              backgroundColor: 'rgba(0,0,0,0.1)'
                            }} 
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {progress}% Complete
                        </Typography>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            ) : (
              <Alert severity="info">
                No active itineraries found. 
                <Button 
                  component={Link}
                  href="/dashboard/admin/rtp/itineraries"
                  sx={{ ml: 2 }}
                  size="small"
                >
                  Create Itinerary
                </Button>
              </Alert>
            )}
          </Paper>
          
          {/* Summary Statistics */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline">
                        TOTAL SUBMISSIONS
                      </Typography>
                      <Typography variant="h4">
                        {stats.totalSubmissions}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'primary.light', p: 1 }}>
                      <AssessmentIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    <span style={{ color: '#4caf50', fontWeight: 'bold' }}>+12% </span>
                    since last month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline">
                        ACTIVE SCHOOLS
                      </Typography>
                      <Typography variant="h4">
                        {stats.activeSchools}
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'info.light', p: 1 }}>
                      <SchoolIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    <span style={{ color: '#4caf50', fontWeight: 'bold' }}>+5% </span>
                    since last month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="overline">
                        RESPONSE RATE
                      </Typography>
                      <Typography variant="h4">
                        {stats.responseRate}%
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'success.light', p: 1 }}>
                      <PieChartIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    <span style={{ color: '#4caf50', fontWeight: 'bold' }}>+8% </span>
                    since last month
                  </Typography>
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
                        {stats.completionRate}%
                      </Typography>
                    </Box>
                    <Avatar sx={{ bgcolor: 'warning.light', p: 1 }}>
                      <TrendingUpIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    <span style={{ color: '#f44336', fontWeight: 'bold' }}>-3% </span>
                    since last month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Charts Section */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Chart
                  options={categoryChartOptions}
                  series={[
                    {
                      name: 'Completed',
                      data: [
                        stats.categorySummary.schoolOutput.completed,
                        stats.categorySummary.districtOutput.completed,
                        stats.categorySummary.consolidatedChecklist.completed,
                        stats.categorySummary.partnersInPlay.completed
                      ]
                    },
                    {
                      name: 'Remaining',
                      data: [
                        stats.categorySummary.schoolOutput.total - stats.categorySummary.schoolOutput.completed,
                        stats.categorySummary.districtOutput.total - stats.categorySummary.districtOutput.completed,
                        stats.categorySummary.consolidatedChecklist.total - stats.categorySummary.consolidatedChecklist.completed,
                        stats.categorySummary.partnersInPlay.total - stats.categorySummary.partnersInPlay.completed
                      ]
                    }
                  ]}
                  type="bar"
                  height={350}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2 }}>
                <Chart
                  options={trendChartOptions}
                  series={[
                    {
                      name: 'School Output',
                      data: [30, 42, 65, 78, 86, 95, 103]
                    },
                    {
                      name: 'District Output',
                      data: [20, 35, 40, 60, 75, 78, 89]
                    },
                    {
                      name: 'Consolidated Checklist',
                      data: [25, 35, 45, 55, 65, 85, 112]
                    },
                    {
                      name: 'Partners in Play',
                      data: [40, 55, 65, 89, 100, 120, 143]
                    }
                  ]}
                  type="line"
                  height={350}
                />
              </Paper>
            </Grid>
          </Grid>
          
          {/* Category Cards Section */}
          <Typography variant="h5" sx={{ mb: 2 }}>RTP Categories</Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {CATEGORIES.map((category, index) => {
              const categoryData = Object.values(stats.categorySummary)[index];
              const progress = categoryData ? Math.round((categoryData.completed / categoryData.total) * 100) : 0;
              
              return (
                <Grid item xs={12} sm={6} lg={3} key={category.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" color="primary">
                          {category.name}
                        </Typography>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          {category.icon}
                        </Avatar>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Submission Progress
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={progress} 
                              sx={{ height: 10, borderRadius: 5 }} 
                            />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">
                              {progress}%
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <Typography variant="body2">
                        {categoryData ? categoryData.completed : 0} of {categoryData ? categoryData.total : 0} submissions completed
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        endIcon={<ArrowForwardIcon />}
                        component={Link}
                        href={activeItinerary ? `/dashboard/admin/rtp/itineraries/${activeItinerary.id}/questions?category=${category.id}` : '#'}
                        disabled={!activeItinerary}
                      >
                        View Details
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
          
          {/* Recent Itineraries Section */}
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h5" component="h2">
                Recent Itineraries
              </Typography>
              <Button 
                component={Link}
                href="/dashboard/admin/rtp/itineraries"
                endIcon={<ArrowForwardIcon />}
                size="small"
              >
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Period</TableCell>
                    <TableCell>Date Range</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {itineraries.slice(0, 5).map((itinerary) => (
                    <TableRow key={itinerary.id}>
                      <TableCell>
                        <Link href={`/dashboard/admin/rtp/itineraries/${itinerary.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <MuiLink component="span" color="primary" sx={{ cursor: 'pointer' }}>
                            {itinerary.title}
                          </MuiLink>
                        </Link>
                      </TableCell>
                      <TableCell>{itinerary.period} {itinerary.type} {itinerary.year}</TableCell>
                      <TableCell>{itinerary.from_date} - {itinerary.until_date}</TableCell>
                      <TableCell>
                        <Chip 
                          label={itinerary.is_valid ? "Active" : "Inactive"} 
                          color={itinerary.is_valid ? "success" : "default"} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={1} justifyContent="flex-end">
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              component={Link}
                              href={`/dashboard/admin/rtp/itineraries/${itinerary.id}`}
                            >
                              <BarChartIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Manage Questions">
                            <IconButton 
                              size="small" 
                              component={Link}
                              href={`/dashboard/admin/rtp/itineraries/${itinerary.id}/questions`}
                            >
                              <FormatListBulletedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </>
      )}
    </Container>
  );
}