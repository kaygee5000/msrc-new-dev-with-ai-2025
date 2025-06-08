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
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import SchoolIcon from '@mui/icons-material/School';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
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

// Mapping of support grant types to their display properties
const SUPPORT_GRANT_TYPES = {
  'Government Grants': {
    icon: <AccountBalanceIcon sx={{ fontSize: 56 }} />,
    category: 'government',
    color: 'primary'
  },
  'Educational Funding': {
    icon: <SchoolIcon sx={{ fontSize: 56 }} />,
    category: 'education',
    color: 'info'
  },
  'Community Support': {
    icon: <VolunteerActivismIcon sx={{ fontSize: 56 }} />,
    category: 'community',
    color: 'secondary'
  },
  'Library Grants': {
    icon: <LocalLibraryIcon sx={{ fontSize: 56 }} />,
    category: 'library',
    color: 'success'
  },
  'Nutrition Programs': {
    icon: <RestaurantIcon sx={{ fontSize: 56 }} />,
    category: 'nutrition',
    color: 'warning'
  },
  'Health Programs': {
    icon: <HealthAndSafetyIcon sx={{ fontSize: 56 }} />,
    category: 'health',
    color: 'error'
  },
  'Financial Aid': {
    icon: <MonetizationOnIcon sx={{ fontSize: 56 }} />,
    category: 'financial',
    color: 'info'
  }
};

// Helper function to get display properties for grant type
const getGrantDisplay = (grantType, data) => {
  const grant = SUPPORT_GRANT_TYPES[grantType] || {
    icon: <HelpOutlineIcon sx={{ fontSize: 56 }} />,
    category: 'other',
    color: 'default'
  };
  
  // Determine grant status based on data
  let status = 'received';
  let statusColor = grant.color;
  
  if (!data || Object.keys(data).length === 0) {
    status = 'no_data';
    statusColor = 'default';
  } else {
    // Check for grant status indicators in the data
    const hasActiveGrant = Object.values(data).some(value => 
      (typeof value === 'number' && value > 0) ||
      (typeof value === 'string' && (
        value.toLowerCase().includes('received') ||
        value.toLowerCase().includes('active') ||
        value.toLowerCase().includes('approved') ||
        value.toLowerCase().includes('funded') ||
        value.toLowerCase().includes('available')
      ))
    );
    
    const hasPendingGrant = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('pending') ||
        value.toLowerCase().includes('applied') ||
        value.toLowerCase().includes('processing') ||
        value.toLowerCase().includes('review')
      ))
    );
    
    const hasRejectedGrant = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('rejected') ||
        value.toLowerCase().includes('denied') ||
        value.toLowerCase().includes('expired') ||
        value.toLowerCase().includes('cancelled')
      ))
    );
    
    if (hasActiveGrant && !hasPendingGrant && !hasRejectedGrant) {
      status = 'active';
      statusColor = 'success';
    } else if (hasPendingGrant) {
      status = 'pending';
      statusColor = 'warning';
    } else if (hasRejectedGrant) {
      status = 'rejected';
      statusColor = 'error';
    }
  }
  
  return {
    icon: grant.icon,
    category: grant.category,
    color: grant.color,
    status,
    statusColor
  };
};

// Calculate summary stats from the data
const getSummaryStats = (data) => {
  if (!data || data.length === 0) return { active: 0, total: 0, percent: 0, status: 'No Data' };
  
  const total = data.length;
  const active = data.filter(item => {
    // Check if the grant is active or received
    const dataKeys = Object.keys(item).filter(key => 
      !['id', 'school_id', 'year', 'term', 'created_at', 'updated_at'].includes(key)
    );
    
    return dataKeys.some(key => {
      const value = item[key];
      return (typeof value === 'number' && value > 0) ||
             (typeof value === 'string' && (
               value.toLowerCase().includes('received') ||
               value.toLowerCase().includes('active') ||
               value.toLowerCase().includes('approved') ||
               value.toLowerCase().includes('funded') ||
               value.toLowerCase().includes('available')
             ));
    });
  }).length;
  
  const percent = Math.round((active / total) * 100);
  
  let status = 'No Support';
  if (percent === 100) status = 'Fully Supported';
  else if (percent >= 80) status = 'Well Supported';
  else if (percent >= 60) status = 'Adequately Supported';
  else if (percent >= 40) status = 'Partially Supported';
  
  return { active, total, percent, status };
};

// Transform raw data into grant-based format
const transformDataToGrants = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Create sample grant types based on common school support programs
  // In a real implementation, this would map actual database fields to grant types
  const grantTypes = [
    { name: 'Government Grants', data: rawData[0] },
    { name: 'Educational Funding', data: rawData[0] },
    { name: 'Community Support', data: rawData[0] },
    { name: 'Library Grants', data: rawData[0] },
    { name: 'Nutrition Programs', data: rawData[0] },
    { name: 'Health Programs', data: rawData[0] },
    { name: 'Financial Aid', data: rawData[0] },
  ];
  
  return grantTypes;
};

export default function SchoolSupportGrantsView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [schoolInfo, setSchoolInfo] = useState({});
  const title = 'Support Grants';

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
      
      // Fetch support grants data
      const res = await fetch(`/api/school-report/management/support-grants?${q}`);
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>Loading {title}...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (!data || data.length === 0) {
    return <Alert severity="info" sx={{ mt: 2 }}>No {title.toLowerCase()} data available.</Alert>;
  }

  const grantTypes = transformDataToGrants(data);
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
            <Typography variant="h6" gutterBottom>Support Grant Status</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.active} of {stats.total} grant types active
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h4" 
              color={
                stats.percent === 100 ? 'success.main' : 
                stats.percent >= 80 ? 'info.main' : 
                stats.percent >= 60 ? 'warning.main' : 'error.main'
              }
            >
              {stats.status}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.percent}% grant coverage
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {viewMode === 'card' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {grantTypes.map(({ name, data: grantData }, idx) => {
            const display = getGrantDisplay(name, grantData);
            
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
                        display.status === 'received' ? 'Received' :
                        display.status === 'pending' ? 'Pending' :
                        display.status === 'rejected' ? 'Rejected' : 'No Data'
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

