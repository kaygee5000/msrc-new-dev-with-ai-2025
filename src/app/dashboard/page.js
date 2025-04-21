'use client';

import { useEffect, useState } from 'react';
import { 
  Card, CardContent, Typography, Grid, Box, 
  CircularProgress, Tabs, Tab, Paper, Divider,
  Drawer, List, ListItem, ListItemIcon, ListItemText,
  ListItemButton, Toolbar, AppBar, IconButton, Button
} from '@mui/material';
import { 
  PersonOutline, School, AccountBalance, 
  Business, Assessment, Event, PeopleAlt,
  Dashboard, Domain, LocationCity, Menu as MenuIcon,
  Groups, Settings, BarChart, ListAlt
} from '@mui/icons-material';
import Charts from '../../components/Charts';
import DataTable from '../../components/DataTable';
import Link from 'next/link';
import { formatDate, formatDateTime } from '@/utils/dates';

// Drawer width
const drawerWidth = 240;

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const dashboardResponse = await fetch('/api/dashboard/stats');
        const dashboardResult = await dashboardResponse.json();
        setDashboardData(dashboardResult);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setDashboardData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser]);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  // Sidebar menu items
  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
    { text: 'Regions', icon: <Domain />, path: '/dashboard/admin/regions' },
    { text: 'Districts', icon: <LocationCity />, path: '/dashboard/admin/districts' },
    { text: 'Circuits', icon: <Business />, path: '/dashboard/admin/circuits' },
    { text: 'Schools', icon: <School />, path: '/dashboard/admin/schools' },
    { text: 'Users', icon: <Groups />, path: '/dashboard/admin/users' },
    { text: 'Pregnancy & Re-entry', icon: <BarChart />, path: '/dashboard/admin/reentry' },
    { text: 'Reports', icon: <Assessment />, path: '/dashboard/reports' },
    { text: 'Analytics', icon: <BarChart />, path: '/dashboard/analytics' },
    { text: 'Submissions', icon: <ListAlt />, path: '/dashboard/submissions' },
    { text: 'Settings', icon: <Settings />, path: '/dashboard/settings' },
  ];

  // Generate drawer content
  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          MSRC Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <Link href={item.path} key={item.text} style={{ textDecoration: 'none', color: 'inherit' }}>
            <ListItem disablePadding>
              <ListItemButton selected={item.path === '/dashboard'}>
                <ListItemIcon>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          </Link>
        ))}
      </List>
    </div>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
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
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` }
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Dashboard
          </Typography>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
        }}
        open
      >
        {drawer}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` }
        }}
      >
        <Toolbar />
        <Typography variant="h4" gutterBottom>
          {currentUser.role === 'national' ? 'National Dashboard' : 
          currentUser.role === 'regional' ? 'Regional Dashboard' :
          currentUser.role === 'district' ? 'District Dashboard' : 'School Dashboard'}
        </Typography>
        
        {/* Entity Count Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {currentUser.role === 'national' && (
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
          
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
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
          
          <Grid item xs={12} sm={6} md={3}>
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
          
          <Grid item xs={12} sm={6} md={3}>
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
          
          <Grid item xs={12} sm={6} md={3}>
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
          
          <TabPanel value={currentTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Enrollment Distribution</Typography>
                <Charts 
                  options={generateEnrollmentChart().options}
                  series={generateEnrollmentChart().series}
                  type="pie"
                  height={350}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Enrollment Summary</Typography>
                <Card>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">Boys</Typography>
                        <Typography variant="h6">{enrollmentStats.total_boys || 0}</Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="body2" color="textSecondary">Girls</Typography>
                        <Typography variant="h6">{enrollmentStats.total_girls || 0}</Typography>
                      </Grid>
                      <Grid item xs={4}>
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
              <Grid item xs={12} md={6}>
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
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Facilitator Attendance Rate</Typography>
                <Charts 
                  options={generateFacilitatorChart().options}
                  series={generateFacilitatorChart().series}
                  type="radialBar"
                  height={350}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>Facilitator Metrics</Typography>
                <Card>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="textSecondary">Attendance Rate</Typography>
                        <Typography variant="h6">
                          {parseFloat(facilitatorStats.avg_facilitator_attendance || 0).toFixed(1)}%
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
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
              <Grid item xs={12}>
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
        
        {/* Latest Submissions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>Latest Submissions</Typography>
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
    </Box>
  );
};

export default DashboardPage;