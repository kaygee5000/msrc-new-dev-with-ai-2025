
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
  Button,
  Skeleton
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Import the enhanced DistrictSchoolStructureView for drill-down
import DistrictSchoolStructureView from './DistrictSchoolStructureView';

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

// Mapping of school structure metrics to their display properties
const SCHOOL_STRUCTURE_METRICS = {
  'Classrooms': {
    icon: <SchoolIcon sx={{ fontSize: 56 }} />,
    category: 'classrooms',
    color: 'primary'
  },
  'Libraries': {
    icon: <SchoolIcon sx={{ fontSize: 56 }} />,
    category: 'libraries',
    color: 'info'
  },
  'Laboratories': {
    icon: <SchoolIcon sx={{ fontSize: 56 }} />,
    category: 'laboratories',
    color: 'secondary'
  },
  'Offices': {
    icon: <SchoolIcon sx={{ fontSize: 56 }} />,
    category: 'offices',
    color: 'warning'
  }
};

// Helper function to get display properties for school structure metric
const getSchoolStructureDisplay = (metricType, data) => {
  const metric = SCHOOL_STRUCTURE_METRICS[metricType] || {
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
    if (value > 0) status = 'positive';
    else status = 'neutral';
    statusColor = status === 'positive' ? 'success' : 'info';
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
  if (!data || data.length === 0) return { totalStructures: 0, status: 'No Data' };
  
  let totalStructures = 0;
  data.forEach(item => {
    totalStructures += (item.classrooms || 0) + (item.libraries || 0) + (item.laboratories || 0) + (item.offices || 0);
  });

  let status = 'Structures Data Available';
  if (totalStructures === 0) status = 'No Structures Data';
  
  return { totalStructures, status };
};

// Transform raw data into metric-based format for summary
const transformDataToMetrics = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Aggregate data for the region level
  const aggregatedData = {
    classrooms: 0,
    libraries: 0,
    laboratories: 0,
    offices: 0
  };
  rawData.forEach(item => {
    aggregatedData.classrooms += item.classrooms || 0;
    aggregatedData.libraries += item.libraries || 0;
    aggregatedData.laboratories += item.laboratories || 0;
    aggregatedData.offices += item.offices || 0;
  });

  const metricTypes = Object.keys(SCHOOL_STRUCTURE_METRICS).map(name => {
    const categoryKey = SCHOOL_STRUCTURE_METRICS[name].category;
    return { name, data: { value: aggregatedData[categoryKey] } };
  });
  
  return metricTypes;
};

