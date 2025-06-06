'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WcIcon from '@mui/icons-material/Wc';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import DeleteIcon from '@mui/icons-material/Delete';
import SanitizerIcon from '@mui/icons-material/Sanitizer';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import BathtubIcon from '@mui/icons-material/Bathtub';
import WaterIcon from '@mui/icons-material/Water';
import CleaningServicesIcon from '@mui/icons-material/CleaningServices';
import ShowerIcon from '@mui/icons-material/Shower';
import WashIcon from '@mui/icons-material/Wash';

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

// Mapping of measure items to their display properties
const MEASURE_ITEMS = {
  'Toilet (Seat/Cubicle)': {
    icon: <WcIcon sx={{ fontSize: 56 }} />,
    statuses: {
      'Available': { label: 'Available', color: 'success' },
      'Not Available': { label: 'Not Available', color: 'error' },
      'Not Functioning': { label: 'Not Functioning', color: 'warning' }
    }
  },
  'Urinal': {
    icon: <BathtubIcon sx={{ fontSize: 56 }} />,
    statuses: {
      'Available': { label: 'Available', color: 'success' },
      'Not Available': { label: 'Not Available', color: 'error' },
      'Not Functioning': { label: 'Not Functioning', color: 'warning' }
    }
  },
  'Water': {
    icon: <WaterIcon sx={{ fontSize: 56, color: 'primary.main' }} />,
    statuses: {
      'Pipe borne': { label: 'Pipe Borne', color: 'primary', isAvailable: true },
      'Bore hole': { label: 'Bore Hole', color: 'info', isAvailable: true },
      'Well': { label: 'Well', color: 'info', isAvailable: true },
      'Stream': { label: 'Stream', color: 'info', isAvailable: true },
      'Not Available': { label: 'Not Available', color: 'error', isAvailable: false }
    }
  },
  'Dustbins': {
    icon: <DeleteIcon sx={{ fontSize: 56 }} />,
    statuses: {
      'Available': { label: 'Available', color: 'success' },
      'Not Available': { label: 'Not Available', color: 'error' },
      'Not Functioning': { label: 'Not Functioning', color: 'warning' }
    }
  },
  'Veronica Buckets': {
    icon: <WashIcon sx={{ fontSize: 56 }} />,
    statuses: {
      'Available': { label: 'Available', color: 'success' },
      'Not Available': { label: 'Not Available', color: 'error' },
      'Not Functioning': { label: 'Not Functioning', color: 'warning' }
    }
  },
  'Cleaning Services': {
    icon: <CleaningServicesIcon sx={{ fontSize: 56 }} />,
    statuses: {
      'Available': { label: 'Available', color: 'success' },
      'Not Available': { label: 'Not Available', color: 'error' },
      'Not Functioning': { label: 'Not Functioning', color: 'warning' }
    }
  },
  'Shower': {
    icon: <ShowerIcon sx={{ fontSize: 56 }} />,
    statuses: {
      'Available': { label: 'Available', color: 'success' },
      'Not Available': { label: 'Not Available', color: 'error' },
      'Not Functioning': { label: 'Not Functioning', color: 'warning' }
    }
  }
};

// Helper function to get display properties for a measure item
const getItemDisplay = (itemName, status) => {
  const item = MEASURE_ITEMS[itemName] || {
    icon: <HelpOutlineIcon sx={{ fontSize: 56 }} />,
    statuses: {}
  };
  
  const statusInfo = item.statuses[status] || { 
    label: status || 'Unknown', 
    color: 'default' 
  };
  
  return {
    icon: item.icon,
    status: statusInfo
  };
};

// Calculate summary stats from the data
const getSummaryStats = (data) => {
  if (!data || data.length === 0) return { available: 0, total: 0, percent: 0, status: 'No Data' };
  
  const total = data.length;
  const available = data.filter(item => {
    // For water, consider all sources as available except "Not Available"
    if (item.measure_item === 'Water') {
      return item.status !== 'Not Available';
    }
    // For other items, only "Available" status is counted
    return item.status === 'Available';
  }).length;
  
  const percent = Math.round((available / total) * 100);
  
  let status = 'Needs Improvement';
  if (percent === 100) status = 'Excellent';
  else if (percent >= 75) status = 'Good';
  else if (percent >= 50) status = 'Fair';
  
  return { available, total, percent, status };
};

