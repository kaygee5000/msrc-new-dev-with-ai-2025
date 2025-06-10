'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Switch,
  FormControlLabel
} from '@mui/material';
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
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

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
  if (status === null || status === undefined || (typeof status === 'string' && status.toLowerCase() === 'null')) {
    effectiveStatus = itemConfig.defaultStatus;
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
        const itemDisplayInfo = getItemDisplay(itemName, 'Available');
        let currentAvailableCount = 0;
        if (data && typeof data.statuses === 'object' && data.statuses !== null) {
            if (itemName === 'Water' && MEASURE_ITEMS['Water'] && MEASURE_ITEMS['Water'].statuses) {
                Object.entries(data.statuses).forEach(([statusKey, count]) => {
                    if (MEASURE_ITEMS['Water'].statuses[statusKey]?.isAvailable) {
                        currentAvailableCount += (count || 0);
                    }
                });
            } else {
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
                  <HelpOutline sx={{ fontSize: 24, mr: 1, color: 'text.secondary' }} />
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

const CircuitSanitationTable = ({ circuits }) => {
  const sanitationItemNames = Object.keys(MEASURE_ITEMS).filter(name => name !== 'Default');
  if (!circuits || circuits.length === 0) {
    return <Typography sx={{p:2}}>No circuit data available for table view.</Typography>;
  }
  return (
    <TableContainer component={Paper} variant="outlined" sx={{m:1}}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold', minWidth: '200px' }}>Circuit Name</TableCell>
            {sanitationItemNames.map(itemName => (
              <TableCell key={itemName} align="center" sx={{ fontWeight: 'bold', whiteSpace: 'normal', wordBreak: 'break-word', maxWidth:'100px' }}>
                {itemName}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {circuits.map(circuit => (
            <TableRow key={circuit.circuit_id} hover>
              <TableCell component="th" scope="row">
                {circuit.circuit_name}
              </TableCell>
              {sanitationItemNames.map(itemName => {
                const itemSummary = circuit.aggregated_sanitation_summary && circuit.aggregated_sanitation_summary[itemName];
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

export default function DistrictSanitationView({ filterParams, loadOnDemand = false, reportTitle = 'Sanitation' }) {
  const [districtLevelData, setDistrictLevelData] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [circuitsData, setCircuitsData] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [districtInfo, setDistrictInfo] = useState({});
  const [dataLoaded, setDataLoaded] = useState(!loadOnDemand);

  // NProgress integration
  useEffect(() => {
    if (loading) NProgress.start();
    else NProgress.done();
    return () => NProgress.done();
  }, [loading]);

  // On-demand UI logic
  if (loadOnDemand && !dataLoaded) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Button variant="contained" color="primary" onClick={() => { setDataLoaded(true); }} data-testid="load-btn">Load {reportTitle}</Button>
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
  if (!districtLevelData) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Alert severity="info">No data available.</Alert>
        <Button variant="outlined" onClick={() => { setDataLoaded(false); setTimeout(() => setDataLoaded(true), 50); }}>Refresh</Button>
      </Box>
    );
  }

  const handleViewModeChange = (event) => {
    setViewMode(event.target.checked ? 'table' : 'summary');
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    NProgress.start();
    const q = new URLSearchParams({ ...filterParams, level: 'district' });
    try {
      const res = await fetch(`/api/school-report/grounds/sanitation?${q.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Error ${res.status}`);
      }
      const data = await res.json();
      // API returns an array, but for district level with district_id, it should be one district
      setDistrictLevelData(data && data.length > 0 ? data[0] : null);
    } catch (e) {
      console.error('Error fetching district sanitation data:', e);
      setError(e.message);
    }
    setLoading(false);
  }, [filterParams]);

  useEffect(() => {
    if (filterParams.year && filterParams.term && filterParams.district_id) {
        fetchData();
    }
  }, [fetchData, filterParams]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading district sanitation data...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }
  
  if (!districtLevelData) {
    return (
        <Box sx={{p:2}}>
            <FormControlLabel
                control={<Switch checked={viewMode === 'table'} onChange={handleViewModeChange} />}
                label={viewMode === 'table' ? "Show Summary View" : "Show Table View"}
                sx={{ mb: 1, display: 'block' }}
            />
            <Typography>No sanitation data available for the selected district and filters.</Typography>
        </Box>
    );
  }

  return (
    <Box sx={{p:1}}>
        <Typography variant="h5" gutterBottom>
            {districtLevelData.district_name} District Sanitation Report
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {districtLevelData.region_name} Region
        </Typography>
        <FormControlLabel
            control={<Switch checked={viewMode === 'table'} onChange={handleViewModeChange} />}
            label={viewMode === 'table' ? "Show Summary View" : "Show Table View"}
            sx={{ mb: 2, display: 'block' }}
        />
      {viewMode === 'summary' ? (
        <ItemStatusBreakdown aggregatedData={districtLevelData.aggregated_sanitation} />
      ) : (
        <CircuitSanitationTable circuits={districtLevelData.circuits} />
      )}
    </Box>
  );
}
