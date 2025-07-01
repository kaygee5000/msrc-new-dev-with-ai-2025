
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
import LockIcon from '@mui/icons-material/Lock';
import SecurityIcon from '@mui/icons-material/Security';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import FenceIcon from '@mui/icons-material/Fence';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PersonIcon from '@mui/icons-material/Person';

// Import the enhanced District and Circuit views for drill-down
import DistrictFacilitatorsView from './DistrictFacilitatorsView';
import CircuitFacilitatorsView from './CircuitFacilitatorsView';

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

// Mapping of security metrics to their display properties
const SECURITY_METRICS = {
  'Overall Security': {
    icon: <SecurityIcon sx={{ fontSize: 56 }} />,
    category: 'overall_security',
    color: 'primary'
  },
  'Fencing': {
    icon: <FenceIcon sx={{ fontSize: 56 }} />,
    category: 'fencing',
    color: 'info'
  },
  'Gates': {
    icon: <LockIcon sx={{ fontSize: 56 }} />,
    category: 'gates',
    color: 'secondary'
  },
  'CCTV Cameras': {
    icon: <CameraAltIcon sx={{ fontSize: 56 }} />,
    category: 'cctv_cameras',
    color: 'success'
  },
  'Security Personnel': {
    icon: <PersonIcon sx={{ fontSize: 56 }} />,
    category: 'security_personnel',
    color: 'warning'
  }
};

// Helper function to get display properties for security metric
const getSecurityDisplay = (metricType, data) => {
  const metric = SECURITY_METRICS[metricType] || {
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
    if (metricType === 'Overall Security') {
      if (value === 'Excellent') status = 'excellent';
      else if (value === 'Good') status = 'good';
      else if (value === 'Average') status = 'average';
      else status = 'poor';
      statusColor = status === 'excellent' ? 'success' : status === 'good' ? 'info' : status === 'average' ? 'warning' : 'error';
    } else if (metricType === 'Fencing' || metricType === 'Gates' || metricType === 'CCTV Cameras') {
      if (value === 'Adequate') status = 'adequate';
      else if (value === 'Partial') status = 'partial';
      else status = 'inadequate';
      statusColor = status === 'adequate' ? 'success' : status === 'partial' ? 'warning' : 'error';
    } else if (metricType === 'Security Personnel') {
      if (value > 0) status = 'present';
      else status = 'absent';
      statusColor = status === 'present' ? 'success' : 'error';
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

  let status = 'Mixed Security';
  if (adequate === total && total > 0) status = 'Excellent Security';
  else if (inadequate === total && total > 0) status = 'Poor Security';
  
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
          aggregatedData[key] = { count: 0, adequate: 0, partial: 0, inadequate: 0, present: 0, absent: 0 };
        }
        if (typeof item[key] === 'string') {
          aggregatedData[key].count++;
          if (item[key] === 'Adequate') aggregatedData[key].adequate++;
          else if (item[key] === 'Partial') aggregatedData[key].partial++;
          else aggregatedData[key].inadequate++;
        } else if (typeof item[key] === 'number') {
          aggregatedData[key].count++;
          if (item[key] > 0) aggregatedData[key].present++;
          else aggregatedData[key].absent++;
        }
      }
    });
  });

  const metricTypes = Object.keys(SECURITY_METRICS).map(name => {
    const dataForType = aggregatedData[name.toLowerCase().replace(/ /g, '_')] || { count: 0 };
    let value;
    if (name === 'Overall Security') {
      if (dataForType.count === 0) value = undefined;
      else if (dataForType.adequate === dataForType.count) value = 'Excellent';
      else if (dataForType.inadequate === dataForType.count) value = 'Poor';
      else value = 'Mixed';
    } else if (name === 'Fencing' || name === 'Gates' || name === 'CCTV Cameras') {
      if (dataForType.count === 0) value = undefined;
      else if (dataForType.adequate === dataForType.count) value = 'Adequate';
      else if (dataForType.inadequate === dataForType.count) value = 'Inadequate';
      else value = 'Partial';
    } else if (name === 'Security Personnel') {
      value = dataForType.present;
    }
    return { name, data: { value } };
  });
  
  return metricTypes;
};

export default function RegionFacilitatorsView({ filterParams }) {
  const [facilitators, setFacilitators] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [lessonData, setLessonData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [districtsData, setDistrictsData] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [regionInfo, setRegionInfo] = useState({});
  const title = 'Facilitators';

  const fetchData = useCallback(async () => {
    if (!filterParams?.region_id) {
      resetData();
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const q = new URLSearchParams();
    ['region_id', 'year', 'term', 'week'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    
    try {
      // Fetch region info
      const regionRes = await fetch(`/api/regions/${filterParams.region_id}`);
      if (regionRes.ok) {
        const regionData = await regionRes.json();
        setRegionInfo(regionData || {});
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
      
      // Group all data by district, circuit, and school
      const allData = [
        ...facilitatorsData.map(item => ({ ...item, data_type: 'facilitator' })),
        ...attendanceData.map(item => ({ ...item, data_type: 'attendance' })),
        ...lessonData.map(item => ({ ...item, data_type: 'lesson' }))
      ];
      
      // Create district map
      const districtMap = new Map();
      
      allData.forEach(item => {
        // Create district entry if it doesn't exist
        if (!districtMap.has(item.district_id)) {
          districtMap.set(item.district_id, {
            district_id: item.district_id,
            district_name: item.district_name || `District ID: ${item.district_id}`,
            circuits: new Map(),
            facilitators: [],
            attendance: [],
            lessons: []
          });
        }
        
        const district = districtMap.get(item.district_id);
        
        if (item.data_type === 'facilitator') {
          district.facilitators.push(item);
        } else if (item.data_type === 'attendance') {
          district.attendance.push(item);
        } else if (item.data_type === 'lesson') {
          district.lessons.push(item);
        }
        
        // Create circuit entry if it doesn't exist
        if (!district.circuits.has(item.circuit_id)) {
          district.circuits.set(item.circuit_id, {
            circuit_id: item.circuit_id,
            circuit_name: item.circuit_name || `Circuit ID: ${item.circuit_id}`,
            schools: new Map(),
            facilitators: [],
            attendance: [],
            lessons: []
          });
        }
        
        const circuit = district.circuits.get(item.circuit_id);
        
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
      const districtsArray = Array.from(districtMap.values()).map(district => ({
        ...district,
        circuits: Array.from(district.circuits.values()).map(circuit => ({
          ...circuit,
          schools: Array.from(circuit.schools.values())
        }))
      }));
      
      setDistrictsData(districtsArray);
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
    setDistrictsData([]);
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
    <Alert severity="info" sx={{ mt: 2 }}>No {title.toLowerCase()} data available for this region.</Alert>
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
            <Typography variant="h6" gutterBottom>Region Facilitator Summary</Typography>
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
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>All Region Facilitators</Typography>
          <DataDisplayTable data={facilitators} title="Region Facilitators" />
          
          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Region Facilitator Attendance & Punctuality</Typography>
          <DataDisplayTable data={attendance} title="Region Facilitator Attendance" />

          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Region Facilitator Lesson Data</Typography>
          <DataDisplayTable data={lessonData} title="Region Facilitator Lessons" />
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
            {/* Reusing the DistrictFacilitatorsView for detailed district data */}
            <DistrictFacilitatorsView filterParams={{ district_id: district.district_id, year: filterParams.year, term: filterParams.term, week: filterParams.week }} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}


