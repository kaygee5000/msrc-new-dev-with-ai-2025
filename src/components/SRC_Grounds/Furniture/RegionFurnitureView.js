
import { useState, useEffect, useCallback } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
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
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Skeleton,
  Button
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import WcIcon from '@mui/icons-material/Wc';
import ShowerIcon from '@mui/icons-material/Shower';
import SanitizerIcon from '@mui/icons-material/Sanitizer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import DeskIcon from '@mui/icons-material/Desk';
import ChairIcon from '@mui/icons-material/Chair';
import SchoolIcon from '@mui/icons-material/School';
import EventSeatIcon from '@mui/icons-material/EventSeat';

// Import the enhanced DistrictFurnitureView for drill-down
import DistrictFurnitureView from './DistrictFurnitureView';

// DataDisplayTable component (can be reused or adapted)
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

// Mapping of furniture metrics to their display properties
const FURNITURE_METRICS = {
  'Desks': {
    icon: <DeskIcon sx={{ fontSize: 56 }} />,
    category: 'desks',
    color: 'primary'
  },
  'Chairs': {
    icon: <ChairIcon sx={{ fontSize: 56 }} />,
    category: 'chairs',
    color: 'info'
  },
  'Classroom Furniture': {
    icon: <SchoolIcon sx={{ fontSize: 56 }} />,
    category: 'classroom_furniture',
    color: 'secondary'
  },
  'Other Furniture': {
    icon: <EventSeatIcon sx={{ fontSize: 56 }} />,
    category: 'other_furniture',
    color: 'warning'
  }
};

// Helper function to get display properties for furniture metric
const getFurnitureDisplay = (metricType, data) => {
  const metric = FURNITURE_METRICS[metricType] || {
    icon: <HelpOutlineIcon sx={{ fontSize: 56 }} />,
    category: 'other',
    color: 'default'
  };
  
  let status = 'good';
  let statusColor = metric.color;
  
  if (!data || Object.keys(data).length === 0 || data.value === undefined) {
    status = 'no_data';
    statusColor = 'default';
  } else {
    const value = data.value; 
    if (value === 'Adequate') status = 'adequate';
    else if (value === 'Partial') status = 'partial';
    else status = 'inadequate';
    statusColor = status === 'adequate' ? 'success' : status === 'partial' ? 'warning' : 'error';
  }
  
  return {
    icon: metric.icon,
    category: metric.category,
    color: metric.color,
    status,
    statusColor
  };
};

// Calculate summary stats from the data
const getSummaryStats = (data) => {
  if (!data || data.length === 0) return { adequate: 0, partial: 0, inadequate: 0, total: 0, status: 'No Data' };
  
  let adequate = 0;
  let partial = 0;
  let inadequate = 0;
  let total = 0;

  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (!['id', 'school_id', 'school_name', 'circuit_id', 'circuit_name', 'district_id', 'district_name', 'year', 'term', 'created_at', 'updated_at'].includes(key)) {
        const value = item[key];
        if (typeof value === 'string') {
          total++;
          if (value === 'Adequate') adequate++;
          else if (value === 'Partial') partial++;
          else inadequate++;
        }
      }
    });
  });

  let status = 'Mixed Furniture';
  if (adequate === total && total > 0) status = 'Adequate Furniture';
  else if (inadequate === total && total > 0) status = 'Inadequate Furniture';
  
  return { adequate, partial, inadequate, total, status };
};

// Transform raw data into metric-based format for summary
const transformDataToMetrics = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Aggregate data for the region level
  const aggregatedData = {};
  rawData.forEach(item => {
    Object.keys(item).forEach(key => {
      if (!['id', 'school_id', 'school_name', 'circuit_id', 'circuit_name', 'district_id', 'district_name', 'year', 'term', 'created_at', 'updated_at'].includes(key)) {
        if (!aggregatedData[key]) {
          aggregatedData[key] = { adequate: 0, partial: 0, inadequate: 0, count: 0 };
        }
        if (typeof item[key] === 'string') {
          aggregatedData[key].count++;
          if (item[key] === 'Adequate') aggregatedData[key].adequate++;
          else if (item[key] === 'Partial') aggregatedData[key].partial++;
          else aggregatedData[key].inadequate++;
        }
      }
    });
  });

  const metricTypes = Object.keys(FURNITURE_METRICS).map(name => {
    const dataForType = aggregatedData[name.toLowerCase().replace(/ /g, '_')] || { count: 0 };
    let value;
    if (dataForType.count === 0) value = undefined;
    else if (dataForType.adequate === dataForType.count) value = 'Adequate';
    else if (dataForType.inadequate === dataForType.count) value = 'Inadequate';
    else value = 'Partial';
    
    return { name, data: { value } };
  });
  
  return metricTypes;
};