export default function SchoolSanitationView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [schoolInfo, setSchoolInfo] = useState({});
  const title = 'Sanitation';

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
      
      // Fetch sanitation data
      const res = await fetch(`/api/school-report/grounds/sanitation?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      
      const responseData = await res.json();
      // Extract the sanitation_data_object from the first item if it exists
      setData(responseData[0]?.sanitation_data_object || []);
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
            <Typography variant="h6" gutterBottom>Sanitation Facilities</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.available} of {stats.total} items available
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
              {stats.percent}% of facilities in good condition
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {viewMode === 'card' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {data.map(({ measure_item, status }, idx) => {
          // Special handling for 5 items (3 on top, 2 on bottom)
          const isFiveItems = data.length === 5;
          const isFirstThree = isFiveItems && idx < 3;
          const isLastTwo = isFiveItems && idx >= 3;
          
          // Calculate grid size based on item count and position
          let gridSize = { xs: 6, sm: 4, md: 3 };
          
          if (isFiveItems) {
            if (isFirstThree) {
              gridSize = { xs: 12, sm: 4 };
            } else if (isLastTwo) {
              gridSize = { xs: 12, sm: 6 };
            }
          } else if (data.length <= 4) {
            gridSize = { xs: 12, sm: 6 };
          } else if (data.length === 6) {
            gridSize = { xs: 6, sm: 4 };
          }
          
          return (
            <Grid key={idx} size={gridSize}>
            <Paper 
              variant="outlined" 
              sx={{ 
                '&:hover': { boxShadow: 3 }, 
                height: '100%',
                bgcolor: getItemDisplay(measure_item, status).status.color === 'success' ? 'success.50' : 
                        getItemDisplay(measure_item, status).status.color === 'warning' ? 'warning.50' :
                        getItemDisplay(measure_item, status).status.color === 'error' ? 'error.50' : 
                        getItemDisplay(measure_item, status).status.color === 'primary' ? 'primary.50' : 
                        getItemDisplay(measure_item, status).status.color === 'info' ? 'info.50' : 'background.paper',
                borderColor: getItemDisplay(measure_item, status).status.color === 'success' ? 'success.200' : 
                           getItemDisplay(measure_item, status).status.color === 'warning' ? 'warning.200' :
                           getItemDisplay(measure_item, status).status.color === 'error' ? 'error.200' : 
                           getItemDisplay(measure_item, status).status.color === 'primary' ? 'primary.200' : 
                           getItemDisplay(measure_item, status).status.color === 'info' ? 'info.200' : 'divider'
              }}
            >
              <CardContent sx={{ textAlign: 'center' }}>
                <Tooltip title={`Status: ${status}`} arrow>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      {measure_item}
                    </Typography>
                    {status && (
                      <Chip 
                        label={measure_item === 'Water' ? 'Available' : getItemDisplay(measure_item, status).status.label}
                        color={getItemDisplay(measure_item, status).status.color}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    )}
                  </Box>
                </Tooltip>
                <Box my={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                  <Box sx={{ 
                    position: 'relative',
                    color: getItemDisplay(measure_item, status).status.color === 'success' ? 'success.main' : 
                           getItemDisplay(measure_item, status).status.color === 'warning' ? 'warning.main' :
                           getItemDisplay(measure_item, status).status.color === 'error' ? 'error.main' : 
                           getItemDisplay(measure_item, status).status.color === 'primary' ? 'primary.main' : 
                           getItemDisplay(measure_item, status).status.color === 'info' ? 'info.main' : 'text.secondary'
                  }}>
                    {getItemDisplay(measure_item, status).icon}
                  </Box>
                </Box>
                {measure_item === 'Water' ? (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary" display="block">Source:</Typography>
                    <Chip
                      label={getItemDisplay(measure_item, status).status.label}
                      color={getItemDisplay(measure_item, status).status.color || 'primary'}
                      variant="outlined"
                      size="small"
                      sx={{ fontWeight: 'medium' }}
                    />
                  </Box>
                ) : (
                  <Chip
                    label={getItemDisplay(measure_item, status).status.label}
                    color={getItemDisplay(measure_item, status).status.color}
                    variant="outlined"
                    size="small"
                    sx={{ mt: 2, fontWeight: 'medium' }}
                  />
                )}
              </CardContent>
            </Paper>
            </Grid>
          );
        })}
      </Grid>
    ) : (
      <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Condition</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map(({ measure_item, status }, idx) => {
              const itemDisplay = getItemDisplay(measure_item, status);
              return (
                <TableRow key={idx}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ 
                        color: itemDisplay.status.color === 'success' ? 'success.main' : 
                               itemDisplay.status.color === 'warning' ? 'warning.main' :
                               itemDisplay.status.color === 'error' ? 'error.main' : 
                               itemDisplay.status.color === 'primary' ? 'primary.main' : 
                               itemDisplay.status.color === 'info' ? 'info.main' : 'text.secondary'
                      }}>
                        {itemDisplay.icon}
                      </Box>
                      {measure_item}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {measure_item === 'Water' ? (
                      <Box>
                        <Typography variant="body2">Available</Typography>
                        <Typography variant="caption" color="text.secondary">Source: {status}</Typography>
                      </Box>
                    ) : status}
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={measure_item === 'Water' ? 'Available' : itemDisplay.status.label}
                      color={itemDisplay.status.color}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    )}
  </Box>
);
}
