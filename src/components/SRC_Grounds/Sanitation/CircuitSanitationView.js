'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import Wc from '@mui/icons-material/Wc';
import WaterDrop from '@mui/icons-material/WaterDrop';
import Delete from '@mui/icons-material/Delete';
import Sanitizer from '@mui/icons-material/Sanitizer';
import HelpOutline from '@mui/icons-material/HelpOutline';
import Bathtub from '@mui/icons-material/Bathtub';
import CleaningServices from '@mui/icons-material/CleaningServices';
import Shower from '@mui/icons-material/Shower';
import Wash from '@mui/icons-material/Wash';

// Re-use or adapt MEASURE_ITEMS and getItemDisplay from SchoolSanitationView.js
const MEASURE_ITEMS = {
  'Toilet (Seat/Cubicle)': { icon: <Wc />, defaultStatus: 'Not Available' },
  'Urinal': { icon: <Wc />, defaultStatus: 'Not Available' },
  'Water': {
    icon: <WaterDrop />,
    defaultStatus: 'Not Available',
    statuses: {
      'Pipe borne': { label: 'Pipe Borne', color: 'primary', isAvailable: true },
      'Bore hole': { label: 'Bore Hole', color: 'info', isAvailable: true },
      'Well': { label: 'Well', color: 'info', isAvailable: true },
      'Stream': { label: 'Stream', color: 'warning', isAvailable: true },
      'Not Available': { label: 'Not Available', color: 'error', isAvailable: false },
    },
  },
  'Dustbin': { icon: <Delete />, defaultStatus: 'Not Available' },
  'Hand Washing Facility (Veronica Buckets)': { icon: <Wash />, defaultStatus: 'Not Available' },
  'Hand Washing Facility (Tap & Sink)': { icon: <Wash />, defaultStatus: 'Not Available' },
  'Bathroom (General)': { icon: <Bathtub />, defaultStatus: 'Not Available' },
  'Bathroom (Girls)': { icon: <Shower />, defaultStatus: 'Not Available' },
  'Incinerator': { icon: <CleaningServices />, defaultStatus: 'Not Available' },
  'Soap': { icon: <Sanitizer />, defaultStatus: 'Not Available' },
  'Default': { icon: <HelpOutline />, defaultStatus: 'Unknown' },
};

const getItemDisplay = (itemName, status) => {
  const itemConfig = MEASURE_ITEMS[itemName] || MEASURE_ITEMS['Default'];
  let effectiveStatus = status;

  // Handle problematic status values like the string "null" or actual null/undefined
  if (status === null || status === undefined || (typeof status === 'string' && status.toLowerCase() === 'null')) {
    effectiveStatus = itemConfig.defaultStatus; // Use the item's defined default status
  }

  let statusConfig = { label: effectiveStatus, color: 'default', isAvailable: false };

  if (itemConfig.statuses && itemConfig.statuses[effectiveStatus]) {
    statusConfig = itemConfig.statuses[effectiveStatus];
  } else if (effectiveStatus === 'Available') {
    statusConfig = { label: 'Available', color: 'success', isAvailable: true };
  } else if (effectiveStatus === 'Not Available') {
    statusConfig = { label: 'Not Available', color: 'error', isAvailable: false };
  } else if (effectiveStatus === 'Functional') {
    statusConfig = { label: 'Functional', color: 'success', isAvailable: true };
  } else if (effectiveStatus === 'Non-functional') {
    statusConfig = { label: 'Non-functional', color: 'error', isAvailable: false };
  } else if (effectiveStatus === 'Present') {
    statusConfig = { label: 'Present', color: 'success', isAvailable: true };
  } else if (effectiveStatus === 'Absent') {
    statusConfig = { label: 'Absent', color: 'error', isAvailable: false };
  }

  // Ensure label is not null/undefined if effectiveStatus somehow still results in that
  if (statusConfig.label === null || statusConfig.label === undefined) {
      statusConfig.label = itemConfig.defaultStatus || 'Unknown';
  }
  
  return { ...itemConfig, status: statusConfig };
};

