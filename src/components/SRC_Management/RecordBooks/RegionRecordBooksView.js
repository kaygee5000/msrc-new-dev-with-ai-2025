
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
  ToggleButton,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BookIcon from '@mui/icons-material/Book';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Import the enhanced DistrictRecordBooksView for drill-down
import DistrictRecordBooksView from './DistrictRecordBooksView';

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

// Mapping of record book metrics to their display properties
const RECORD_BOOK_METRICS = {
  'Lesson Plans': {
    icon: <BookIcon sx={{ fontSize: 56 }} />,
    category: 'lesson_plans',
    color: 'primary'
  },
  'Attendance Registers': {
    icon: <BookIcon sx={{ fontSize: 56 }} />,
    category: 'attendance_registers',
    color: 'info'
  },
  'Scheme of Work': {
    icon: <BookIcon sx={{ fontSize: 56 }} />,
    category: 'scheme_of_work',
    color: 'secondary'
  },
  'Cumulative Records': {
    icon: <BookIcon sx={{ fontSize: 56 }} />,
    category: 'cumulative_records',
    color: 'warning'
  }
};

// Helper function to get display properties for record book metric
const getRecordBookDisplay = (metricType, data) => {
  const metric = RECORD_BOOK_METRICS[metricType] || {
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
    if (value === 'Complete') status = 'complete';
    else if (value === 'Incomplete') status = 'incomplete';
    else status = 'not_available';
    statusColor = status === 'complete' ? 'success' : status === 'incomplete' ? 'warning' : 'error';
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
  if (!data || data.length === 0) return { complete: 0, incomplete: 0, not_available: 0, total: 0, status: 'No Data' };
  
  let complete = 0;
  let incomplete = 0;
  let not_available = 0;
  let total = 0;

  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (!['id', 'school_id', 'school_name', 'circuit_id', 'circuit_name', 'district_id', 'district_name', 'year', 'term', 'created_at', 'updated_at'].includes(key)) {
        const value = item[key];
        if (typeof value === 'string') {
          total++;
          if (value === 'Complete') complete++;
          else if (value === 'Incomplete') incomplete++;
          else not_available++;
        }
      }
    });
  });

  let status = 'Mixed Status';
  if (complete === total && total > 0) status = 'All Complete';
  else if (not_available === total && total > 0) status = 'All Not Available';
  
  return { complete, incomplete, not_available, total, status };
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
          aggregatedData[key] = { complete: 0, incomplete: 0, not_available: 0, count: 0 };
        }
        if (typeof item[key] === 'string') {
          aggregatedData[key].count++;
          if (item[key] === 'Complete') aggregatedData[key].complete++;
          else if (item[key] === 'Incomplete') aggregatedData[key].incomplete++;
          else aggregatedData[key].not_available++;
        }
      }
    });
  });

  const metricTypes = Object.keys(RECORD_BOOK_METRICS).map(name => {
    const categoryKey = RECORD_BOOK_METRICS[name].category;
    const dataForType = aggregatedData[categoryKey] || { count: 0 };
    let value;
    if (dataForType.count === 0) value = undefined;
    else if (dataForType.complete === dataForType.count) value = 'Complete';
    else if (dataForType.not_available === dataForType.count) value = 'Not Available';
    else value = 'Incomplete';
    
    return { name, data: { value } };
  });
  
  return metricTypes;
};

export default function RegionRecordBooksView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [districtsData, setDistrictsData] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [regionInfo, setRegionInfo] = useState({});
  const title = 'Record Books';

  const fetchData = useCallback(async () => {
    if (!filterParams?.region_id) {
      setData(null);
      setDistrictsData([]);
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

      const res = await fetch(`/api/school-report/management/record-books?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const recordBooksData = await res.json();
      setData(recordBooksData);
      
      // Group data by district, circuit, and school
      const districtMap = new Map();
      
      recordBooksData.forEach(item => {
        if (!districtMap.has(item.district_id)) {
          districtMap.set(item.district_id, {
            district_id: item.district_id,
            district_name: item.district_name || `District ID: ${item.district_id}`,
            circuits: new Map(),
            recordBooks: []
          });
        }
        
        const district = districtMap.get(item.district_id);
        district.recordBooks.push(item);
        
        if (!district.circuits.has(item.circuit_id)) {
          district.circuits.set(item.circuit_id, {
            circuit_id: item.circuit_id,
            circuit_name: item.circuit_name || `Circuit ID: ${item.circuit_id}`,
            schools: new Map(),
            recordBooks: []
          });
        }
        
        const circuit = district.circuits.get(item.circuit_id);
        circuit.recordBooks.push(item);
        
        if (!circuit.schools.has(item.school_id)) {
          circuit.schools.set(item.school_id, {
            school_id: item.school_id,
            school_name: item.school_name || `School ID: ${item.school_id}`,
            recordBooks: []
          });
        }
        
        circuit.schools.get(item.school_id).recordBooks.push(item);
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
    } catch(e) { 
      console.error(`Error fetching ${title}:`, e); 
      setError(e.message); 
      setData(null);
      setDistrictsData([]);
    }
    
    setLoading(false);
  }, [filterParams]);

  useEffect(() => { 
    fetchData(); 
  }, [fetchData]);

  if (loading) return (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <CircularProgress />
      <Typography variant="body2" sx={{ mt: 1 }}>Loading {title} data...</Typography>
    </Box>
  );
  
  if (error) return (
    <Alert severity="error" sx={{ mt: 2 }}>
      Error loading {title} data: {error}
    </Alert>
  );

  if (!data || data.length === 0) return (
    <Alert severity="info" sx={{ mt: 2 }}>No {title.toLowerCase()} data available for this region.</Alert>
  );

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
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Year</Typography>
            <Typography variant="body2">{filterParams.year || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Term</Typography>
            <Typography variant="body2">{filterParams.term || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary stats */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" gutterBottom>Region Record Books Summary</Typography>
            <Typography variant="body2" color="text.secondary">
              Complete: {stats.complete}, Incomplete: {stats.incomplete}, Not Available: {stats.not_available}, Total: {stats.total}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h4" 
              color={
                stats.status === 'All Complete' ? 'success.main' : 
                stats.status === 'All Not Available' ? 'error.main' : 'warning.main'
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
            const display = getRecordBookDisplay(name, metricData);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={idx}>
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
                        display.status === 'complete' ? 'Complete' :
                        display.status === 'incomplete' ? 'Incomplete' :
                        'Not Available'
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
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>All Region Record Books Data</Typography>
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
            {/* Reusing the DistrictRecordBooksView for detailed district data */}
            <DistrictRecordBooksView filterParams={{ district_id: district.district_id, year: filterParams.year, term: filterParams.term }} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}


