'use client';

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
  ToggleButton
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import WarningIcon from '@mui/icons-material/Warning';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

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

// Mapping of attendance metrics to their display properties
const ATTENDANCE_METRICS = {
  'Daily Attendance': {
    icon: <CalendarTodayIcon sx={{ fontSize: 56 }} />,
    category: 'daily',
    color: 'primary'
  },
  'Present Students': {
    icon: <CheckCircleIcon sx={{ fontSize: 56 }} />,
    category: 'present',
    color: 'success'
  },
  'Absent Students': {
    icon: <CancelIcon sx={{ fontSize: 56 }} />,
    category: 'absent',
    color: 'error'
  },
  'Late Arrivals': {
    icon: <AccessTimeIcon sx={{ fontSize: 56 }} />,
    category: 'late',
    color: 'warning'
  },
  'Attendance Rate': {
    icon: <PersonIcon sx={{ fontSize: 56 }} />,
    category: 'rate',
    color: 'info'
  },
  'Attendance Trend': {
    icon: <TrendingUpIcon sx={{ fontSize: 56 }} />,
    category: 'trend',
    color: 'secondary'
  },
  'Chronic Absenteeism': {
    icon: <WarningIcon sx={{ fontSize: 56 }} />,
    category: 'chronic',
    color: 'error'
  }
};

// Helper function to get display properties for attendance metric
const getAttendanceDisplay = (metricName, data) => {
  const metric = ATTENDANCE_METRICS[metricName] || {
    icon: <HelpOutlineIcon sx={{ fontSize: 56 }} />,
    category: 'other',
    color: 'default'
  };
  
  // Determine attendance status based on data
  let status = 'average';
  let statusColor = metric.color;
  let trendIcon = <TrendingUpIcon sx={{ fontSize: 20 }} />;
  
  if (!data || Object.keys(data).length === 0) {
    status = 'no_data';
    statusColor = 'default';
  } else {
    // Check for attendance indicators in the data
    const hasHighAttendance = Object.values(data).some(value => 
      (typeof value === 'number' && value > 85) ||
      (typeof value === 'string' && (
        value.toLowerCase().includes('high') ||
        value.toLowerCase().includes('excellent') ||
        value.toLowerCase().includes('good') ||
        value.toLowerCase().includes('improving')
      ))
    );
    
    const hasLowAttendance = Object.values(data).some(value => 
      (typeof value === 'number' && value < 70) ||
      (typeof value === 'string' && (
        value.toLowerCase().includes('low') ||
        value.toLowerCase().includes('poor') ||
        value.toLowerCase().includes('declining') ||
        value.toLowerCase().includes('concerning')
      ))
    );
    
    if (hasHighAttendance && !hasLowAttendance) {
      status = 'excellent';
      statusColor = 'success';
      trendIcon = <TrendingUpIcon sx={{ fontSize: 20 }} />;
    } else if (hasHighAttendance && hasLowAttendance) {
      status = 'average';
      statusColor = 'warning';
      trendIcon = <TrendingUpIcon sx={{ fontSize: 20 }} />;
    } else if (hasLowAttendance) {
      status = 'poor';
      statusColor = 'error';
      trendIcon = <TrendingDownIcon sx={{ fontSize: 20 }} />;
    }
  }
  
  return {
    icon: metric.icon,
    category: metric.category,
    color: metric.color,
    status,
    statusColor,
    trendIcon
  };
};

// Calculate summary stats from the data
const getSummaryStats = (data) => {
  if (!data || data.length === 0) return { good: 0, total: 0, percent: 0, status: 'No Data' };
  
  const total = data.length;
  const good = data.filter(item => {
    // Check if attendance is good
    const dataKeys = Object.keys(item).filter(key => 
      !['id', 'school_id', 'year', 'term', 'created_at', 'updated_at'].includes(key)
    );
    
    return dataKeys.some(key => {
      const value = item[key];
      return (typeof value === 'number' && value > 85) ||
             (typeof value === 'string' && (
               value.toLowerCase().includes('high') ||
               value.toLowerCase().includes('excellent') ||
               value.toLowerCase().includes('good') ||
               value.toLowerCase().includes('improving')
             ));
    });
  }).length;
  
  const percent = Math.round((good / total) * 100);
  
  let status = 'Poor Attendance';
  if (percent === 100) status = 'Excellent Attendance';
  else if (percent >= 80) status = 'Good Attendance';
  else if (percent >= 60) status = 'Average Attendance';
  else if (percent >= 40) status = 'Below Average';
  
  return { good, total, percent, status };
};

