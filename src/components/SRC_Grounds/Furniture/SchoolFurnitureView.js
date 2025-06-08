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
import ChairIcon from '@mui/icons-material/Chair';
import TableRestaurantIcon from '@mui/icons-material/TableRestaurant';
import WeekendIcon from '@mui/icons-material/Weekend';
import StorageIcon from '@mui/icons-material/Storage';
import DeskIcon from '@mui/icons-material/Desk';
import SchoolIcon from '@mui/icons-material/School';
import HomeIcon from '@mui/icons-material/Home';
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

// Mapping of furniture types to their display properties
const FURNITURE_TYPES = {
  'Student Desks': {
    icon: <DeskIcon sx={{ fontSize: 56 }} />,
    category: 'desks',
    color: 'primary'
  },
  'Student Chairs': {
    icon: <ChairIcon sx={{ fontSize: 56 }} />,
    category: 'chairs',
    color: 'info'
  },
  'Teacher Desk': {
    icon: <TableRestaurantIcon sx={{ fontSize: 56 }} />,
    category: 'teacher',
    color: 'secondary'
  },
  'Storage Units': {
    icon: <StorageIcon sx={{ fontSize: 56 }} />,
    category: 'storage',
    color: 'warning'
  },
  'Classroom Furniture': {
    icon: <SchoolIcon sx={{ fontSize: 56 }} />,
    category: 'classroom',
    color: 'success'
  },
  'Office Furniture': {
    icon: <HomeIcon sx={{ fontSize: 56 }} />,
    category: 'office',
    color: 'info'
  },
  'Seating': {
    icon: <WeekendIcon sx={{ fontSize: 56 }} />,
    category: 'seating',
    color: 'primary'
  }
};

// Helper function to get display properties for furniture type
const getFurnitureDisplay = (furnitureType, data) => {
  const furniture = FURNITURE_TYPES[furnitureType] || {
    icon: <HelpOutlineIcon sx={{ fontSize: 56 }} />,
    category: 'other',
    color: 'default'
  };
  
  // Determine furniture condition based on data
  let status = 'good';
  let statusColor = furniture.color;
  
  if (!data || Object.keys(data).length === 0) {
    status = 'no_data';
    statusColor = 'default';
  } else {
    // Check for furniture condition indicators in the data
    const hasGoodCondition = Object.values(data).some(value => 
      (typeof value === 'number' && value > 0) ||
      (typeof value === 'string' && (
        value.toLowerCase().includes('good') ||
        value.toLowerCase().includes('excellent') ||
        value.toLowerCase().includes('adequate') ||
        value.toLowerCase().includes('functional') ||
        value.toLowerCase().includes('available')
      ))
    );
    
    const hasPoorCondition = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('poor') ||
        value.toLowerCase().includes('damaged') ||
        value.toLowerCase().includes('broken') ||
        value.toLowerCase().includes('inadequate') ||
        value.toLowerCase().includes('missing')
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
    icon: furniture.icon,
    category: furniture.category,
    color: furniture.color,
    status,
    statusColor
  };
};

// Calculate summary stats from the data
const getSummaryStats = (data) => {
  if (!data || data.length === 0) return { adequate: 0, total: 0, percent: 0, status: 'No Data' };
  
  const total = data.length;
  const adequate = data.filter(item => {
    // Check if the furniture is in good condition
    const dataKeys = Object.keys(item).filter(key => 
      !['id', 'school_id', 'year', 'term', 'created_at', 'updated_at'].includes(key)
    );
    
    return dataKeys.some(key => {
      const value = item[key];
      return (typeof value === 'number' && value > 0) ||
             (typeof value === 'string' && (
               value.toLowerCase().includes('good') ||
               value.toLowerCase().includes('excellent') ||
               value.toLowerCase().includes('adequate') ||
               value.toLowerCase().includes('functional') ||
               value.toLowerCase().includes('available')
             ));
    });
  }).length;
  
  const percent = Math.round((adequate / total) * 100);
  
  let status = 'Critical Need';
  if (percent === 100) status = 'Fully Furnished';
  else if (percent >= 80) status = 'Well Furnished';
  else if (percent >= 60) status = 'Adequately Furnished';
  else if (percent >= 40) status = 'Partially Furnished';
  
  return { adequate, total, percent, status };
};

// Transform raw data into furniture-based format
const transformDataToFurniture = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Create sample furniture types based on common school furniture
  // In a real implementation, this would map actual database fields to furniture types
  const furnitureTypes = [
    { name: 'Student Desks', data: rawData[0] },
    { name: 'Student Chairs', data: rawData[0] },
    { name: 'Teacher Desk', data: rawData[0] },
    { name: 'Storage Units', data: rawData[0] },
    { name: 'Classroom Furniture', data: rawData[0] },
    { name: 'Office Furniture', data: rawData[0] },
    { name: 'Seating', data: rawData[0] },
  ];
  
  return furnitureTypes;
};

export default function SchoolFurnitureView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [schoolInfo, setSchoolInfo] = useState({});
  const title = 'Furniture';

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
      
      // Fetch furniture data
      const res = await fetch(`/api/school-report/grounds/furniture?${q}`);
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

  const furnitureTypes = transformDataToFurniture(data);
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
            <Typography variant="h6" gutterBottom>Furniture Condition</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.adequate} of {stats.total} furniture types in good condition
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
              {stats.percent}% furniture adequacy
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {viewMode === 'card' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {furnitureTypes.map(({ name, data: furnitureData }, idx) => {
            const display = getFurnitureDisplay(name, furnitureData);
            
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

