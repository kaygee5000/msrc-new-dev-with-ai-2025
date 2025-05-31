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
  Breadcrumbs, 
  Link,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  Chip,
  Alert,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import EntitySummary from '@/components/EntitySummary';

export default function SchoolDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState(0);

  // Fetch school data
  useEffect(() => {
    async function fetchSchool() {
      setLoading(true);
      try {
        // Fetch basic school info without statistics
        const res = await fetch(`/api/schools/${id}`);
        const data = await res.json();
        
        if (!data.success) {
          setError(data.error || 'Failed to fetch school details');
          setLoading(false);
          return;
        }
        
        setSchool(data.school);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching school:', error);
        setError('An error occurred while fetching school details');
        setLoading(false);
      }
    }
    
    fetchSchool();
  }, [id]);

  const handleEdit = () => {
    router.push(`/dashboard/admin/schools/edit/${id}`);
  };

  const handleBack = () => {
    router.push('/dashboard/admin/schools');
  };

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" p={4} minHeight="50vh">
      <CircularProgress />
    </Box>
  );
  
  if (error) return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
      <Alert severity="error">{error}</Alert>
      <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
        Back to Schools
      </Button>
    </Box>
  );
  
  if (!school) return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center" flexDirection="column" gap={2}>
      <Typography variant="h6">School not found.</Typography>
      <Button variant="contained" startIcon={<ArrowBackIcon />} onClick={handleBack}>
        Back to Schools
      </Button>
    </Box>
  );

  // Determine school type display
  const getSchoolTypeDisplay = (type) => {
    const types = {
      'primary': 'Primary School',
      'jhs': 'Junior High School',
      'primary_jhs': 'Primary & Junior High',
      'shs': 'Senior High School',
      'technical': 'Technical/Vocational School',
      'special': 'Special Education School'
    };
    return types[type] || type;
  };

  return (
    <Box p={3}>
      {/* Header with Breadcrumbs and Actions */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Breadcrumbs aria-label="breadcrumb">
          <Link 
            color="inherit" 
            href="/dashboard/admin"
            sx={{ display: 'flex', alignItems: 'center' }}
            onClick={(e) => {
              e.preventDefault();
              router.push('/dashboard/admin');
            }}
          >
            <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Dashboard
          </Link>
          <Link 
            color="inherit" 
            href="/dashboard/admin/schools"
            sx={{ display: 'flex', alignItems: 'center' }}
            onClick={(e) => {
              e.preventDefault();
              router.push('/dashboard/admin/schools');
            }}
          >
            <LocationOnIcon sx={{ mr: 0.5 }} fontSize="inherit" />
            Schools
          </Link>
          <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
            {school.name}
          </Typography>
        </Breadcrumbs>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBackIcon />} 
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>
          <Button 
            variant="contained" 
            startIcon={<EditIcon />} 
            onClick={handleEdit}
          >
            Edit
          </Button>
        </Box>
      </Box>
      
      {/* School Header Information */}
      <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{xs:12, md:8}}>
            <Box display="flex" alignItems="center" mb={1}>
              <SchoolIcon fontSize="large" sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h4">{school.name}</Typography>
            </Box>
            <Typography variant="subtitle1" gutterBottom>GES Code: {school.ges_code}</Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Type:</strong> {getSchoolTypeDisplay(school.type)}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Location:</strong> {school.address || 'Not specified'}
            </Typography>
            <Typography variant="body1" gutterBottom>
              <strong>Contact:</strong> {school.contact || 'Not specified'}
            </Typography>
          </Grid>
          <Grid size={{xs:12, md:4}}>
            <Box display="flex" flexDirection="column" alignItems="flex-end">
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="body2" mr={1}>Region:</Typography>
                <Chip label={school.region_name} size="small" />
              </Box>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="body2" mr={1}>District:</Typography>
                <Chip label={school.district_name} size="small" />
              </Box>
              <Box display="flex" alignItems="center">
                <Typography variant="body2" mr={1}>Circuit:</Typography>
                <Chip label={school.circuit_name} size="small" />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* School Statistics */}
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>School Statistics</Typography>
      <EntitySummary 
        entityType="school"
        entityId={id}
      />
      
      {/* Tabs for additional information */}
      <Paper sx={{ mt: 4 }}>
        <Tabs
          value={tab}
          onChange={(e, newValue) => setTab(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          aria-label="school details tabs"
        >
          <Tab label="Details" />
          <Tab label="Staff" />
          <Tab label="Infrastructure" />
          <Tab label="Performance" />
        </Tabs>
        
        <Divider />
        
        <Box p={3}>
          {tab === 0 && (
            <Box>
              <Typography variant="h6" gutterBottom>School Details</Typography>
              <Grid container spacing={3}>
                <Grid size={{xs:12, md:6}}>
                  <Typography><strong>School Type:</strong> {getSchoolTypeDisplay(school.type)}</Typography>
                  <Typography><strong>GES Code:</strong> {school.ges_code || 'N/A'}</Typography>
                  <Typography><strong>EMIS Code:</strong> {school.emis_code || 'N/A'}</Typography>
                  <Typography><strong>Established:</strong> {school.year_established || 'N/A'}</Typography>
                </Grid>
                <Grid size={{xs:12, md:6}}>
                  <Typography><strong>Head Teacher:</strong> {school.head_teacher || 'N/A'}</Typography>
                  <Typography><strong>Contact Email:</strong> {school.email || 'N/A'}</Typography>
                  <Typography><strong>Contact Phone:</strong> {school.phone || 'N/A'}</Typography>
                  <Typography><strong>Status:</strong> {school.status || 'Active'}</Typography>
                </Grid>
              </Grid>
            </Box>
          )}
          
          {tab === 1 && (
            <Box>
              <Typography variant="h6" gutterBottom>Staff Information</Typography>
              <Typography>Staff information will be displayed here.</Typography>
            </Box>
          )}
          
          {tab === 2 && (
            <Box>
              <Typography variant="h6" gutterBottom>Infrastructure</Typography>
              <Typography>Infrastructure details will be displayed here.</Typography>
            </Box>
          )}
          
          {tab === 3 && (
            <Box>
              <Typography variant="h6" gutterBottom>Performance</Typography>
              <Typography>Performance metrics will be displayed here.</Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
