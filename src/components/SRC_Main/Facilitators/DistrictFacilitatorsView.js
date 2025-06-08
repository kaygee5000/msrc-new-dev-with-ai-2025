
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
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import BookIcon from '@mui/icons-material/Book';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Import the enhanced Circuit and School views for drill-down
import CircuitFacilitatorsView from './CircuitFacilitatorsView';
import SchoolFacilitatorsView from './SchoolFacilitatorsView';

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

// Mapping of facilitator metrics to their display properties
const FACILITATOR_METRICS = {
  'Total Facilitators': {
    icon: <PersonIcon sx={{ fontSize: 56 }} />,
    category: 'total_facilitators',
    color: 'primary'
  },
  'Average Attendance': {
    icon: <AccessTimeIcon sx={{ fontSize: 56 }} />,
    category: 'avg_attendance',
    color: 'info'
  },
  'Lessons Taught': {
    icon: <BookIcon sx={{ fontSize: 56 }} />,
    category: 'lessons_taught',
    color: 'secondary'
  },
  'Active Facilitators': {
    icon: <CheckCircleIcon sx={{ fontSize: 56 }} />,
    category: 'active_facilitators',
    color: 'success'
  },
  'Inactive Facilitators': {
    icon: <CancelIcon sx={{ fontSize: 56 }} />,
    category: 'inactive_facilitators',
    color: 'error'
  }
};

