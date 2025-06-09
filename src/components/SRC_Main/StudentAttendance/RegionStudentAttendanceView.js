
import { useState, useEffect, useCallback } from 'react';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
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
  AccordionDetails
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Import the enhanced DistrictStudentAttendanceView for drill-down
import DistrictStudentAttendanceView from './DistrictStudentAttendanceView';

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

// Mapping of student attendance metrics to their display properties
const STUDENT_ATTENDANCE_METRICS = {
  'Total Students': {
    icon: <PersonIcon sx={{ fontSize: 56 }} />,
    category: 'total_students',
    color: 'primary'
  },
  'Present Students': {
    icon: <CheckCircleIcon sx={{ fontSize: 56 }} />,
    category: 'present_students',
    color: 'success'
  },
  'Absent Students': {
    icon: <CancelIcon sx={{ fontSize: 56 }} />,
    category: 'absent_students',
    color: 'error'
  }
};

// Helper function to get display properties for student attendance metric
const getStudentAttendanceDisplay = (metricType, data) => {
  const metric = STUDENT_ATTENDANCE_METRICS[metricType] || {
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
  if (!data || data.length === 0) return { totalStudents: 0, presentPercentage: 0, status: 'No Data' };
  
  let totalStudents = 0;
  let presentStudents = 0;
  data.forEach(item => {
    totalStudents += item.total_students || 0;
    presentStudents += item.present_students || 0;
  });

  const presentPercentage = totalStudents > 0 ? (presentStudents / totalStudents * 100).toFixed(2) : 0;
  let status = 'Attendance Data Available';
  if (totalStudents === 0) status = 'No Attendance Data';
  
  return { totalStudents, presentPercentage, status };
};

// Transform raw data into metric-based format for summary
const transformDataToMetrics = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Aggregate data for the region level
  const aggregatedData = {
    total_students: 0,
    present_students: 0,
    absent_students: 0
  };
  rawData.forEach(item => {
    aggregatedData.total_students += item.total_students || 0;
    aggregatedData.present_students += item.present_students || 0;
    aggregatedData.absent_students += item.absent_students || 0;
  });

  const metricTypes = Object.keys(STUDENT_ATTENDANCE_METRICS).map(name => {
    const categoryKey = STUDENT_ATTENDANCE_METRICS[name].category;
    return { name, data: { value: aggregatedData[categoryKey] } };
  });
  
  return metricTypes;
};

export default function RegionStudentAttendanceView({ filterParams, loadOnDemand = false }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(!loadOnDemand);
  const [error, setError] = useState(null);
  const [districtsData, setDistrictsData] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [regionInfo, setRegionInfo] = useState({});
  const title = 'Student Attendance';

  const fetchData = useCallback(async () => {
    NProgress.start();
    if (!filterParams?.region_id) {
      setData(null);
      setDistrictsData([]);
      return;
    }
    
    setLoading(true);
    setDataLoaded(false);
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

      const res = await fetch(`/api/school-report/main/student-attendance?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const attendanceData = await res.json();
      setData(attendanceData);
      
      // Group data by district, circuit, and school
      const districtMap = new Map();
      
      attendanceData.forEach(item => {
        // Create district entry if it doesn't exist
        if (!districtMap.has(item.district_id)) {
          districtMap.set(item.district_id, {
            district_id: item.district_id,
            district_name: item.district_name || `District ID: ${item.district_id}`,
            circuits: new Map(),
            attendance: []
          });
        }
        
        const district = districtMap.get(item.district_id);
        district.attendance.push(item);
        
        // Create circuit entry if it doesn't exist
        if (!district.circuits.has(item.circuit_id)) {
          district.circuits.set(item.circuit_id, {
            circuit_id: item.circuit_id,
            circuit_name: item.circuit_name || `Circuit ID: ${item.circuit_id}`,
            schools: new Map(),
            attendance: []
          });
        }
        
        const circuit = district.circuits.get(item.circuit_id);
        circuit.attendance.push(item);
        
        // Create school entry if it doesn't exist
        if (!circuit.schools.has(item.school_id)) {
          circuit.schools.set(item.school_id, {
            school_id: item.school_id,
            school_name: item.school_name || `School ID: ${item.school_id}`,
            attendance: []
          });
        }
        
        // Add attendance data to school
        circuit.schools.get(item.school_id).attendance.push(item);
      });
      
      // Convert maps to arrays for rendering
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
    setDataLoaded(true);
    NProgress.done();
  }, [filterParams, title]);

  useEffect(() => {
    if (!loadOnDemand) {
      fetchData();
    }
    // eslint-disable-next-line
  }, [filterParams, loadOnDemand]);

  if (loading) return (
    <Box sx={{ textAlign: 'center', py: 3 }}>
      <CircularProgress />
      <Typography variant="body2" sx={{ mt: 1 }}>Loading {title} data...</Typography>
    </Box>
  );

  if (loadOnDemand && !dataLoaded) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Button variant="contained" onClick={fetchData} disabled={loading}>
          {loading ? 'Loading...' : 'Load Data'}
        </Button>
        {loading && <Skeleton variant="rectangular" height={120} sx={{ mt: 2 }} />}
      </Box>
    );
  }

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
            <Typography variant="h6" gutterBottom>Region Student Attendance Summary</Typography>
            <Typography variant="body2" color="text.secondary">
              Total Students: {stats.totalStudents} | Present: {stats.presentPercentage}%
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h4" 
              color={
                stats.status === 'Attendance Data Available' ? 'success.main' : 'warning.main'
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
            const display = getStudentAttendanceDisplay(name, metricData);
            
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
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>All Region Student Attendance Data</Typography>
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
            {/* Reusing the DistrictStudentAttendanceView for detailed district data */}
            <DistrictStudentAttendanceView filterParams={{ district_id: district.district_id, year: filterParams.year, term: filterParams.term }} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}


