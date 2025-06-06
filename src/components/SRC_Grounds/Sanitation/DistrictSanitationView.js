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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { WcIcon, WaterDropIcon, DeleteIcon, SanitizerIcon, HelpOutlineIcon, BathtubIcon, WaterIcon, CleaningServicesIcon, ShowerIcon, WashIcon } from '@mui/icons-material'; // Assuming these are available or defined elsewhere

// Re-use or adapt MEASURE_ITEMS and getItemDisplay from SchoolSanitationView.js
const MEASURE_ITEMS = {
  'Toilet (Seat/Cubicle)': { icon: <WcIcon />, defaultStatus: 'Not Available' },
  'Urinal': { icon: <WcIcon />, defaultStatus: 'Not Available' },
  'Water': {
    icon: <WaterDropIcon />,
    defaultStatus: 'Not Available',
    statuses: {
      'Pipe borne': { label: 'Pipe Borne', color: 'primary', isAvailable: true },
      'Bore hole': { label: 'Bore Hole', color: 'info', isAvailable: true },
      'Well': { label: 'Well', color: 'info', isAvailable: true },
      'Stream': { label: 'Stream', color: 'warning', isAvailable: true },
      'Not Available': { label: 'Not Available', color: 'error', isAvailable: false },
    },
  },
  'Dustbin': { icon: <DeleteIcon />, defaultStatus: 'Not Available' },
  'Hand Washing Facility (Veronica Buckets)': { icon: <WashIcon />, defaultStatus: 'Not Available' },
  'Hand Washing Facility (Tap & Sink)': { icon: <WashIcon />, defaultStatus: 'Not Available' },
  'Bathroom (General)': { icon: <BathtubIcon />, defaultStatus: 'Not Available' },
  'Bathroom (Girls)': { icon: <ShowerIcon />, defaultStatus: 'Not Available' },
  'Incinerator': { icon: <CleaningServicesIcon />, defaultStatus: 'Not Available' },
  'Soap': { icon: <SanitizerIcon />, defaultStatus: 'Not Available' },
  'Default': { icon: <HelpOutlineIcon />, defaultStatus: 'Unknown' },
};

const getItemDisplay = (itemName, status) => {
  const itemConfig = MEASURE_ITEMS[itemName] || MEASURE_ITEMS['Default'];
  let statusConfig = { label: status, color: 'default', isAvailable: false };

  if (itemConfig.statuses && itemConfig.statuses[status]) {
    statusConfig = itemConfig.statuses[status];
  } else if (status === 'Available') {
    statusConfig = { label: 'Available', color: 'success', isAvailable: true };
  } else if (status === 'Not Available') {
    statusConfig = { label: 'Not Available', color: 'error', isAvailable: false };
  } else if (status === 'Functional') {
    statusConfig = { label: 'Functional', color: 'success', isAvailable: true };
  } else if (status === 'Non-functional') {
    statusConfig = { label: 'Non-functional', color: 'error', isAvailable: false };
  } else if (status === 'Present') {
    statusConfig = { label: 'Present', color: 'success', isAvailable: true };
  } else if (status === 'Absent') {
    statusConfig = { label: 'Absent', color: 'error', isAvailable: false };
  }
  return { ...itemConfig, status: statusConfig };
};

const calculatePercentage = (count, total) => total > 0 ? Math.round((count / total) * 100) : 0;

const ItemStatusBreakdown = ({ aggregatedData, levelName }) => {
  if (!aggregatedData || Object.keys(aggregatedData).length === 0) {
    return <Typography variant="body2">No sanitation data for {levelName}.</Typography>;
  }

  return (
    <Grid container spacing={2}>
      {Object.entries(aggregatedData).map(([itemName, data]) => {
        const itemDisplayInfo = getItemDisplay(itemName, 'Available'); // Get base icon
        let availableCount = 0;
        if (itemName === 'Water') {
            Object.entries(data.statuses).forEach(([statusKey, count]) => {
                if (MEASURE_ITEMS['Water'].statuses[statusKey]?.isAvailable) {
                    availableCount += count;
                }
            });
        } else {
            availableCount = data.statuses['Available'] || data.statuses['Functional'] || data.statuses['Present'] || 0;
        }
        const availablePercent = calculatePercentage(availableCount, data.total);

        return (
          <Grid item xs={12} sm={6} md={4} key={itemName}>
            <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {React.cloneElement(itemDisplayInfo.icon, { sx: { fontSize: 24, mr: 1, color: itemDisplayInfo.status.isAvailable ? 'success.main' : 'text.secondary' } })}
                <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>{itemName}</Typography>
              </Box>
              <Typography variant="body2">Total: {data.total}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', my: 0.5 }}>
                <Typography variant="body2" sx={{ minWidth: '100px' }}>Available:</Typography>
                <LinearProgress variant="determinate" value={availablePercent} sx={{ flexGrow: 1, height: 10, borderRadius: 5, mr:1 }} color={availablePercent > 75 ? 'success' : availablePercent > 50 ? 'warning' : 'error'} />
                <Typography variant="body2">{availablePercent}% ({availableCount})</Typography>
              </Box>
              <Box sx={{pl:1, mt:1}}>
                {Object.entries(data.statuses).map(([status, count]) => {
                  const statusDisplay = getItemDisplay(itemName, status);
                  const statusPercent = calculatePercentage(count, data.total);
                  return (
                    <Box key={status} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Chip label={statusDisplay.status.label} color={statusDisplay.status.color} size="small" variant="outlined" sx={{mr:1, width: '120px', justifyContent: 'flex-start'}}/>
                        <Typography variant="caption" sx={{width: '60px'}}>{statusPercent}% ({count})</Typography>
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

export default function DistrictSanitationView({ filterParams }) {
  const [districtData, setDistrictData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const q = new URLSearchParams({ ...filterParams, level: 'district' });
    try {
      const res = await fetch(`/api/school-report/grounds/sanitation?${q.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Error ${res.status}`);
      }
      const data = await res.json();
      setDistrictData(data);
    } catch (e) {
      console.error('Error fetching district sanitation data:', e);
      setError(e.message);
    }
    setLoading(false);
  }, [filterParams]);

  useEffect(() => {
    if (filterParams.year && filterParams.term && (filterParams.district_id || filterParams.region_id)) {
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

  if (!districtData || districtData.length === 0) {
    return <Alert severity="info" sx={{ m: 2 }}>No district sanitation data available for the selected filters.</Alert>;
  }

  return (
    <Box sx={{ p: 2 }}>
      {districtData.map((district) => (
        <Paper key={district.district_id} elevation={2} sx={{ mb: 3, p: 2 }}>
          <Typography variant="h5" gutterBottom>
            {district.district_name} District
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            {district.region_name} Region
          </Typography>

          <Accordion sx={{mb:2}} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">District Level Sanitation Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ItemStatusBreakdown aggregatedData={district.aggregated_sanitation} levelName={district.district_name} />
            </AccordionDetails>
          </Accordion>

          <Typography variant="h6" gutterBottom sx={{mt:2}}>Circuits in {district.district_name}</Typography>
          {district.circuits && district.circuits.length > 0 ? (
            district.circuits.map((circuit) => (
              <Accordion key={circuit.circuit_id} sx={{mb:1}}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{circuit.circuit_name} Circuit</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <ItemStatusBreakdown aggregatedData={circuit.aggregated_sanitation_summary} levelName={circuit.circuit_name} />
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Typography>No circuit data available for this district.</Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
}
