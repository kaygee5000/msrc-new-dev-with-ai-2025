
import { useState, useEffect, useCallback } from 'react';
import NProgress from 'nprogress';
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
  Button, // Added for Load Data and Try Again buttons
  Skeleton // Added for loading state
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

// Import the enhanced DistrictWashView for drill-down
import DistrictWashView from './DistrictWashView';

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

// Mapping of WASH metrics to their display properties
const WASH_METRICS = {
  'Water Availability': {
    icon: <WaterDropIcon sx={{ fontSize: 56 }} />,
    category: 'water_availability',
    color: 'primary'
  },
  'Toilet Facilities': {
    icon: <WcIcon sx={{ fontSize: 56 }} />,
    category: 'toilet_facilities',
    color: 'info'
  },
  'Handwashing Stations': {
    icon: <SanitizerIcon sx={{ fontSize: 56 }} />,
    category: 'handwashing_stations',
    color: 'secondary'
  },
  'Shower Facilities': {
    icon: <ShowerIcon sx={{ fontSize: 56 }} />,
    category: 'shower_facilities',
    color: 'warning'
  }
};

// Helper function to get display properties for WASH metric
const getWashDisplay = (metricType, data) => {
  const metric = WASH_METRICS[metricType] || {
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

  let status = 'Mixed WASH';
  if (adequate === total && total > 0) status = 'Adequate WASH';
  else if (inadequate === total && total > 0) status = 'Inadequate WASH';
  
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

  const metricTypes = Object.keys(WASH_METRICS).map(name => {
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

export default function RegionWashView({ filterParams, loadOnDemand = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataLoaded, setDataLoaded] = useState(!loadOnDemand);
  const [districtsData, setDistrictsData] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [regionInfo, setRegionInfo] = useState({});
  const title = 'WASH';

  const fetchData = useCallback(async () => {
    NProgress.start();
    setLoading(true);
    setDataLoaded(false); // Indicate that we are attempting to load fresh data
    setError(null);
    if (!filterParams?.region_id) {
      setData(null);
      setDistrictsData([]);
      setLoading(false);
      NProgress.done();
      if (!loadOnDemand) setDataLoaded(true); // Data is 'loaded' as empty if not on-demand
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const q = new URLSearchParams();
    ['region_id', 'year', 'term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
    try {
      // Fetch region info
      const regionRes = await fetch(`/api/regions/${filterParams.region_id}`);
      if (regionRes.ok) {
        const regionData = await regionRes.json();
        setRegionInfo(regionData || {});
      }

      const res = await fetch(`/api/school-report/grounds/wash?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const washData = await res.json();
      setData(washData);
      
      // Group data by district, circuit, and school
      const districtMap = new Map();
      
      washData.forEach(item => {
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
            wash: []
          });
        }
        
        circuit.schools.get(item.school_id).wash.push(item);
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
      setDataLoaded(true); // Data successfully loaded
    } catch(e) { 
      console.error(`Error fetching ${title} data:`, e); 
      setError(e.message); 
      setData(null);
      setDistrictsData([]);
      // dataLoaded remains false if an error occurs
    } finally {
      setLoading(false);
      NProgress.done();
    }
  }, [filterParams, title]); // Added title to deps, though it's constant here.

  useEffect(() => {
    if (loadOnDemand) {
      // If on-demand, clear data and show button until explicitly loaded or filters change
      setData(null);
      setDistrictsData([]);
      setDataLoaded(false);
      setError(null); // Clear previous errors
    } else {
      // If not on-demand, fetch data immediately
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterParams, loadOnDemand]); // fetchData is not in deps to control calls explicitly

  // --- Conditional Rendering --- 

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        {/* Skeleton for Header */}
        <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Skeleton variant="text" width="40%" height={40} />
            <Skeleton variant="rounded" width={100} height={35} />
          </Stack>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 8 }}><Skeleton variant="text" width="60%" height={20} /></Grid>
            <Grid size={{ xs: 12, md: 8 }}><Skeleton variant="text" width="60%" height={20} /></Grid>
          </Grid>
        </Paper>

        {/* Skeleton for Summary Stats */}
        <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
            <Box>
              <Skeleton variant="text" width="50%" height={30} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="70%" />
            </Box>
            <Box sx={{ textAlign: 'right' }}>
              <Skeleton variant="text" width="30%" height={50} />
            </Box>
          </Stack>
        </Paper>

        {/* Skeleton for Metric Cards (if card view) */}
        <Grid container spacing={2} sx={{ mt: 1, mb: 3 }}>
          {[1, 2, 3, 4].map(i => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rectangular" height={150} />
            </Grid>
          ))}
        </Grid>

        {/* Skeleton for District Accordions */}
        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}><Skeleton width="30%" /></Typography>
        {[1, 2].map((i) => (
          <Accordion key={i} disabled sx={{ mb: 1, '& .MuiAccordionSummary-root': { opacity: 1 } }} >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Skeleton variant="text" width="60%" height={30} />
            </AccordionSummary>
            <AccordionDetails>
              <Skeleton variant="rectangular" height={100} />
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2, p: 2 }}>
        <Typography gutterBottom>Error loading {title} data: {error}</Typography>
        <Button variant="contained" onClick={fetchData} size="small" disabled={loading}>
          {loading ? 'Retrying...' : 'Try Again'}
        </Button>
      </Alert>
    );
  }

  // This condition means data has been loaded (or attempted), and it's empty or null.
  if (!data || data.length === 0) {
    return (
      <Alert severity="info" sx={{ m: 2, p: 2 }}>
        No {title.toLowerCase()} data available for this region and selected filters.
        {loadOnDemand && 
          <Button onClick={fetchData} sx={{ ml: 2 }} size="small" variant="outlined" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        }
      </Alert>
    );
  }
  // --- End Conditional Rendering ---

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
            <Typography variant="h6" gutterBottom>Region WASH Summary</Typography>
            <Typography variant="body2" color="text.secondary">
              Adequate: {stats.adequate}, Partial: {stats.partial}, Inadequate: {stats.inadequate}, Total: {stats.total}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h4" 
              color={
                stats.status === 'Adequate WASH' ? 'success.main' : 
                stats.status === 'Inadequate WASH' ? 'error.main' : 'warning.main'
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
            const display = getWashDisplay(name, metricData);
            
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
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>All Region WASH Data</Typography>
          <DataDisplayTable data={data} title={title} />
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
            {/* Reusing the DistrictWashView for detailed district data */}
            <DistrictWashView filterParams={{ district_id: district.district_id, year: filterParams.year, term: filterParams.term }} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}