export default function RegionFurnitureView({ filterParams, loadOnDemand = false, reportTitle: initialReportTitle = 'Furniture Report' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [districtsData, setDistrictsData] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [regionInfo, setRegionInfo] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const reportTitle = initialReportTitle; // Use a const for reportTitle based on prop


  const fetchData = useCallback(async () => {
    NProgress.start();
    setLoading(true);
    setError(null);
    if (!filterParams?.region_id) {
      setData(null);
      setDistrictsData([]);
      setRegionInfo({});
      setError(null); // Clear previous errors
      setLoading(false);
      setDataLoaded(false); // Reset data loaded state
      NProgress.done();
      return;
    }
    

    
    const q = new URLSearchParams();
    ['region_id', 'year', 'term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
    try {
      // Fetch region info
      const regionRes = await fetch(`/api/regions/${filterParams.region_id}`);
      if (regionRes.ok) {
        const regionData = await regionRes.json();
        setRegionInfo(regionData || {});
      }

      const res = await fetch(`/api/school-report/grounds/furniture?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const furnitureData = await res.json();
      setData(furnitureData);
      
      // Group data by district
      const districtMap = new Map();
      
      furnitureData.forEach(item => {
        if (!districtMap.has(item.district_id)) {
          districtMap.set(item.district_id, {
            district_id: item.district_id,
            district_name: item.district_name || `District ID: ${item.district_id}`,
            circuits: new Map()
          });
        }
        
        const district = districtMap.get(item.district_id);
        
        if (!district.circuits.has(item.circuit_id)) {
          district.circuits.set(item.circuit_id, {
            circuit_id: item.circuit_id,
            circuit_name: item.circuit_name || `Circuit ID: ${item.circuit_id}`,
            schools: new Map()
          });
        }
        
        const circuit = district.circuits.get(item.circuit_id);
        
        if (!circuit.schools.has(item.school_id)) {
          circuit.schools.set(item.school_id, {
            school_id: item.school_id,
            school_name: item.school_name || `School ID: ${item.school_id}`,
            furniture: []
          });
        }
        
        circuit.schools.get(item.school_id).furniture.push(item);
      });
      
      // Convert Maps to Arrays for easier rendering
      const districtsArray = Array.from(districtMap.values()).map(district => ({
        ...district,
        circuits: Array.from(district.circuits.values()).map(circuit => ({
          ...circuit,
          schools: Array.from(circuit.schools.values())
        }))
      }));
      
      setDistrictsData(districtsArray);
      setDataLoaded(true);
    } catch(e) { 
      console.error(`Error fetching ${reportTitle}:`, e); 
      setError(e.message || 'An unexpected error occurred.'); 
      setData(null);
      setDistrictsData([]);
      setRegionInfo({}); // Clear region info on error
      setDataLoaded(true); // Mark as data fetch attempted
    }
    
    setLoading(false);
    NProgress.done();
  }, [filterParams, reportTitle]);

  useEffect(() => {
    if (loadOnDemand) {
      // If on-demand, clear previous data and wait for button click
      setData(null);
      setDistrictsData([]);
      setRegionInfo({});
      setError(null);
      setLoading(false); // Ensure loading is false
      setDataLoaded(false);
      if (NProgress.isStarted()) NProgress.done(); // Ensure NProgress is stopped
    } else {
      fetchData();
    }
  }, [filterParams, loadOnDemand, fetchData]);

  // --- Conditional Rendering ---
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
            startIcon={<DeskIcon />}
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
        {/* Skeleton for Region Info & Metadata */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Skeleton variant="text" width="40%" height={40} />
            <Skeleton variant="rounded" width={100} height={30} /> {/* For ToggleButtonGroup */}
          </Stack>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}><Skeleton variant="text" width="70%" /><Skeleton variant="text" width="90%" /></Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}><Skeleton variant="text" width="70%" /><Skeleton variant="text" width="90%" /></Grid>
          </Grid>
        </Paper>

        {/* Skeleton for Summary Stats */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
            <Box sx={{ width: '60%' }}>
              <Skeleton variant="text" width="70%" height={30} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="90%" />
            </Box>
            <Box sx={{ textAlign: 'right', width: '35%' }}>
              <Skeleton variant="text" width="80%" height={50} sx={{ mb: 0.5 }}/>
              <Skeleton variant="text" width="60%" />
            </Box>
          </Stack>
        </Paper>

        {/* Skeleton for Metric Cards */}
        <Grid container spacing={2} sx={{ mt: 1, mb: 3 }}>
          {[...Array(4)].map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={i}>
              <Paper variant="outlined" sx={{ height: '100%', p:2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Skeleton variant="text" width="60%" sx={{ mb: 1 }} />
                <Skeleton variant="circular" width={56} height={56} sx={{ my: 2 }} />
                <Skeleton variant="rounded" width="50%" height={24} />
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Skeleton for District Accordions */}
        <Typography variant="h6" gutterBottom sx={{mt: 2}}><Skeleton width="30%" /></Typography>
        {[...Array(2)].map((_, i) => (
          <Paper key={i} variant="outlined" sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Skeleton width="60%" />
            </AccordionSummary>
          </Paper>
        ))}
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

  const metricTypes = transformDataToMetrics(data);
  const stats = getSummaryStats(data);

  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Region info and metadata */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h5">{regionInfo.name || 'Region Report'}</Typography>
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
            <Typography variant="h6" gutterBottom>Region Furniture Summary</Typography>
            <Typography variant="body2" color="text.secondary">
              Adequate: {stats.adequate}, Partial: {stats.partial}, Inadequate: {stats.inadequate}, Total: {stats.total}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h4" 
              color={
                stats.status === 'Adequate Furniture' ? 'success.main' : 
                stats.status === 'Inadequate Furniture' ? 'error.main' : 'warning.main'
              }
            >
              {stats.status}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Overall Status
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {viewMode === 'card' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {metricTypes.map(({ name, data: metricData }, idx) => {
            const display = getFurnitureDisplay(name, metricData);
            
            return (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    '&:hover': { boxShadow: 3 }, 
                    height: '100%',
                    bgcolor: display.statusColor === 'success' ? 'success.50' : 
                            display.statusColor === 'warning' ? 'warning.50' :
                            display.statusColor === 'error' ? 'error.50' : 
                            display.statusColor === 'info' ? 'info.50' : 
                            display.statusColor === 'primary' ? 'primary.50' : 'background.paper',
                    borderColor: display.statusColor === 'success' ? 'success.200' : 
                               display.statusColor === 'warning' ? 'warning.200' :
                               display.statusColor === 'error' ? 'error.200' : 
                               display.statusColor === 'info' ? 'info.200' : 
                               display.statusColor === 'primary' ? 'primary.200' : 'divider'
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
                               display.statusColor === 'info' ? 'info.main' : 
                               display.statusColor === 'primary' ? 'primary.main' : 'text.secondary'
                      }}>
                        {display.icon}
                      </Box>
                    </Box>
                    
                    <Chip
                      label={
                        display.status === 'adequate' ? 'Adequate' :
                        display.status === 'partial' ? 'Partial' :
                        display.status === 'inadequate' ? 'Inadequate' :
                        'No Data'
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
        <Box>
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>All Region Furniture Data</Typography>
          <DataDisplayTable data={data} title={reportTitle} />
        </Box>
      )}
      
      {/* District-by-district breakdown */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>District Breakdown</Typography>
      
      {districtsData.map((district) => (
        <Accordion key={district.district_id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{district.district_name} - {district.circuits.length} Circuits</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Reusing the DistrictFurnitureView for detailed district data */}
            <DistrictFurnitureView filterParams={{ district_id: district.district_id, year: filterParams.year, term: filterParams.term }} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}


