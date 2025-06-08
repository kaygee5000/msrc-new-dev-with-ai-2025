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
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SchoolIcon from '@mui/icons-material/School';
import CalculateIcon from '@mui/icons-material/Calculate';
import ScienceIcon from '@mui/icons-material/Science';
import LanguageIcon from '@mui/icons-material/Language';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
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

// Mapping of textbook subjects to their display properties
const TEXTBOOK_SUBJECTS = {
  'English': {
    icon: <LanguageIcon sx={{ fontSize: 56 }} />,
    category: 'language',
    color: 'primary'
  },
  'Mathematics': {
    icon: <CalculateIcon sx={{ fontSize: 56 }} />,
    category: 'mathematics',
    color: 'info'
  },
  'Science': {
    icon: <ScienceIcon sx={{ fontSize: 56 }} />,
    category: 'science',
    color: 'success'
  },
  'Social Studies': {
    icon: <HistoryEduIcon sx={{ fontSize: 56 }} />,
    category: 'social',
    color: 'warning'
  },
  'Reading': {
    icon: <AutoStoriesIcon sx={{ fontSize: 56 }} />,
    category: 'reading',
    color: 'secondary'
  },
  'General': {
    icon: <MenuBookIcon sx={{ fontSize: 56 }} />,
    category: 'general',
    color: 'info'
  },
  'Library Books': {
    icon: <LibraryBooksIcon sx={{ fontSize: 56 }} />,
    category: 'library',
    color: 'primary'
  }
};

// Helper function to get display properties for a textbook subject
const getSubjectDisplay = (subjectName, data) => {
  const subject = TEXTBOOK_SUBJECTS[subjectName] || {
    icon: <HelpOutlineIcon sx={{ fontSize: 56 }} />,
    category: 'other',
    color: 'default'
  };
  
  // Determine availability status based on data
  let status = 'available';
  let statusColor = subject.color;
  
  if (!data || Object.keys(data).length === 0) {
    status = 'no_data';
    statusColor = 'default';
  } else {
    // Check for availability indicators in the data
    const hasBooks = Object.values(data).some(value => 
      (typeof value === 'number' && value > 0) ||
      (typeof value === 'string' && (
        value.toLowerCase().includes('available') ||
        value.toLowerCase().includes('yes') ||
        value.toLowerCase().includes('adequate')
      ))
    );
    
    const hasShortage = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('shortage') ||
        value.toLowerCase().includes('inadequate') ||
        value.toLowerCase().includes('insufficient')
      ))
    );
    
    if (hasBooks && !hasShortage) {
      status = 'adequate';
      statusColor = 'success';
    } else if (hasBooks && hasShortage) {
      status = 'shortage';
      statusColor = 'warning';
    } else {
      status = 'unavailable';
      statusColor = 'error';
    }
  }
  
  return {
    icon: subject.icon,
    category: subject.category,
    color: subject.color,
    status,
    statusColor
  };
};

// Calculate summary stats from the data
const getSummaryStats = (data) => {
  if (!data || data.length === 0) return { adequate: 0, total: 0, percent: 0, status: 'No Data' };
  
  const total = data.length;
  const adequate = data.filter(item => {
    // Check if the item has adequate textbook availability
    const dataKeys = Object.keys(item).filter(key => 
      !['id', 'school_id', 'year', 'term', 'created_at', 'updated_at'].includes(key)
    );
    
    return dataKeys.some(key => {
      const value = item[key];
      return (typeof value === 'number' && value > 0) ||
             (typeof value === 'string' && (
               value.toLowerCase().includes('adequate') ||
               value.toLowerCase().includes('available') ||
               value.toLowerCase().includes('yes')
             ));
    });
  }).length;
  
  const percent = Math.round((adequate / total) * 100);
  
  let status = 'Critical Shortage';
  if (percent === 100) status = 'Fully Stocked';
  else if (percent >= 75) status = 'Well Stocked';
  else if (percent >= 50) status = 'Adequate';
  else if (percent >= 25) status = 'Shortage';
  
  return { adequate, total, percent, status };
};

// Transform raw data into subject-based format
const transformDataToSubjects = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Create sample subjects based on common textbook categories
  // In a real implementation, this would map actual database fields to subjects
  const subjects = [
    { name: 'English', data: rawData[0] },
    { name: 'Mathematics', data: rawData[0] },
    { name: 'Science', data: rawData[0] },
    { name: 'Social Studies', data: rawData[0] },
    { name: 'Reading', data: rawData[0] },
    { name: 'Library Books', data: rawData[0] },
  ];
  
  return subjects;
};

export default function SchoolTextbooksView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('card');
  const [schoolInfo, setSchoolInfo] = useState({});
  const title = 'Textbooks';

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
      
      // Fetch textbooks data
      const res = await fetch(`/api/school-report/management/textbooks?${q}`);
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

  const subjects = transformDataToSubjects(data);
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
            <Typography variant="h6" gutterBottom>Textbook Availability</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.adequate} of {stats.total} subjects adequately stocked
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography 
              variant="h4" 
              color={
                stats.percent === 100 ? 'success.main' : 
                stats.percent >= 75 ? 'info.main' : 
                stats.percent >= 50 ? 'warning.main' : 'error.main'
              }
            >
              {stats.status}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {stats.percent}% textbook availability
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {viewMode === 'card' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {subjects.map(({ name, data: subjectData }, idx) => {
            const display = getSubjectDisplay(name, subjectData);
            
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
                        display.status === 'adequate' ? 'Adequate' :
                        display.status === 'shortage' ? 'Shortage' :
                        display.status === 'unavailable' ? 'Unavailable' : 'No Data'
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

