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
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssignmentIcon from '@mui/icons-material/Assignment';
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import ArchiveIcon from '@mui/icons-material/Archive';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import BookmarkIcon from '@mui/icons-material/Bookmark';
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

// Mapping of record book types to their display properties
const RECORD_BOOK_TYPES = {
  'Attendance Records': {
    icon: <AssignmentIcon sx={{ fontSize: 56 }} />,
    category: 'attendance',
    color: 'primary'
  },
  'Academic Records': {
    icon: <MenuBookIcon sx={{ fontSize: 56 }} />,
    category: 'academic',
    color: 'info'
  },
  'Administrative Files': {
    icon: <FolderIcon sx={{ fontSize: 56 }} />,
    category: 'admin',
    color: 'secondary'
  },
  'Student Records': {
    icon: <DescriptionIcon sx={{ fontSize: 56 }} />,
    category: 'student',
    color: 'success'
  },
  'Financial Records': {
    icon: <ArchiveIcon sx={{ fontSize: 56 }} />,
    category: 'financial',
    color: 'warning'
  },
  'Library Records': {
    icon: <LibraryBooksIcon sx={{ fontSize: 56 }} />,
    category: 'library',
    color: 'info'
  },
  'Policy Documents': {
    icon: <BookmarkIcon sx={{ fontSize: 56 }} />,
    category: 'policy',
    color: 'primary'
  }
};

// Helper function to get display properties for record book type
const getRecordDisplay = (recordType, data) => {
  const record = RECORD_BOOK_TYPES[recordType] || {
    icon: <HelpOutlineIcon sx={{ fontSize: 56 }} />,
    category: 'other',
    color: 'default'
  };
  
  // Determine record status based on data
  let status = 'maintained';
  let statusColor = record.color;
  
  if (!data || Object.keys(data).length === 0) {
    status = 'no_data';
    statusColor = 'default';
  } else {
    // Check for record maintenance indicators in the data
    const hasGoodMaintenance = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('complete') ||
        value.toLowerCase().includes('updated') ||
        value.toLowerCase().includes('current') ||
        value.toLowerCase().includes('maintained') ||
        value.toLowerCase().includes('available')
      ))
    );
    
    const hasPoorMaintenance = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('incomplete') ||
        value.toLowerCase().includes('outdated') ||
        value.toLowerCase().includes('missing') ||
        value.toLowerCase().includes('poor') ||
        value.toLowerCase().includes('unavailable')
      ))
    );
    
    if (hasGoodMaintenance && !hasPoorMaintenance) {
      status = 'excellent';
      statusColor = 'success';
    } else if (hasGoodMaintenance && hasPoorMaintenance) {
      status = 'fair';
      statusColor = 'warning';
    } else if (hasPoorMaintenance) {
      status = 'poor';
      statusColor = 'error';
    }
  }
  
  return {
    icon: record.icon,
    category: record.category,
    color: record.color,
    status,
    statusColor
  };
};

// Calculate summary stats from the data
const getSummaryStats = (data) => {
  if (!data || data.length === 0) return { maintained: 0, total: 0, percent: 0, status: 'No Data' };
  
  const total = data.length;
  const maintained = data.filter(item => {
    // Check if the record is well maintained
    const dataKeys = Object.keys(item).filter(key => 
      !['id', 'school_id', 'year', 'term', 'created_at', 'updated_at'].includes(key)
    );
    
    return dataKeys.some(key => {
      const value = item[key];
      return (typeof value === 'string' && (
        value.toLowerCase().includes('complete') ||
        value.toLowerCase().includes('updated') ||
        value.toLowerCase().includes('current') ||
        value.toLowerCase().includes('maintained') ||
        value.toLowerCase().includes('available')
      ));
    });
  }).length;
  
  const percent = Math.round((maintained / total) * 100);
  
  let status = 'Poor Records';
  if (percent === 100) status = 'Excellent Records';
  else if (percent >= 80) status = 'Well Maintained';
  else if (percent >= 60) status = 'Adequately Maintained';
  else if (percent >= 40) status = 'Partially Maintained';
  
  return { maintained, total, percent, status };
};

// Transform raw data into record-based format
const transformDataToRecords = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Create sample record types based on common school record keeping
  // In a real implementation, this would map actual database fields to record types
  const recordTypes = [
    { name: 'Attendance Records', data: rawData[0] },
    { name: 'Academic Records', data: rawData[0] },
    { name: 'Administrative Files', data: rawData[0] },
    { name: 'Student Records', data: rawData[0] },
    { name: 'Financial Records', data: rawData[0] },
    { name: 'Library Records', data: rawData[0] },
    { name: 'Policy Documents', data: rawData[0] },
  ];
  
  return recordTypes;
};

export default function SchoolRecordBooksView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [schoolInfo, setSchoolInfo] = useState({});
  const title = 'Record Books';

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
      
      // Fetch record books data
      const res = await fetch(`/api/school-report/management/record-books?${q}`);
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

  const recordTypes = transformDataToRecords(data);
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
            <Typography variant="h6" gutterBottom>Record Keeping Status</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.maintained} of {stats.total} record types well maintained
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
              {stats.percent}% record maintenance
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {viewMode === 'card' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {recordTypes.map(({ name, data: recordData }, idx) => {
            const display = getRecordDisplay(name, recordData);
            
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
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 1 }}>
                      {name}
                    </Typography>
                    
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
                        display.status === 'maintained' ? 'Maintained' :
                        display.status === 'fair' ? 'Fair' :
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