const calculatePercentage = (count, total) => total > 0 ? Math.round((count / total) * 100) : 0;

const ItemStatusBreakdown = ({ aggregatedData }) => {
  if (!aggregatedData || Object.keys(aggregatedData).length === 0) {
    return <Typography variant="body2">No sanitation data to display.</Typography>;
  }

  return (
    <Grid container spacing={2}>
      {Object.entries(aggregatedData).map(([itemName, data]) => {
        const itemDisplayInfo = getItemDisplay(itemName, 'Available'); // Get base icon for default coloring
        
        let currentAvailableCount = 0;
        if (data && typeof data.statuses === 'object' && data.statuses !== null) {
            if (itemName === 'Water' && MEASURE_ITEMS['Water'] && MEASURE_ITEMS['Water'].statuses) {
                // Specific logic for Water item, using its defined available statuses
                Object.entries(data.statuses).forEach(([statusKey, count]) => {
                    if (MEASURE_ITEMS['Water'].statuses[statusKey]?.isAvailable) {
                        currentAvailableCount += (count || 0);
                    }
                });
            } else {
                // General logic for other items: sum counts if getItemDisplay deems the status as available
                Object.entries(data.statuses).forEach(([statusKey, count]) => {
                    const { status: statusConfig } = getItemDisplay(itemName, statusKey);
                    if (statusConfig.isAvailable) {
                        currentAvailableCount += (count || 0);
                    }
                });
            }
        }
        const availablePercent = calculatePercentage(currentAvailableCount, data?.total || 0);

        return (
          <Grid size={{ xs: 12, sm: 12, md: 6 }} key={itemName}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {itemDisplayInfo && itemDisplayInfo.icon ? 
                  React.cloneElement(itemDisplayInfo.icon, { sx: { fontSize: 24, mr: 1, color: currentAvailableCount > 0 ? 'success.main' : 'text.secondary' } }) :
                  <HelpOutline sx={{ fontSize: 24, mr: 1, color: 'text.secondary' }} /> /* Fallback icon */
                }
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>{itemName}</Typography>
              </Box>
              <Typography variant="body2">Total Items Reported: {data?.total || 0}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', my: 0.5 }}>
                <Typography variant="body2" sx={{ minWidth: '100px' }}>Available:</Typography>
                <LinearProgress variant="determinate" value={availablePercent} sx={{ flexGrow: 1, height: 10, borderRadius: 5, mr:1 }} color={availablePercent > 75 ? 'success' : availablePercent > 50 ? 'warning' : 'error'} />
                <Typography variant="body2">{availablePercent}% ({currentAvailableCount})</Typography>
              </Box>
              <Box sx={{pl:1, mt:1}}>
                {data && typeof data.statuses === 'object' && data.statuses !== null && Object.entries(data.statuses).map(([status, loopCount]) => {
                  const statusDisplay = getItemDisplay(itemName, status);
                  const statusPercent = calculatePercentage(loopCount || 0, data?.total || 0);
                  return (
                    <Box key={status} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Chip label={statusDisplay.status.label} color={statusDisplay.status.color} size="small" variant="outlined" sx={{mr:1, width: '120px', justifyContent: 'flex-start'}}/>
                        <Typography variant="caption" sx={{width: '60px'}}>{statusPercent}% ({loopCount || 0})</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Grid>
        );
      })}
    </Grid>
  );
};

const SchoolSanitationTable = ({ schools }) => {
  const sanitationItemNames = Object.keys(MEASURE_ITEMS).filter(name => name !== 'Default');

  if (!schools || schools.length === 0) {
    return <Typography sx={{p:2}}>No school data available for table view.</Typography>;
  }

  return (
    <TableContainer component={Paper} variant="outlined" sx={{m:1}}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', minWidth: '200px' }}>School Name</TableCell>
            {sanitationItemNames.map(itemName => (
              <TableCell key={itemName} align="center" sx={{ fontWeight: 'bold', whiteSpace: 'normal', wordBreak: 'break-word', maxWidth:'100px' }}>
                {itemName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {schools.map(school => (
            <TableRow key={school.school_id} hover>
              <TableCell component="th" scope="row">
                {school.school_name}
              </TableCell>
              {sanitationItemNames.map(itemName => {
                const itemSummary = school.sanitation_summary && school.sanitation_summary[itemName];
                let isAvailable = false;
                if (itemSummary && itemSummary.statuses) {
                  for (const [statusKey, count] of Object.entries(itemSummary.statuses)) {
                    if ((count || 0) > 0) {
                      const displayInfo = getItemDisplay(itemName, statusKey);
                      if (displayInfo.status.isAvailable) {
                        isAvailable = true;
                        break;
                      }
                    }
                  }
                }
                return (
                  <TableCell key={itemName} align="center">
                    {isAvailable ? <CheckIcon color="success" fontSize="small" /> : <CloseIcon color="error" fontSize="small" />}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default function CircuitSanitationView({ filterParams }) {
  const [circuitData, setCircuitData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('summary'); // 'summary' or 'table'

  const handleViewModeChange = (event) => {
    setViewMode(event.target.checked ? 'table' : 'summary');
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = new URLSearchParams({ ...filterParams, level: 'circuit' });
    try {
      const res = await fetch(`/api/school-report/grounds/sanitation?${q.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Error ${res.status}`);
      }
      const data = await res.json();
      setCircuitData(data);
    } catch (e) {
      console.error('Error fetching circuit sanitation data:', e);
      setError(e.message);
    }
    setLoading(false);
  }, [filterParams]);

  useEffect(() => {
    if (filterParams.year && filterParams.term && (filterParams.circuit_id || filterParams.district_id || filterParams.region_id)) {
        fetchData();
    }
  }, [fetchData, filterParams]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading circuit sanitation data...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  // If no circuits have data (e.g. after filtering or initial load)
  // and not loading and no error, show a message instead of just the toggle.
  if (circuitData.length === 0) {
    return (
        <Box sx={{p:2}}>
            <FormControlLabel
                control={<Switch checked={viewMode === 'table'} onChange={handleViewModeChange} />}
                label={viewMode === 'table' ? "Show Summary View" : "Show Table View"}
                sx={{ mb: 1, display: 'block' }}
            />
            <Typography>No sanitation data available for the selected filters.</Typography>
        </Box>
    );
  }

  if (!circuitData || circuitData.length === 0) {
    return <Alert severity="info" sx={{ m: 2 }}>No circuit sanitation data available for the selected filters.</Alert>;
  }

  return (
    <Box sx={{p:1}}>
        <FormControlLabel
            control={<Switch checked={viewMode === 'table'} onChange={handleViewModeChange} />}
            label={viewMode === 'table' ? "Show Summary View" : "Show Table View"}
            sx={{ mb: 1, ml: 1, display: 'block' }}
        />
      {circuitData.map((circuit) => (
        <Paper key={circuit.circuit_id} elevation={2} sx={{ mb: 3, p: 2 }}>
          <Typography variant="h5" gutterBottom>
            {circuit.circuit_name} Circuit
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {circuit.district_name} District, {circuit.region_name} Region
          </Typography>

          <Accordion sx={{mb:2}} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Circuit Level Sanitation Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
                          {viewMode === 'summary' ? (
              <ItemStatusBreakdown aggregatedData={circuit.aggregated_sanitation} />
            ) : (
              <SchoolSanitationTable schools={circuit.schools} />
            )}
            </AccordionDetails>
          </Accordion>

          <Typography variant="h6" gutterBottom sx={{mt:2}}>Schools in {circuit.circuit_name}</Typography>
          {circuit.schools && circuit.schools.length > 0 ? (
            circuit.schools.map((school) => (
              <Accordion key={school.school_id} sx={{mb:1}}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{school.school_name}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <ItemStatusBreakdown aggregatedData={school.sanitation_summary} />
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Typography>No school data available for this circuit.</Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
}
