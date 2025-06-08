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
import SecurityIcon from '@mui/icons-material/Security';
import LockIcon from '@mui/icons-material/Lock';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import LocalPoliceIcon from '@mui/icons-material/LocalPolice';
import GateIcon from '@mui/icons-material/Gate';
import WarningIcon from '@mui/icons-material/Warning';
import ShieldIcon from '@mui/icons-material/Shield';
import VisibilityIcon from '@mui/icons-material/Visibility';
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

// Mapping of security features to their display properties
const SECURITY_FEATURES = {
  'Perimeter Fencing': {
    icon: <GateIcon sx={{ fontSize: 56 }} />,
    category: 'perimeter',
    color: 'primary'
  },
  'Security Guards': {
    icon: <LocalPoliceIcon sx={{ fontSize: 56 }} />,
    category: 'personnel',
    color: 'info'
  },
  'CCTV Cameras': {
    icon: <CameraAltIcon sx={{ fontSize: 56 }} />,
    category: 'surveillance',
    color: 'secondary'
  },
  'Access Control': {
    icon: <LockIcon sx={{ fontSize: 56 }} />,
    category: 'access',
    color: 'warning'
  },
  'Lighting System': {
    icon: <VisibilityIcon sx={{ fontSize: 56 }} />,
    category: 'lighting',
    color: 'info'
  },
  'Emergency Systems': {
    icon: <WarningIcon sx={{ fontSize: 56 }} />,
    category: 'emergency',
    color: 'error'
  },
  'Security Protocols': {
    icon: <ShieldIcon sx={{ fontSize: 56 }} />,
    category: 'protocols',
    color: 'success'
  },
  'Overall Security': {
    icon: <SecurityIcon sx={{ fontSize: 56 }} />,
    category: 'overall',
    color: 'primary'
  }
};

// Helper function to get display properties for a security feature
const getFeatureDisplay = (featureName, data) => {
  const feature = SECURITY_FEATURES[featureName] || {
    icon: <HelpOutlineIcon sx={{ fontSize: 56 }} />,
    category: 'other',
    color: 'default'
  };
  
  // Determine security status based on data
  let status = 'secure';
  let statusColor = feature.color;
  
  if (!data || Object.keys(data).length === 0) {
    status = 'no_data';
    statusColor = 'default';
  } else {
    // Check for security indicators in the data
    const hasGoodSecurity = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('secure') ||
        value.toLowerCase().includes('good') ||
        value.toLowerCase().includes('adequate') ||
        value.toLowerCase().includes('functional') ||
        value.toLowerCase().includes('yes')
      ))
    );
    
    const hasPoorSecurity = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('insecure') ||
        value.toLowerCase().includes('poor') ||
        value.toLowerCase().includes('inadequate') ||
        value.toLowerCase().includes('broken') ||
        value.toLowerCase().includes('no')
      ))
    );
    
    if (hasGoodSecurity && !hasPoorSecurity) {
      status = 'secure';
      statusColor = 'success';
    } else if (hasGoodSecurity && hasPoorSecurity) {
      status = 'partial';
      statusColor = 'warning';
    } else if (hasPoorSecurity) {
      status = 'insecure';
      statusColor = 'error';
    }
  }
  
  return {
    icon: feature.icon,
    category: feature.category,
    color: feature.color,
    status,
    statusColor
  };
};

// Calculate summary stats from the data
const getSummaryStats = (data) => {
  if (!data || data.length === 0) return { secure: 0, total: 0, percent: 0, status: 'No Data' };
  
  const total = data.length;
  const secure = data.filter(item => {
    // Check if the security feature is adequate
    const dataKeys = Object.keys(item).filter(key => 
      !['id', 'school_id', 'year', 'term', 'created_at', 'updated_at'].includes(key)
    );
    
    return dataKeys.some(key => {
      const value = item[key];
      return (typeof value === 'string' && (
        value.toLowerCase().includes('secure') ||
        value.toLowerCase().includes('good') ||
        value.toLowerCase().includes('adequate') ||
        value.toLowerCase().includes('functional') ||
        value.toLowerCase().includes('yes')
      ));
    });
  }).length;
  
  const percent = Math.round((secure / total) * 100);
  
  let status = 'High Risk';
  if (percent === 100) status = 'Fully Secure';
  else if (percent >= 80) status = 'Well Secured';
  else if (percent >= 60) status = 'Adequately Secured';
  else if (percent >= 40) status = 'Partially Secured';
  
  return { secure, total, percent, status };
};

// Transform raw data into feature-based format
const transformDataToFeatures = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Create sample features based on common security aspects
  // In a real implementation, this would map actual database fields to features
  const features = [
    { name: 'Perimeter Fencing', data: rawData[0] },
    { name: 'Security Guards', data: rawData[0] },
    { name: 'CCTV Cameras', data: rawData[0] },
    { name: 'Access Control', data: rawData[0] },
    { name: 'Lighting System', data: rawData[0] },
    { name: 'Emergency Systems', data: rawData[0] },
    { name: 'Security Protocols', data: rawData[0] },
    { name: 'Overall Security', data: rawData[0] },
  ];
  
  return features;
};

export default function SchoolSecurityView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [schoolInfo, setSchoolInfo] = useState({});
  const title = 'Security';

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
      
      // Fetch security data
      const res = await fetch(`/api/school-report/grounds/security?${q}`);
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

  const features = transformDataToFeatures(data);
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
            <Typography variant="h6" gutterBottom>Security Status</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.secure} of {stats.total} security features adequate
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
              {stats.percent}% security coverage
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {viewMode === 'card' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {features.map(({ name, data: featureData }, idx) => {
            const display = getFeatureDisplay(name, featureData);
            
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
                        display.status === 'secure' ? 'Secure' :
                        display.status === 'partial' ? 'Partial' :
                        display.status === 'insecure' ? 'Insecure' : 'No Data'
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

