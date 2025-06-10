'use client';

import React, { useState, useEffect, useCallback } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
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
  LinearProgress,
  Skeleton,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
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
          <Grid size={{ xs: 12, sm: 6, md: 4 }} key={itemName}>
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

export default function RegionSanitationView({ filterParams, loadOnDemand = false, reportTitle: initialReportTitle = 'Region Sanitation Report' }) {
  const [data, setData] = useState([]); // Renamed from regionData
  const [loading, setLoading] = useState(false); // Default to false, fetchData will set true
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const reportTitle = initialReportTitle;

  const fetchData = useCallback(async () => {
    if (!filterParams?.region_id) { // Moved early exit to the top
      setData([]);
      setError(null);
      setLoading(false);
      setDataLoaded(false);
      if (NProgress.isStarted()) NProgress.done();
      return;
    }

    NProgress.start();
    setLoading(true); // setError(null) is already here from above or will be set by NProgress start logic if needed
    setData([]); // Clear previous data before fetching new
    const q = new URLSearchParams({ ...filterParams, level: 'region' });
    try {
      const res = await fetch(`/api/school-report/grounds/sanitation?${q.toString()}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `Error ${res.status}`);
      }
      const fetchedData = await res.json();
      setData(fetchedData);
      setDataLoaded(true);
    } catch (e) {
      console.error(`Error fetching ${reportTitle}:`, e);
      setError(e.message || 'An unexpected error occurred.');
      setData([]); // Clear data on error
      setDataLoaded(true); // Mark as data fetch attempted
    }
    setLoading(false);
    NProgress.done();
  }, [filterParams, reportTitle]);

  useEffect(() => {
    if (loadOnDemand) {
      setData([]);
      setError(null);
      setLoading(false);
      setDataLoaded(false);
      if (NProgress.isStarted()) NProgress.done();
    } else {
      // Original condition for auto-fetch
      if (filterParams.year && filterParams.term && filterParams.region_id) {
        fetchData();
      } else {
        // If not loading on demand and params are insufficient, clear everything
        setData([]);
        setError(null);
        setLoading(false);
        setDataLoaded(false);
        if (NProgress.isStarted()) NProgress.done();
      }
    }
  }, [filterParams, loadOnDemand, fetchData]);

  // Helper for Skeleton
  const SkeletonItemStatusBreakdown = () => (
    <Grid container spacing={2}>
      {[...Array(2)].map((_, i) => ( // Show 2 skeleton items for brevity
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1 }} />
              <Skeleton variant="text" width="60%" />
            </Box>
            <Skeleton variant="text" width="40%" sx={{ mb: 0.5 }} />
            <Skeleton variant="rectangular" width="100%" height={10} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="80%" />
          </Paper>
        </Grid>
      ))}
    </Grid>
  );

  if (loadOnDemand && !dataLoaded && !loading && !error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 3, minHeight: 200 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {reportTitle}
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Click the button to load the {reportTitle.toLowerCase()} for the selected region.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchData}
            startIcon={<SanitizerIcon />}
          >
            Load {reportTitle}
          </Button>
        </Paper>
      </Box>
    );
  }

  if (loading) {
    if (!NProgress.isStarted()) NProgress.start();
    return (
      <Box sx={{ p: 2 }}>
        <Paper elevation={2} sx={{ mb: 3, p: 2 }}>
          <Skeleton variant="text" width="40%" height={40} sx={{ mb: 2 }} /> {/* Region Name */}
          
          {/* Region Summary Accordion Skeleton */}
          <Accordion sx={{mb:2}} defaultExpanded disabled>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Skeleton variant="text" width="60%" height={30} />
            </AccordionSummary>
            <AccordionDetails>
              <SkeletonItemStatusBreakdown />
            </AccordionDetails>
          </Accordion>

          <Skeleton variant="text" width="30%" height={30} sx={{mt:2, mb:1}} /> {/* "Districts in..." */}
          
          {/* District Accordions Skeleton */}
          {[...Array(2)].map((_, i) => (
            <Accordion key={i} sx={{mb:1}} disabled>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Skeleton variant="text" width="50%" height={24} />
              </AccordionSummary>
            </Accordion>
          ))}
        </Paper>
      </Box>
    );
  } else {
    if (NProgress.isStarted()) NProgress.done();
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 3, minHeight: 200 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchData} sx={{ml: 2}}>
            TRY AGAIN
          </Button>
        }>
          <Typography fontWeight="bold">{reportTitle} Error</Typography>
          {error}
        </Alert>
      </Box>
    );
  }

  // Note: Changed regionData to data here
  if (dataLoaded && !loading && (!data || data.length === 0)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 3, minHeight: 200 }}>
        <Alert severity="info" action={
          <Button color="inherit" size="small" onClick={fetchData} sx={{ml: 2}}>
            REFRESH DATA
          </Button>
        }>
          <Typography fontWeight="bold">No {reportTitle} Data</Typography>
          No {reportTitle.toLowerCase()} found for the selected filters.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {data.map((region) => (
        <Paper key={region.region_id} elevation={2} sx={{ mb: 3, p: 2 }}>
          <Typography variant="h5" gutterBottom>
            {region.region_name} Region
          </Typography>

          <Accordion sx={{mb:2}} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Region Level Sanitation Summary</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ItemStatusBreakdown aggregatedData={region.aggregated_sanitation} levelName={region.region_name} />
            </AccordionDetails>
          </Accordion>

          <Typography variant="h6" gutterBottom sx={{mt:2}}>Districts in {region.region_name}</Typography>
          {region.districts && region.districts.length > 0 ? (
            region.districts.map((district) => (
              <Accordion key={district.district_id} sx={{mb:1}}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{district.district_name} District</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <ItemStatusBreakdown aggregatedData={district.aggregated_sanitation_summary} levelName={district.district_name} />
                </AccordionDetails>
              </Accordion>
            ))
          ) : (
            <Typography>No district data available for this region.</Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
}