// Helper function to get display properties for facilitator metric
const getFacilitatorDisplay = (metricType, data) => {
  const metric = FACILITATOR_METRICS[metricType] || {
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
    if (metricType === 'Total Facilitators' || metricType === 'Lessons Taught') {
      if (value > 0) status = 'present';
      else status = 'absent';
    } else if (metricType === 'Average Attendance') {
      if (value >= 90) status = 'excellent';
      else if (value >= 70) status = 'good';
      else status = 'average';
      statusColor = status === 'excellent' ? 'success' : status === 'good' ? 'info' : status === 'average' ? 'warning' : 'error';
    } else if (metricType === 'Active Facilitators') {
      if (value > 0) status = 'active';
      else status = 'inactive';
      statusColor = status === 'active' ? 'success' : 'error';
    } else if (metricType === 'Inactive Facilitators') {
      if (value > 0) status = 'inactive';
      else status = 'active';
      statusColor = status === 'inactive' ? 'error' : 'success';
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
const getSummaryStats = (facilitators, attendance, lessonData) => {
  const totalFacilitators = facilitators.length;
  const totalAttendanceRecords = attendance.length;
  const totalLessonsTaught = lessonData.length;

  let totalAttendancePercentage = 0;
  if (totalAttendanceRecords > 0) {
    totalAttendancePercentage = attendance.reduce((sum, item) => sum + (item.attendance_percentage || 0), 0) / totalAttendanceRecords;
  }

  let activeFacilitators = 0;
  let inactiveFacilitators = 0;
  facilitators.forEach(f => {
    if (f.status === 'active') activeFacilitators++;
    else inactiveFacilitators++;
  });

  let overallStatus = 'Mixed';
  if (totalFacilitators > 0 && activeFacilitators === totalFacilitators) overallStatus = 'Excellent';
  else if (inactiveFacilitators === totalFacilitators && totalFacilitators > 0) overallStatus = 'Poor';

  return {
    totalFacilitators,
    totalAttendancePercentage,
    totalLessonsTaught,
    activeFacilitators,
    inactiveFacilitators,
    overallStatus
  };
};

// Transform raw data into metric-based format for summary
const transformDataToMetrics = (facilitators, attendance, lessonData) => {
  const metrics = [];

  const totalFacilitators = facilitators.length;
  metrics.push({ name: 'Total Facilitators', data: { value: totalFacilitators } });

  let totalAttendancePercentage = 0;
  if (attendance.length > 0) {
    totalAttendancePercentage = attendance.reduce((sum, item) => sum + (item.attendance_percentage || 0), 0) / attendance.length;
  }
  metrics.push({ name: 'Average Attendance', data: { value: totalAttendancePercentage } });

  const totalLessonsTaught = lessonData.length;
  metrics.push({ name: 'Lessons Taught', data: { value: totalLessonsTaught } });

  let activeFacilitators = 0;
  let inactiveFacilitators = 0;
  facilitators.forEach(f => {
    if (f.status === 'active') activeFacilitators++;
    else inactiveFacilitators++;
  });
  metrics.push({ name: 'Active Facilitators', data: { value: activeFacilitators } });
  metrics.push({ name: 'Inactive Facilitators', data: { value: inactiveFacilitators } });

  return metrics;
};

export default function DistrictFacilitatorsView({ filterParams }) {
  const [facilitators, setFacilitators] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [lessonData, setLessonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [circuitsData, setCircuitsData] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [districtInfo, setDistrictInfo] = useState({});
  const title = 'Facilitators';

  const fetchData = useCallback(async () => {
    if (!filterParams?.district_id) {
      resetData();
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const q = new URLSearchParams();
    ['district_id', 'year', 'term', 'week'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
    try {
      // Fetch district info
      const districtRes = await fetch(`/api/districts/${filterParams.district_id}`);
      if (districtRes.ok) {
        const districtData = await districtRes.json();
        setDistrictInfo(districtData || {});
      }

      // Fetch facilitators data
      const facilitatorsRes = await fetch(`/api/school-report/main/facilitators?${q}`);
      if (!facilitatorsRes.ok) throw new Error((await facilitatorsRes.json()).message || `Error ${facilitatorsRes.status}`);
      const facilitatorsData = await facilitatorsRes.json();
      setFacilitators(facilitatorsData);
      
      // Fetch attendance data
      const attendanceRes = await fetch(`/api/school-report/main/facilitator-attendance?${q}`);
      if (!attendanceRes.ok) throw new Error((await attendanceRes.json()).message || `Error ${attendanceRes.status}`);
      const attendanceData = await attendanceRes.json();
      setAttendance(attendanceData);
      
      // Fetch lesson data
      const lessonRes = await fetch(`/api/school-report/main/facilitator-lessons?${q}`);
      if (!lessonRes.ok) throw new Error((await lessonRes.json()).message || `Error ${lessonRes.status}`);
      const lessonData = await lessonRes.json();
      setLessonData(lessonData);
      
      // Group all data by circuit and school for drill-down
      const allData = [
        ...facilitatorsData.map(item => ({ ...item, data_type: 'facilitator' })),
        ...attendanceData.map(item => ({ ...item, data_type: 'attendance' })),
        ...lessonData.map(item => ({ ...item, data_type: 'lesson' }))
      ];
      
      const circuitMap = new Map();
      allData.forEach(item => {
        // Create circuit entry if it doesn't exist
        if (!circuitMap.has(item.circuit_id)) {
          circuitMap.set(item.circuit_id, {
            circuit_id: item.circuit_id,
            circuit_name: item.circuit_name || `Circuit ID: ${item.circuit_id}`,
            schools: new Map(),
            facilitators: [],
            attendance: [],
            lessons: []
          });
        }
        
        const circuit = circuitMap.get(item.circuit_id);
        
        if (item.data_type === 'facilitator') {
          circuit.facilitators.push(item);
        } else if (item.data_type === 'attendance') {
          circuit.attendance.push(item);
        } else if (item.data_type === 'lesson') {
          circuit.lessons.push(item);
        }
        
        // Create school entry if it doesn't exist
        if (!circuit.schools.has(item.school_id)) {
          circuit.schools.set(item.school_id, {
            school_id: item.school_id,
            school_name: item.school_name || `School ID: ${item.school_id}`,
            facilitators: [],
            attendance: [],
            lessons: []
          });
        }
        
        const school = circuit.schools.get(item.school_id);
        
        if (item.data_type === 'facilitator') {
          school.facilitators.push(item);
        } else if (item.data_type === 'attendance') {
          school.attendance.push(item);
        } else if (item.data_type === 'lesson') {
          school.lessons.push(item);
        }
      });
      
      // Convert maps to arrays for rendering
      const circuitsArray = Array.from(circuitMap.values()).map(circuit => ({
        ...circuit,
        schools: Array.from(circuit.schools.values())
      }));
      
      setCircuitsData(circuitsArray);

    } catch(e) {
      console.error(`Error fetching ${title} data:`, e);
      setError(e.message);
      resetData();
    }
    
    setLoading(false);
  }, [filterParams]);

  const resetData = () => {
    setFacilitators([]);
    setAttendance([]);
    setLessonData([]);
    setCircuitsData([]);
  };

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

  if (!facilitators.length && !attendance.length && !lessonData.length) return (
    <Alert severity="info" sx={{ mt: 2 }}>No {title.toLowerCase()} data available for this district.</Alert>
  );

  const metricTypes = transformDataToMetrics(facilitators, attendance, lessonData);
  const stats = getSummaryStats(facilitators, attendance, lessonData);

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
            <Typography variant="h6" gutterBottom>District Facilitator Summary</Typography>
            <Typography variant="body2" color="text.secondary">
              Total: {stats.totalFacilitators} facilitators, {stats.activeFacilitators} active, {stats.inactiveFacilitators} inactive
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Avg. Attendance: {stats.totalAttendancePercentage.toFixed(2)}%, Lessons Taught: {stats.totalLessonsTaught}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h4" 
              color={
                stats.overallStatus === 'Excellent' ? 'success.main' : 
                stats.overallStatus === 'Poor' ? 'error.main' : 'warning.main'
              }
            >
              {stats.overallStatus}
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
            const display = getFacilitatorDisplay(name, metricData);
            
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
                        display.status === 'poor' ? 'Poor' :
                        display.status === 'present' ? 'Present' :
                        display.status === 'absent' ? 'Absent' :
                        display.status === 'active' ? 'Active' :
                        display.status === 'inactive' ? 'Inactive' :
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
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>All District Facilitators</Typography>
          <DataDisplayTable data={facilitators} title="District Facilitators" />
          
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>District Facilitator Attendance & Punctuality</Typography>
          <DataDisplayTable data={attendance} title="District Facilitator Attendance" />

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>District Facilitator Lesson Data</Typography>
          <DataDisplayTable data={lessonData} title="District Facilitator Lessons" />
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
            {/* Reusing the CircuitFacilitatorsView for detailed circuit data */}
            <CircuitFacilitatorsView filterParams={{ circuit_id: circuit.circuit_id, year: filterParams.year, term: filterParams.term, week: filterParams.week }} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}