// Transform raw data into metric-based format
const transformDataToMetrics = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Create sample metrics based on common attendance indicators
  // In a real implementation, this would map actual database fields to metrics
  const metrics = [
    { name: 'Daily Attendance', data: rawData[0] },
    { name: 'Present Students', data: rawData[0] },
    { name: 'Absent Students', data: rawData[0] },
    { name: 'Late Arrivals', data: rawData[0] },
    { name: 'Attendance Rate', data: rawData[0] },
    { name: 'Attendance Trend', data: rawData[0] },
    { name: 'Chronic Absenteeism', data: rawData[0] },
  ];
  
  return metrics;
};

export default function SchoolStudentAttendanceView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [schoolInfo, setSchoolInfo] = useState({});
  const title = 'Student Attendance';

  const fetchData = useCallback(async () => {
    if (!filterParams?.school_id) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    const q = new URLSearchParams();
    ['school_id','year','term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    try {
      // Fetch school info
      const schoolRes = await fetch(`/api/schools/${filterParams.school_id}`);
      if (schoolRes.ok) {
        const schoolData = await schoolRes.json();
        setSchoolInfo(schoolData || {});
      }
      
      // Fetch student attendance data
      const res = await fetch(`/api/school-report/main/student-attendance?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      
      const responseData = await res.json();
      setData(responseData || []);
    } catch (e) {
      console.error(`Error fetching ${title}:`, e);
      setError(e.message);
      setData([]);
    }
    setLoading(false);
  }, [filterParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 3 }}>
        <CircularProgress />
        <Typography variant="body2" sx={{ mt: 1 }}>Loading {title}...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (!data || data.length === 0) {
    return <Alert severity="info" sx={{ mt: 2 }}>No {title.toLowerCase()} data available.</Alert>;
  }

  const metrics = transformDataToMetrics(data);
  const stats = getSummaryStats(data);

  // Handle view mode toggle
  const handleViewModeChange = (event, newMode) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };

  return (
    <Box>
      {/* School info and metadata */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h5">{schoolInfo.name || 'School Report'}</Typography>
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
            <Typography variant="caption" color="text.secondary">District</Typography>
            <Typography variant="body2">{schoolInfo.district || 'N/A'}</Typography>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Typography variant="caption" color="text.secondary">Region</Typography>
            <Typography variant="body2">{schoolInfo.region || 'N/A'}</Typography>
          </Grid>
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
            <Typography variant="h6" gutterBottom>Attendance Performance</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.good} of {stats.total} attendance metrics performing well
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h4" 
              color={
                stats.percent === 100 ? 'success.main' : 
                stats.percent >= 80 ? 'info.main' : 
                stats.percent >= 60 ? 'warning.main' : 'error.main'
              }
            >
              {stats.status}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.percent}% attendance quality
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {viewMode === 'card' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {metrics.map(({ name, data: metricData }, idx) => {
            const display = getAttendanceDisplay(name, metricData);
            
            return (
              <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    '&:hover': { boxShadow: 3 }, 
                    height: '100%',
                    bgcolor: display.statusColor === 'success' ? 'success.50' : 
                            display.statusColor === 'warning' ? 'warning.50' :
                            display.statusColor === 'error' ? 'error.50' : 
                            display.statusColor === 'primary' ? 'primary.50' : 
                            display.statusColor === 'info' ? 'info.50' : 'background.paper',
                    borderColor: display.statusColor === 'success' ? 'success.200' : 
                               display.statusColor === 'warning' ? 'warning.200' :
                               display.statusColor === 'error' ? 'error.200' : 
                               display.statusColor === 'primary' ? 'primary.200' : 
                               display.statusColor === 'info' ? 'info.200' : 'divider'
                  }}
                >
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                        {name}
                      </Typography>
                      {display.trendIcon}
                    </Stack>
                    
                    <Box my={2} sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Box sx={{ 
                        position: 'relative',
                        color: display.statusColor === 'success' ? 'success.main' : 
                               display.statusColor === 'warning' ? 'warning.main' :
                               display.statusColor === 'error' ? 'error.main' : 
                               display.statusColor === 'primary' ? 'primary.main' : 
                               display.statusColor === 'info' ? 'info.main' : 'text.secondary'
                      }}>
                        {display.icon}
                      </Box>
                    </Box>
                    
                    <Chip
                      label={
                        display.status === 'excellent' ? 'Excellent' :
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
    </Box>
  );
}