export default function RegionSchoolStructureView({ filterParams, loadOnDemand = false, reportTitle: initialReportTitle = 'School Structure' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [districtsData, setDistrictsData] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [regionInfo, setRegionInfo] = useState({});
  const [dataLoaded, setDataLoaded] = useState(false);
  const reportTitle = initialReportTitle;

  const fetchData = useCallback(async () => {
    if (!filterParams?.region_id) {
      setData(null);
      setDistrictsData([]);
      setRegionInfo({});
      setDataLoaded(false); // Reset if params are insufficient
      if (NProgress.isStarted()) NProgress.done();
      setLoading(false);
      return;
    }

    NProgress.start();
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

      const res = await fetch(`/api/school-report/grounds/school-structure?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const structureData = await res.json();
      setData(structureData);
      setDataLoaded(true); // Data fetch attempt was made and successful
      
      // Group data by district
      const districtMap = new Map();
      
      structureData.forEach(item => {
        if (!districtMap.has(item.district_id)) {
          districtMap.set(item.district_id, {
            district_id: item.district_id,
            district_name: item.district_name || `District ID: ${item.district_id}`,
            circuits: new Map(),
            structures: []
          });
        }
        
        const district = districtMap.get(item.district_id);
        district.structures.push(item);
        
        if (!district.circuits.has(item.circuit_id)) {
          district.circuits.set(item.circuit_id, {
            circuit_id: item.circuit_id,
            circuit_name: item.circuit_name || `Circuit ID: ${item.circuit_id}`,
            schools: new Map(),
            structures: []
          });
        }
        
        const circuit = district.circuits.get(item.circuit_id);
        circuit.structures.push(item);
        
        if (!circuit.schools.has(item.school_id)) {
          circuit.schools.set(item.school_id, {
            school_id: item.school_id,
            school_name: item.school_name || `School ID: ${item.school_id}`,
            structures: []
          });
        }
        
        circuit.schools.get(item.school_id).structures.push(item);
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
    } catch(err) {
      console.error(`Failed to fetch ${reportTitle.toLowerCase()} data:`, err);
      setError(err.message || 'An unexpected error occurred.');
      setData(null); // Clear data on error
      setDistrictsData([]); // Clear districts data on error
      setRegionInfo({}); // Clear region info on error
      setDataLoaded(true); // Data fetch attempt was made, even if it failed
    } finally {
      setLoading(false);
      NProgress.done();
    }
  }, [filterParams, reportTitle]);

  useEffect(() => {
    if (loadOnDemand) {
      setData(null);
      setDistrictsData([]);
      setRegionInfo({});
      setError(null);
      setLoading(false);
      setDataLoaded(false);
      if (NProgress.isStarted()) NProgress.done();
    } else {
      fetchData();
    }
  }, [filterParams, loadOnDemand, fetchData]);

  // --- Start Conditional Rendering ---
  if (loadOnDemand && !dataLoaded && !loading && !error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 3, minHeight: 200 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {reportTitle} Data
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Click the button to load the {reportTitle.toLowerCase()} data for the selected region.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchData}
            startIcon={<SchoolIcon />}
          >
            Load {reportTitle} Data
          </Button>
        </Paper>
      </Box>
    );
  }

  if (loading) {
    if (!NProgress.isStarted()) NProgress.start();
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Skeleton variant="text" width={180} sx={{ mr: 1 }} /> <CircularProgress size={20} />
        </Typography>
        
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom><Skeleton width="50%" /></Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><Skeleton variant="text" width="70%" /><Skeleton variant="text" width="90%" /></Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}><Skeleton variant="text" width="70%" /><Skeleton variant="text" width="90%" /></Grid>
          </Grid>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom><Skeleton width="40%" /></Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}><Skeleton variant="text" width="80%" /><Skeleton variant="text" width="60%" /></Grid>
            <Grid size={{ xs: 12, sm: 6 }}><Skeleton variant="text" width="80%" /><Skeleton variant="text" width="60%" /></Grid>
          </Grid>
        </Paper>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[...Array(4)].map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Skeleton variant="rectangular" height={150} />
            </Grid>
          ))}
        </Grid>

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
          <Typography fontWeight="bold">{reportTitle} Data Error</Typography>
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
          No {reportTitle.toLowerCase()} data found for the selected filters.
        </Alert>
      </Box>
    );
  }

  const metrics = data ? transformDataToMetrics(data) : [];
  const stats = data ? getSummaryStats(data) : { totalStructures: 0, status: 'No Data' };

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
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">Year</Typography>
            <Typography variant="body2">{filterParams.year || 'N/A'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="caption" color="text.secondary">Term</Typography>
            <Typography variant="body2">{filterParams.term || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary stats */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
          <Box sx={{ width: '100%' }}>
            <Typography variant="h5" gutterBottom>{reportTitle} - Region: {regionInfo.name || filterParams.region_id || 'N/A'}</Typography>
            <Typography variant="body2" color="text.secondary">
              Total Structures: {stats.totalStructures}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h4" 
              color={
                stats.status === 'Structures Data Available' ? 'success.main' : 'warning.main'
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
          {metrics.map(({ name, data: metricData }, idx) => {
            const display = getSchoolStructureDisplay(name, metricData);
            
            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
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
                        display.status === 'positive' ? 'Data Available' :
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
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>All Region School Structure Data</Typography>
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
            {/* Reusing the DistrictSchoolStructureView for detailed district data */}
            <DistrictSchoolStructureView filterParams={{ district_id: district.district_id, year: filterParams.year, term: filterParams.term }} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}


