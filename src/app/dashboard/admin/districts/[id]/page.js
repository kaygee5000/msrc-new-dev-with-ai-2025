"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Grid, 
  Card, 
  CardContent,
  Button,
  Breadcrumbs,
  Link,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { 
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  School as SchoolIcon,
  People as PeopleIcon,
  Book as BookIcon,
  EventAvailable as EventAvailableIcon,
  Home as HomeIcon,
  LocationOn as LocationOnIcon,
} from '@mui/icons-material';
import EntitySummary from '@/components/EntitySummary';

export default function DistrictDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [district, setDistrict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);
  const [stats, setStats] = useState({
    totalSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    attendanceRate: 0,
    performance: 0
  });

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch district details
        const res = await fetch(`/api/districts/${id}`);
        const data = await res.json();
        setDistrict(data.district);

        // Fetch district statistics
        const statsRes = await fetch(`/api/districts/${id}/stats`);
        const statsData = await statsRes.json();
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching district data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleEdit = () => {
    router.push(`/dashboard/admin/districts/${id}/edit`);
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress />
    </Box>
  );

  if (!district) return (
    <Box p={4}>
      <Typography variant="h6" color="error">District not found.</Typography>
    </Box>
  );

  return (
    <Box p={1}>
        {/* Breadcrumbs */}
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Breadcrumbs>
            <Link 
              color="inherit" 
              href="/dashboard" 
              sx={{ display: 'flex', alignItems: 'center' }}
              onClick={(e) => {
                e.preventDefault();
                router.push('/dashboard');
              }}
            >
              <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Dashboard
            </Link>
            
            <Link 
              color="inherit" 
              href="/dashboard/admin/districts"
              sx={{ display: 'flex', alignItems: 'center' }}
              onClick={(e) => {
                e.preventDefault();
                router.push('/dashboard/admin/districts');
              }}
            >
              <LocationOnIcon sx={{ mr: 0.5 }} fontSize="inherit" />
              Districts
            </Link>
            
            <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
              {district?.name || 'District Details'}
            </Typography>
          </Breadcrumbs>
          <Box>
            <Button 
              startIcon={<ArrowBackIcon />} 
              onClick={() => router.back()}
              variant="outlined"
              sx={{ mr: 2 }}
            >
              Back to Districts
            </Button>
            <Button 
              variant="contained" 
              startIcon={<EditIcon />}
              onClick={handleEdit}
              size="small"
            >
              Edit
            </Button>
          </Box>
        </Box>


      <Typography variant="h4" gutterBottom>{district.name}</Typography>
      {/* <Typography variant="subtitle1" color="textSecondary" gutterBottom>
        District Code: {district.code || 'N/A'}
      </Typography> */}
      
      <Chip 
        label={district.region_name} 
        variant="outlined" 
        color="primary" 
        sx={{ mb: 3 }} 
      />

      <Paper sx={{ mb: 4, overflow: 'hidden' }}>
        <Tabs 
          value={tab} 
          onChange={(_, v) => setTab(v)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Overview" />
          <Tab label="Analytics" />
          <Tab label="Statistics" />
        </Tabs>

        <Box p={3}>
          {tab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>District Information</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <List>
                      <ListItem>
                        <ListItemText 
                          primary="Region" 
                          secondary={district.region_name || 'N/A'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="District Code" 
                          secondary={district.code || 'N/A'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Contact Email" 
                          secondary={district.contact_email || 'N/A'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="Contact Phone" 
                          secondary={district.contact_phone || 'N/A'} 
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Quick Stats</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Box textAlign="center" p={2} bgcolor="#f5f5f5" borderRadius={2}>
                          <SchoolIcon color="primary" fontSize="large" />
                          <Typography variant="h5">{stats.totalSchools}</Typography>
                          <Typography variant="body2" color="textSecondary">Schools</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center" p={2} bgcolor="#f5f5f5" borderRadius={2}>
                          <PeopleIcon color="primary" fontSize="large" />
                          <Typography variant="h5">{stats.totalStudents}</Typography>
                          <Typography variant="body2" color="textSecondary">Students</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center" p={2} bgcolor="#f5f5f5" borderRadius={2}>
                          <PeopleIcon color="primary" fontSize="large" />
                          <Typography variant="h5">{stats.totalTeachers}</Typography>
                          <Typography variant="body2" color="textSecondary">Teachers</Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Box textAlign="center" p={2} bgcolor="#f5f5f5" borderRadius={2}>
                          <EventAvailableIcon color="primary" fontSize="large" />
                          <Typography variant="h5">{stats.attendanceRate}%</Typography>
                          <Typography variant="body2" color="textSecondary">Avg. Attendance</Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>Description</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Typography variant="body1">
                      {district.description || 'No description available.'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {tab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Analytics Dashboard</Typography>
              <Typography color="textSecondary">
                Detailed analytics and visualizations coming soon.
              </Typography>
              {/* Placeholder for charts and analytics */}
              <Box mt={4} p={4} bgcolor="#f9f9f9" borderRadius={2} textAlign="center">
                <Typography>Analytics Dashboard Under Development</Typography>
              </Box>
            </Box>
          )}

          {tab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>District Statistics</Typography>
              <EntitySummary 
                entityType="district"
                entityId={id}
              />
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
