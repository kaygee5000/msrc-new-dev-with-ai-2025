
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
import SchoolIcon from '@mui/icons-material/School';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BookIcon from '@mui/icons-material/Book';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Import the enhanced SchoolPupilPerformanceView for drill-down
import SchoolPupilPerformanceView from './SchoolPupilPerformanceView';

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

// Mapping of performance metrics to their display properties
const PERFORMANCE_METRICS = {
  'Overall Performance': {
    icon: <SchoolIcon sx={{ fontSize: 56 }} />,
    category: 'overall',
    color: 'primary'
  },
  'Literacy Rate': {
    icon: <BookIcon sx={{ fontSize: 56 }} />,
    category: 'literacy',
    color: 'info'
  },
  'Numeracy Rate': {
    icon: <BookIcon sx={{ fontSize: 56 }} />,
    category: 'numeracy',
    color: 'secondary'
  },
  'Completion Rate': {
    icon: <CheckCircleIcon sx={{ fontSize: 56 }} />,
    category: 'completion',
    color: 'success'
  },
  'Attendance Rate': {
    icon: <TrendingUpIcon sx={{ fontSize: 56 }} />,
    category: 'attendance',
    color: 'warning'
  }
};

// Helper function to get display properties for performance metric
const getPerformanceDisplay = (metricType, data) => {
  const metric = PERFORMANCE_METRICS[metricType] || {
    icon: <HelpOutlineIcon sx={{ fontSize: 56 }} />,
    category: 'other',
    color: 'default'
  };
  
  let status = 'good';
  let statusColor = metric.color;
  
  if (!data || Object.keys(data).length === 0) {
    status = 'no_data';
    statusColor = 'default';
  } else {
    const value = data.value; // Assuming data has a 'value' field for the metric
    if (value === undefined) {
      status = 'unknown';
      statusColor = 'warning';
    } else if (value >= 80) {
      status = 'excellent';
      statusColor = 'success';
    } else if (value >= 60) {
      status = 'good';
      statusColor = 'info';
    } else if (value >= 40) {
      status = 'average';
      statusColor = 'warning';
    } else {
      status = 'poor';
      statusColor = 'error';
    }
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
  if (!data || data.length === 0) return { excellent: 0, good: 0, average: 0, poor: 0, total: 0, status: 'No Data' };
  
  let excellent = 0;
  let good = 0;
  let average = 0;
  let poor = 0;
  let total = 0;

  data.forEach(item => {
    Object.keys(item).forEach(key => {
      if (!['id', 'school_id', 'school_name', 'circuit_id', 'circuit_name', 'year', 'term', 'created_at', 'updated_at'].includes(key)) {
        const value = item[key];
        if (typeof value === 'number') {
          total++;
          if (value >= 80) excellent++;
          else if (value >= 60) good++;
          else if (value >= 40) average++;
          else poor++;
        }
      }
    });
  });

  let status = 'Mixed Performance';
  if (excellent === total && total > 0) status = 'Excellent Overall';
  else if (good + excellent === total && total > 0) status = 'Good Overall';
  else if (poor > (total / 2)) status = 'Poor Overall';
  
  return { excellent, good, average, poor, total, status };
};

// Transform raw data into metric-based format for summary
const transformDataToMetrics = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Aggregate data for the circuit level
  const aggregatedData = {};
  rawData.forEach(schoolData => {
    Object.keys(schoolData).forEach(key => {
      if (!['id', 'school_id', 'school_name', 'year', 'term', 'created_at', 'updated_at'].includes(key)) {
        if (!aggregatedData[key]) {
          aggregatedData[key] = { sum: 0, count: 0 };
        }
        if (typeof schoolData[key] === 'number') {
          aggregatedData[key].sum += schoolData[key];
          aggregatedData[key].count++;
        }
      }
    });
  });

  const metricTypes = Object.keys(PERFORMANCE_METRICS).map(name => {
    const dataForType = aggregatedData[name.toLowerCase().replace(/ /g, '_')] || { sum: 0, count: 0 };
    return { name, data: { value: dataForType.count > 0 ? dataForType.sum / dataForType.count : undefined } };
  });
  
  return metricTypes;
};

export default function CircuitPupilPerformanceView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [schoolsData, setSchoolsData] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [circuitInfo, setCircuitInfo] = useState({});
  const title = 'Pupil Performance';

  const fetchData = useCallback(async () => {
    if (!filterParams?.circuit_id) {
      setData(null);
      setSchoolsData([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const q = new URLSearchParams();
    ['circuit_id', 'year', 'term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
    try {
      // Fetch circuit info
      const circuitRes = await fetch(`/api/circuits/${filterParams.circuit_id}`);
      if (circuitRes.ok) {
        const circuitData = await circuitRes.json();
        setCircuitInfo(circuitData || {});
      }

      const res = await fetch(`/api/school-report/management/pupil-performance?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const performanceData = await res.json();
      setData(performanceData);
      
      // Group data by school for drill-down
      const schoolMap = new Map();
      performanceData.forEach(item => {
        if (!schoolMap.has(item.school_id)) {
          schoolMap.set(item.school_id, {
            school_id: item.school_id,
            school_name: item.school_name || `School ID: ${item.school_id}`,
            performance: []
          });
        }
        schoolMap.get(item.school_id).performance.push(item);
      });
      setSchoolsData(Array.from(schoolMap.values()));

    } catch(e) { 
      console.error(`Error fetching ${title}:`, e); 
      setError(e.message); 
      setData(null);
      setSchoolsData([]);
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
    <Alert severity="info" sx={{ mt: 2 }}>No {title.toLowerCase()} data available for this circuit.</Alert>
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
      {/* Circuit info and metadata */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h5">{circuitInfo.name || 'Circuit Report'}</Typography>
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
            <Typography variant="caption" color="text.secondary">District</Typography>
            <Typography variant="body2">{circuitInfo.district || 'N/A'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="caption" color="text.secondary">Region</Typography>
            <Typography variant="body2">{circuitInfo.region || 'N/A'}</Typography>
          </Grid>
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
            <Typography variant="h6" gutterBottom>Circuit Pupil Performance Summary</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.excellent} excellent, {stats.good} good, {stats.average} average, {stats.poor} poor across {schoolsData.length} schools
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h4" 
              color={
                stats.status === 'Excellent Overall' ? 'success.main' : 
                stats.status === 'Good Overall' ? 'info.main' : 
                stats.status === 'Mixed Performance' ? 'warning.main' : 'error.main'
              }
            >
              {stats.status}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Overall Performance
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {viewMode === 'card' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {metricTypes.map(({ name, data: metricData }, idx) => {
            const display = getPerformanceDisplay(name, metricData);
            
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
                        display.status === 'excellent' ? 'Excellent' :
                        display.status === 'good' ? 'Good' :
                        display.status === 'average' ? 'Average' :
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
      
      {/* School-by-school breakdown */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>School Breakdown</Typography>
      
      {schoolsData.map((school) => (
        <Accordion key={school.school_id} sx={{ mb: 1 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{school.school_name}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Reusing the SchoolPupilPerformanceView for detailed school data */}
            <SchoolPupilPerformanceView filterParams={{ school_id: school.school_id, year: filterParams.year, term: filterParams.term }} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}


