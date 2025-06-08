
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
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Import the enhanced CircuitSupportGrantsView for drill-down
import CircuitSupportGrantsView from './CircuitSupportGrantsView';

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

// Mapping of support grant metrics to their display properties
const SUPPORT_GRANT_METRICS = {
  'Received Grants': {
    icon: <AttachMoneyIcon sx={{ fontSize: 56 }} />,
    category: 'received_grants',
    color: 'success'
  },
  'Pending Grants': {
    icon: <AttachMoneyIcon sx={{ fontSize: 56 }} />,
    category: 'pending_grants',
    color: 'warning'
  },
  'Rejected Grants': {
    icon: <AttachMoneyIcon sx={{ fontSize: 56 }} />,
    category: 'rejected_grants',
    color: 'error'
  }
};

// Helper function to get display properties for support grant metric
const getSupportGrantDisplay = (metricType, data) => {
  const metric = SUPPORT_GRANT_METRICS[metricType] || {
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
  if (!data || data.length === 0) return { totalGrants: 0, status: 'No Data' };
  
  let totalGrants = 0;
  data.forEach(item => {
    totalGrants += (item.received_grants || 0) + (item.pending_grants || 0) + (item.rejected_grants || 0);
  });

  let status = 'Grants Data Available';
  if (totalGrants === 0) status = 'No Grants Data';
  
  return { totalGrants, status };
};

// Transform raw data into metric-based format for summary
const transformDataToMetrics = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Aggregate data for the district level
  const aggregatedData = {
    received_grants: 0,
    pending_grants: 0,
    rejected_grants: 0
  };
  rawData.forEach(item => {
    aggregatedData.received_grants += item.received_grants || 0;
    aggregatedData.pending_grants += item.pending_grants || 0;
    aggregatedData.rejected_grants += item.rejected_grants || 0;
  });

  const metricTypes = Object.keys(SUPPORT_GRANT_METRICS).map(name => {
    const categoryKey = SUPPORT_GRANT_METRICS[name].category;
    return { name, data: { value: aggregatedData[categoryKey] } };
  });
  
  return metricTypes;
};

export default function DistrictSupportGrantsView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [circuitsData, setCircuitsData] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [districtInfo, setDistrictInfo] = useState({});
  const title = 'Support Grants';

  const fetchData = useCallback(async () => {
    if (!filterParams?.district_id) {
      setData(null);
      setCircuitsData([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const q = new URLSearchParams();
    ['district_id', 'year', 'term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
    try {
      // Fetch district info
      const districtRes = await fetch(`/api/districts/${filterParams.district_id}`);
      if (districtRes.ok) {
        const districtData = await districtRes.json();
        setDistrictInfo(districtData || {});
      }

      const res = await fetch(`/api/school-report/management/support-grants?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const supportGrantsData = await res.json();
      setData(supportGrantsData);
      
      // Group data by circuit
      const circuitMap = new Map();
      
      supportGrantsData.forEach(item => {
        if (!circuitMap.has(item.circuit_id)) {
          circuitMap.set(item.circuit_id, {
            circuit_id: item.circuit_id,
            circuit_name: item.circuit_name || `Circuit ID: ${item.circuit_id}`,
            schools: new Map(),
            supportGrants: []
          });
        }
        
        const circuit = circuitMap.get(item.circuit_id);
        circuit.supportGrants.push(item);
        
        if (!circuit.schools.has(item.school_id)) {
          circuit.schools.set(item.school_id, {
            school_id: item.school_id,
            school_name: item.school_name || `School ID: ${item.school_id}`,
            supportGrants: []
          });
        }
        
        circuit.schools.get(item.school_id).supportGrants.push(item);
      });
      
      // Convert Map to Array for easier rendering
      const circuitsArray = Array.from(circuitMap.values()).map(circuit => ({
        ...circuit,
        schools: Array.from(circuit.schools.values())
      }));
      
      setCircuitsData(circuitsArray);
    } catch(e) { 
      console.error(`Error fetching ${title}:`, e); 
      setError(e.message); 
      setData(null);
      setCircuitsData([]);
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
    <Alert severity="info" sx={{ mt: 2 }}>No {title.toLowerCase()} data available for this district.</Alert>
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
      {/* District info and metadata */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h5">{districtInfo.name || 'District Report'}</Typography>
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
            <Typography variant="caption" color="text.secondary">Region</Typography>
            <Typography variant="body2">{districtInfo.region || 'N/A'}</Typography>
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
            <Typography variant="h6" gutterBottom>District Support Grants Summary</Typography>
            <Typography variant="body2" color="text.secondary">
              Total Grants: {stats.totalGrants}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h4" 
              color={
                stats.status === 'Grants Data Available' ? 'success.main' : 'warning.main'
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
            const display = getSupportGrantDisplay(name, metricData);
            
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
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>All District Support Grants Data</Typography>
          <DataDisplayTable data={data} title={title} />
        </Box>
      )}
      
      {/* Circuit-by-circuit breakdown */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Circuit Breakdown</Typography>
      
      {circuitsData.map((circuit) => (
        <Accordion key={circuit.circuit_id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{circuit.circuit_name} - {circuit.schools.length} Schools</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Reusing the CircuitSupportGrantsView for detailed circuit data */}
            <CircuitSupportGrantsView filterParams={{ circuit_id: circuit.circuit_id, year: filterParams.year, term: filterParams.term }} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}


