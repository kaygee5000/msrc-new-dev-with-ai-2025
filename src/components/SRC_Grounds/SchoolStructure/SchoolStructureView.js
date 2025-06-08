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
import HomeIcon from '@mui/icons-material/Home';
import SchoolIcon from '@mui/icons-material/School';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import BusinessIcon from '@mui/icons-material/Business';
import SportsIcon from '@mui/icons-material/Sports';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import ScienceIcon from '@mui/icons-material/Science';
import ComputerIcon from '@mui/icons-material/Computer';
import RestaurantIcon from '@mui/icons-material/Restaurant';
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

// Mapping of structure types to their display properties
const STRUCTURE_TYPES = {
  'Classrooms': {
    icon: <SchoolIcon sx={{ fontSize: 56 }} />,
    category: 'classroom',
    color: 'primary'
  },
  'Administrative Block': {
    icon: <BusinessIcon sx={{ fontSize: 56 }} />,
    category: 'admin',
    color: 'info'
  },
  'Library': {
    icon: <LocalLibraryIcon sx={{ fontSize: 56 }} />,
    category: 'library',
    color: 'secondary'
  },
  'Laboratory': {
    icon: <ScienceIcon sx={{ fontSize: 56 }} />,
    category: 'lab',
    color: 'success'
  },
  'Computer Lab': {
    icon: <ComputerIcon sx={{ fontSize: 56 }} />,
    category: 'computer',
    color: 'warning'
  },
  'Sports Facilities': {
    icon: <SportsIcon sx={{ fontSize: 56 }} />,
    category: 'sports',
    color: 'error'
  },
  'Dining Hall': {
    icon: <RestaurantIcon sx={{ fontSize: 56 }} />,
    category: 'dining',
    color: 'info'
  },
  'Staff Quarters': {
    icon: <HomeIcon sx={{ fontSize: 56 }} />,
    category: 'quarters',
    color: 'primary'
  },
  'Meeting Rooms': {
    icon: <MeetingRoomIcon sx={{ fontSize: 56 }} />,
    category: 'meeting',
    color: 'secondary'
  }
};

// Helper function to get display properties for structure type
const getStructureDisplay = (structureType, data) => {
  const structure = STRUCTURE_TYPES[structureType] || {
    icon: <HelpOutlineIcon sx={{ fontSize: 56 }} />,
    category: 'other',
    color: 'default'
  };
  
  // Determine structure condition based on data
  let status = 'good';
  let statusColor = structure.color;
  
  if (!data || Object.keys(data).length === 0) {
    status = 'no_data';
    statusColor = 'default';
  } else {
    // Check for structure condition indicators in the data
    const hasGoodCondition = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('good') ||
        value.toLowerCase().includes('excellent') ||
        value.toLowerCase().includes('new') ||
        value.toLowerCase().includes('renovated') ||
        value.toLowerCase().includes('functional')
      ))
    );
    
    const hasPoorCondition = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('poor') ||
        value.toLowerCase().includes('damaged') ||
        value.toLowerCase().includes('old') ||
        value.toLowerCase().includes('needs repair') ||
        value.toLowerCase().includes('dilapidated')
      ))
    );
    
    if (hasGoodCondition && !hasPoorCondition) {
      status = 'excellent';
      statusColor = 'success';
    } else if (hasGoodCondition && hasPoorCondition) {
      status = 'fair';
      statusColor = 'warning';
    } else if (hasPoorCondition) {
      status = 'poor';
      statusColor = 'error';
    }
  }
  
  return {
    icon: structure.icon,
    category: structure.category,
    color: structure.color,
    status,
    statusColor
  };
};

// Calculate summary stats from the data
const getSummaryStats = (data) => {
  if (!data || data.length === 0) return { good: 0, total: 0, percent: 0, status: 'No Data' };
  
  const total = data.length;
  const good = data.filter(item => {
    // Check if the structure is in good condition
    const dataKeys = Object.keys(item).filter(key => 
      !['id', 'school_id', 'year', 'term', 'created_at', 'updated_at'].includes(key)
    );
    
    return dataKeys.some(key => {
      const value = item[key];
      return (typeof value === 'string' && (
        value.toLowerCase().includes('good') ||
        value.toLowerCase().includes('excellent') ||
        value.toLowerCase().includes('new') ||
        value.toLowerCase().includes('renovated') ||
        value.toLowerCase().includes('functional')
      ));
    });
  }).length;
  
  const percent = Math.round((good / total) * 100);
  
  let status = 'Poor Infrastructure';
  if (percent === 100) status = 'Excellent Infrastructure';
  else if (percent >= 80) status = 'Good Infrastructure';
  else if (percent >= 60) status = 'Fair Infrastructure';
  else if (percent >= 40) status = 'Needs Improvement';
  
  return { good, total, percent, status };
};

// Transform raw data into structure-based format
const transformDataToStructures = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Create sample structure types based on common school infrastructure
  // In a real implementation, this would map actual database fields to structure types
  const structureTypes = [
    { name: 'Classrooms', data: rawData[0] },
    { name: 'Administrative Block', data: rawData[0] },
    { name: 'Library', data: rawData[0] },
    { name: 'Laboratory', data: rawData[0] },
    { name: 'Computer Lab', data: rawData[0] },
    { name: 'Sports Facilities', data: rawData[0] },
    { name: 'Dining Hall', data: rawData[0] },
    { name: 'Staff Quarters', data: rawData[0] },
    { name: 'Meeting Rooms', data: rawData[0] },
  ];
  
  return structureTypes;
};

export default function SchoolStructureView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [schoolInfo, setSchoolInfo] = useState({});
  const title = 'School Structure';

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
      
      // Fetch school structure data
      const res = await fetch(`/api/school-report/grounds/school-structure?${q}`);
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

  const structureTypes = transformDataToStructures(data);
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
            <Typography variant="h6" gutterBottom>Infrastructure Status</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.good} of {stats.total} structures in good condition
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
              {stats.percent}% infrastructure quality
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {viewMode === 'card' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {structureTypes.map(({ name, data: structureData }, idx) => {
            const display = getStructureDisplay(name, structureData);
            
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
                        display.status === 'excellent' ? 'Excellent' :
                        display.status === 'good' ? 'Good' :
                        display.status === 'fair' ? 'Fair' :
                        display.status === 'poor' ? 'Poor' : 'No Data'
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

