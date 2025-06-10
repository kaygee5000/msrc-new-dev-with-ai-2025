'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  CardContent,
  Stack,
  Tooltip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import GroupsIcon from '@mui/icons-material/Groups';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import CampaignIcon from '@mui/icons-material/Campaign';
import EventIcon from '@mui/icons-material/Event';
import HandshakeIcon from '@mui/icons-material/Handshake';
import SupportIcon from '@mui/icons-material/Support';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const DataDisplayTable = ({ data, title }) => {
  if (!data || data.length === 0) return <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>No data for {title}.</Typography>;
  const headers = Object.keys(data[0]).filter(key => typeof data[0][key] !== 'object');
  return (
    <TableContainer component={Paper} sx={{ mb: 3 }} variant="outlined">
      <Table size="small">
        <TableHead sx={{ backgroundColor: 'grey.100' }}>
          <TableRow>
            {headers.map(h => (
              <TableCell key={h} sx={{ fontWeight: 'bold' }}>
                {h.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i} hover>
              {headers.map(h => (
                <TableCell key={`${i}-${h}`}>{String(row[h])}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

// Mapping of community involvement activities to their display properties
const ACTIVITY_ITEMS = {
  'PTA Meetings': {
    icon: <MeetingRoomIcon sx={{ fontSize: 56 }} />,
    category: 'meetings',
    color: 'primary'
  },
  'Community Outreach': {
    icon: <CampaignIcon sx={{ fontSize: 56 }} />,
    category: 'outreach',
    color: 'info'
  },
  'Volunteer Activities': {
    icon: <VolunteerActivismIcon sx={{ fontSize: 56 }} />,
    category: 'volunteer',
    color: 'success'
  },
  'Parent Engagement': {
    icon: <GroupsIcon sx={{ fontSize: 56 }} />,
    category: 'engagement',
    color: 'secondary'
  },
  'Community Events': {
    icon: <EventIcon sx={{ fontSize: 56 }} />,
    category: 'events',
    color: 'warning'
  },
  'Partnership Programs': {
    icon: <HandshakeIcon sx={{ fontSize: 56 }} />,
    category: 'partnerships',
    color: 'info'
  },
  'Support Services': {
    icon: <SupportIcon sx={{ fontSize: 56 }} />,
    category: 'support',
    color: 'success'
  }
};

// Helper function to get display properties for an activity
const getActivityDisplay = (activityName, data) => {
  const activity = ACTIVITY_ITEMS[activityName] || {
    icon: <HelpOutlineIcon sx={{ fontSize: 56 }} />,
    category: 'other',
    color: 'default'
  };
  
  // Determine status based on data availability and values
  let status = 'active';
  let statusColor = activity.color;
  
  if (!data || Object.keys(data).length === 0) {
    status = 'no_data';
    statusColor = 'default';
  } else {
    // Check for positive engagement indicators
    const hasPositiveData = Object.values(data).some(value => 
      (typeof value === 'number' && value > 0) ||
      (typeof value === 'string' && value.toLowerCase().includes('yes'))
    );
    
    if (hasPositiveData) {
      status = 'active';
      statusColor = 'success';
    } else {
      status = 'inactive';
      statusColor = 'warning';
    }
  }
  
  return {
    icon: activity.icon,
    category: activity.category,
    color: activity.color,
    status,
    statusColor
  };
};

// Calculate summary stats from the data
const getSummaryStats = (data) => {
  if (!data || data.length === 0) return { active: 0, total: 0, percent: 0, status: 'No Data' };
  
  const total = data.length;
  const active = data.filter(item => {
    // Check if the item has meaningful engagement data
    const dataKeys = Object.keys(item).filter(key => 
      !['id', 'school_id', 'year', 'term', 'created_at', 'updated_at'].includes(key)
    );
    
    return dataKeys.some(key => {
      const value = item[key];
      return (typeof value === 'number' && value > 0) ||
             (typeof value === 'string' && value.toLowerCase().includes('yes'));
    });
  }).length;
  
  const percent = Math.round((active / total) * 100);
  
  let status = 'Needs Improvement';
  if (percent === 100) status = 'Excellent';
  else if (percent >= 75) status = 'Good';
  else if (percent >= 50) status = 'Fair';
  
  return { active, total, percent, status };
};

// Transform raw data into activity-based format
const transformDataToActivities = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  // For now, create sample activities based on common community involvement types
  // In a real implementation, this would map actual database fields to activities
  return [
    { name: 'PTA Meetings', data: rawData[0] },
    { name: 'Community Outreach', data: rawData[0] },
    { name: 'Volunteer Activities', data: rawData[0] },
    { name: 'Parent Engagement', data: rawData[0] },
  ];
};

import NProgress from 'nprogress';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';

export default function SchoolCommunityInvolvementView({ filterParams, loadOnDemand = false, reportTitle = 'Community Involvement' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [schoolInfo, setSchoolInfo] = useState({});
  const [dataLoaded, setDataLoaded] = useState(!loadOnDemand);
  const title = reportTitle || 'Community Involvement';

  const fetchData = useCallback(async () => {
    if (!filterParams?.school_id) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    const q = new URLSearchParams();
    ['school_id','year','term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    try {
      // Fetch school info
      const schoolRes = await fetch(`/api/schools/${filterParams.school_id}`);
      if (schoolRes.ok) {
        const schoolData = await schoolRes.json();
        setSchoolInfo(schoolData || {});
      }
      
      // Fetch community involvement data
      const res = await fetch(`/api/school-report/community-involvement/community-involvement?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      
      const responseData = await res.json();
      setData(responseData || []);
    } catch (e) {
      console.error(`Error fetching ${title}:`, e);
      setError(e.message);
      setData([]);
    }
    setLoading(false);
  }, [filterParams]);

  // NProgress integration
  useEffect(() => {
    if (loading) NProgress.start();
    else NProgress.done();
    return () => NProgress.done();
  }, [loading]);

  // On-demand loading UI logic
  if (loadOnDemand && !dataLoaded) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Button variant="contained" color="primary" onClick={() => setDataLoaded(true)}>
          Load {title}
        </Button>
      </Box>
    );
  }
  if (loading) {
    return (
      <Box sx={{ p: 2 }}>
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={200} />
      </Box>
    );
  }
  if (error) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={() => { setDataLoaded(false); setTimeout(() => setDataLoaded(true), 50); }}>Retry</Button>
      </Box>
    );
  }
  if (!data || data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="info">No {title.toLowerCase()} data available.</Alert>
        <Button variant="outlined" onClick={() => { setDataLoaded(false); setTimeout(() => setDataLoaded(true), 50); }}>Refresh</Button>
      </Box>
    );
  }

  const activities = transformDataToActivities(data);
  const stats = getSummaryStats(data);

  // Handle view mode toggle
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <Box>
      {/* School info and metadata */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h5">{schoolInfo.name || 'School Report'}</Typography>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            aria-label="view mode"
          >
            <ToggleButton value="card" aria-label="card view">
              <GridViewIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <TableRowsIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">District</Typography>
            <Typography variant="body2">{schoolInfo.district || 'N/A'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Region</Typography>
            <Typography variant="body2">{schoolInfo.region || 'N/A'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Year</Typography>
            <Typography variant="body2">{filterParams.year || 'N/A'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Term</Typography>
            <Typography variant="body2">{filterParams.term || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary stats */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" gutterBottom>Community Involvement</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.active} of {stats.total} activities active
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h4" 
              color={
                stats.percent === 100 ? 'success.main' : 
                stats.percent >= 75 ? 'info.main' : 
                stats.percent >= 50 ? 'warning.main' : 'error.main'
              }
            >
              {stats.status}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.percent}% community engagement
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {viewMode === 'card' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {activities.map(({ name, data: activityData }, idx) => {
            const display = getActivityDisplay(name, activityData);
            
            return (
              <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    '&:hover': { boxShadow: 3 }, 
                    height: '100%',
                    bgcolor: display.statusColor === 'success' ? 'success.50' : 
                            display.statusColor === 'warning' ? 'warning.50' :
                            display.statusColor === 'error' ? 'error.50' : 
                            display.statusColor === 'primary' ? 'primary.50' : 
                            display.statusColor === 'info' ? 'info.50' : 'background.paper',
                    borderColor: display.statusColor === 'success' ? 'success.200' : 
                               display.statusColor === 'warning' ? 'warning.200' :
                               display.statusColor === 'error' ? 'error.200' : 
                               display.statusColor === 'primary' ? 'primary.200' : 
                               display.statusColor === 'info' ? 'info.200' : 'divider'
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                      {name}
                    </Typography>
                    
                    <Box my={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Box sx={{ 
                        position: 'relative',
                        color: display.statusColor === 'success' ? 'success.main' : 
                               display.statusColor === 'warning' ? 'warning.main' :
                               display.statusColor === 'error' ? 'error.main' : 
                               display.statusColor === 'primary' ? 'primary.main' : 
                               display.statusColor === 'info' ? 'info.main' : 'text.secondary'
                      }}>
                        {display.icon}
                      </Box>
                    </Box>
                    
                    <Chip
                      label={
                        display.status === 'active' ? 'Active' :
                        display.status === 'inactive' ? 'Inactive' : 'No Data'
                      }
                      color={display.statusColor}
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1, fontWeight: 'medium' }}
                    />
                  </CardContent>
                </Paper>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <DataDisplayTable data={data} title={title} />
      )}
    </Box>
  );
}

