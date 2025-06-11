'use client';

import { useEffect, useState } from 'react';
import { 
  Card, CardContent, Typography, Grid, Box, 
  Tabs, Tab, Paper, Divider,
  Button, Skeleton
} from '@mui/material';
import { 
  PersonOutline, School, AccountBalance, 
  Business, Assessment, Event, PeopleAlt
} from '@mui/icons-material';
import Charts from '../../components/Charts';
import DataTable from '../../components/DataTable';
import Link from 'next/link';
import { formatDate } from '@/utils/dates';
import Image from 'next/image';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress
NProgress.configure({ 
  showSpinner: false,
  minimum: 0.1,
  easing: 'ease',
  speed: 500
});

// Custom TabPanel component for the tabbed interface
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    name: 'Admin User',
    role: 'national',
    entityId: null
  });
  const [currentTab, setCurrentTab] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        NProgress.start();
        const dashboardResponse = await fetch('/api/dashboard/stats');
        const dashboardResult = await dashboardResponse.json();
        setDashboardData(dashboardResult);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(null);
      } finally {
        setLoading(false);
        NProgress.done();
      }
    };
    fetchData();
  }, [currentUser]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        {/* Summary Cards Skeleton */}
        <Box sx={{ mb: 2, mt: 1 }}>
          <Skeleton variant="text" width={300} height={40} />
        </Box>
        
        {/* Entity Count Cards Skeleton */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item}>
              <Card>
                <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="40%" height={30} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Submission Stats Skeleton */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((item) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item}>
              <Card>
                <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                  <Box sx={{ width: '100%' }}>
                    <Skeleton variant="text" width="60%" height={20} />
                    <Skeleton variant="text" width="40%" height={30} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
        
        {/* Analytics Tabs Skeleton */}
        <Paper sx={{ width: '100%', mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1 }}>
            <Skeleton variant="rectangular" width="70%" height={40} />
          </Box>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Skeleton variant="text" width="50%" height={30} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={350} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Skeleton variant="text" width="50%" height={30} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" width="100%" height={350} />
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
    );
  }

  // Add null check for user
  if (!currentUser || !currentUser.id) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Typography variant="h6" color="error" gutterBottom>
          You must be logged in to access this page.
        </Typography>
        <Button variant="contained" color="primary" href="/login">
          Go to Login
        </Button>
      </Box>
    );
  }

  // Use new API structure
  const enrollmentStats = dashboardData?.stats?.enrollment || {};
  const attendanceStats = dashboardData?.stats?.attendance || {};
  const facilitatorStats = dashboardData?.stats?.facilitator || {};
  const activityLogs = dashboardData?.activityLogs || [];

  // Chart generators using new structure
  const generateEnrollmentChart = () => {
    return {
      options: {
        chart: { type: 'pie' },
        labels: ['Boys', 'Girls'],
        colors: ['#2196F3', '#FF4081']
      },
      series: [parseInt(enrollmentStats.total_boys || 0), parseInt(enrollmentStats.total_girls || 0)]
    };
  };
  const generateAttendanceChart = () => {
    return {
      options: {
        chart: { type: 'bar' },
        plotOptions: { bar: { horizontal: false, columnWidth: '55%' } },
        dataLabels: { enabled: false },
        xaxis: { categories: ['Boys', 'Girls', 'Overall'] },
        colors: ['#2196F3']
      },
      series: [{
        name: 'Attendance Rate (%)',
        data: [
          parseFloat(attendanceStats.avg_boys_attendance || 0).toFixed(1),
          parseFloat(attendanceStats.avg_girls_attendance || 0).toFixed(1),
          parseFloat(((Number(attendanceStats.avg_boys_attendance || 0) + Number(attendanceStats.avg_girls_attendance || 0)) / 2)).toFixed(1)
        ]
      }]
    };
  };
  const generateFacilitatorChart = () => {
    return {
      options: {
        chart: { type: 'radialBar' },
        plotOptions: { radialBar: { hollow: { size: '70%' } } },
        labels: ['Facilitator Attendance'],
        colors: ['#4CAF50']
      },
      series: [parseFloat(facilitatorStats.avg_facilitator_attendance || 0).toFixed(1)]
    };
  };

  return (
    <Box sx={{ width: '100%', p: 2, pt: 0 }}>
      <Box sx={{ mb: 2, mt: 1 }}>
        <Typography variant="h4">
          {currentUser.role === 'national' ? 'National Dashboard' : 
          currentUser.role === 'regional' ? 'Regional Dashboard' :
          currentUser.role === 'district' ? 'District Dashboard' : 'School Dashboard'}
        </Typography>
      </Box>
      
      {/* Entity Count Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {currentUser.role === 'national' && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <AccountBalance sx={{ fontSize: 40, mr: 2, color: '#673AB7' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>Regions</Typography>
                  <Typography variant="h5">{dashboardData?.counts?.regions || 0}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        {(currentUser.role === 'national' || currentUser.role === 'regional') && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Business sx={{ fontSize: 40, mr: 2, color: '#2196F3' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>Districts</Typography>
                  <Typography variant="h5">{dashboardData?.counts?.districts || 0}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        {(currentUser.role === 'national' || currentUser.role === 'regional' || currentUser.role === 'district') && (
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card>
              <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                <Assessment sx={{ fontSize: 40, mr: 2, color: '#FF9800' }} />
                <Box>
                  <Typography color="textSecondary" gutterBottom>Circuits</Typography>
                  <Typography variant="h5">{dashboardData?.counts?.circuits || 0}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <School sx={{ fontSize: 40, mr: 2, color: '#4CAF50' }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>Schools</Typography>
                <Typography variant="h5">{dashboardData?.counts?.schools || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Submission Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Event sx={{ fontSize: 40, mr: 2, color: '#E91E63' }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>Weekly Submissions</Typography>
                <Typography variant="h5">{dashboardData?.stats?.weekly?.total_submissions || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <Assessment sx={{ fontSize: 40, mr: 2, color: '#9C27B0' }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>Termly Submissions</Typography>
                <Typography variant="h5">{dashboardData?.stats?.termly?.total_submissions || 0}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <PersonOutline sx={{ fontSize: 40, mr: 2, color: '#3F51B5' }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>Total Enrollment</Typography>
                <Typography variant="h5">
                  {parseInt(enrollmentStats.total_boys || 0) + parseInt(enrollmentStats.total_girls || 0)}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleAlt sx={{ fontSize: 40, mr: 2, color: '#00BCD4' }} />
              <Box>
                <Typography color="textSecondary" gutterBottom>Avg. Attendance</Typography>
                <Typography variant="h5">
                  {parseFloat(
                    (Number(attendanceStats.avg_boys_attendance || 0) + 
                    Number(attendanceStats.avg_girls_attendance || 0)) / 2
                  ).toFixed(1)}%
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Analytics Tabs */}
      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          aria-label="SRC analytics tabs"
        >
          <Tab label="Enrollment" />
          <Tab label="Student Attendance" />
          <Tab label="Facilitator Attendance" />
          <Tab label="School Management" />
          <Tab label="Latest Activities" />
        </Tabs>
        
        {/* Tab panels with content */}
        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Enrollment Distribution</Typography>
              <Charts 
                options={generateEnrollmentChart().options}
                series={generateEnrollmentChart().series}
                type="pie"
                height={350}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Enrollment Summary</Typography>
              <Card>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="body2" color="textSecondary">Boys</Typography>
                      <Typography variant="h6">{enrollmentStats.total_boys || 0}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="body2" color="textSecondary">Girls</Typography>
                      <Typography variant="h6">{enrollmentStats.total_girls || 0}</Typography>
                    </Grid>
                    <Grid size={{ xs: 4 }}>
                      <Typography variant="body2" color="textSecondary">Total</Typography>
                      <Typography variant="h6">
                        {parseInt(enrollmentStats.total_boys || 0) + parseInt(enrollmentStats.total_girls || 0)}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={currentTab} index={1}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Attendance Rate</Typography>
              <Charts 
                options={generateAttendanceChart().options}
                series={generateAttendanceChart().series}
                type="bar"
                height={350}
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={currentTab} index={2}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Facilitator Attendance Rate</Typography>
              <Charts 
                options={generateFacilitatorChart().options}
                series={generateFacilitatorChart().series}
                type="radialBar"
                height={350}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h6" gutterBottom>Facilitator Metrics</Typography>
              <Card>
                <CardContent>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="textSecondary">Attendance Rate</Typography>
                      <Typography variant="h6">
                        {parseFloat(facilitatorStats.avg_facilitator_attendance || 0).toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="body2" color="textSecondary">Punctuality Rate</Typography>
                      <Typography variant="h6">
                        {parseFloat(facilitatorStats.avg_facilitator_punctuality || 0).toFixed(1)}%
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={currentTab} index={3}>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="h6" gutterBottom>School Performance Metrics</Typography>
              <Charts 
                options={{
                  chart: { type: 'radar' },
                  xaxis: { categories: ['Management', 'Grounds', 'Community'] }
                }}
                series={[{
                  name: 'Score',
                  data: [
                    parseFloat(dashboardData?.stats?.termly?.avg_management_score || 0).toFixed(1),
                    parseFloat(dashboardData?.stats?.termly?.avg_grounds_score || 0).toFixed(1),
                    parseFloat(dashboardData?.stats?.termly?.avg_community_score || 0).toFixed(1)
                  ]
                }]}
                type="radar"
                height={350}
              />
            </Grid>
          </Grid>
        </TabPanel>
        
        <TabPanel value={currentTab} index={4}>
          <Typography variant="h6" gutterBottom>Latest Activities</Typography>
          {activityLogs.length > 0 ? (
            <DataTable 
              columns={[
                { field: 'id', headerName: 'ID', width: 70 },
                { field: 'user_name', headerName: 'User', width: 150 },
                { field: 'action', headerName: 'Action', width: 200 },
                { field: 'description', headerName: 'Description', width: 300 },
                { 
                  field: 'created_at', 
                  headerName: 'Date', 
                  width: 180,
                  valueFormatter: (params) => formatDate(params.value)
                }
              ]}
              rows={activityLogs}
            />
          ) : (
            <Typography variant="body1">No recent activities found</Typography>
          )}
        </TabPanel>
      </Paper>
      
      {/* User Logs */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>User Logs</Typography>
        <Divider sx={{ mb: 2 }} />
        {dashboardData?.latestSubmissions && dashboardData.latestSubmissions.length > 0 ? (
          <DataTable 
            columns={[
              { field: 'id', headerName: 'ID', width: 70 },
              { field: 'school_name', headerName: 'School', width: 200 },
              { field: 'district_name', headerName: 'District', width: 150 },
              { field: 'region_name', headerName: 'Region', width: 150 },
              { field: 'week', headerName: 'Week', width: 100 },
              { field: 'term', headerName: 'Term', width: 100 },
              { 
                field: 'boys_enrollment',
                headerName: 'Boys',
                width: 100
              },
              { 
                field: 'girls_enrollment',
                headerName: 'Girls',
                width: 100
              },
              { 
                field: 'created_at', 
                headerName: 'Date', 
                width: 180,
                valueFormatter: (params) => formatDate(params.value)
              }
            ]}
            rows={dashboardData.latestSubmissions}
          />
        ) : (
          <Typography variant="body1">No recent submissions found</Typography>
        )}
      </Box>
    </Box>
  );
};

export default DashboardPage;