
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

// Import the enhanced District and Circuit views for drill-down
import DistrictTextbooksView from './DistrictTextbooksView';
import CircuitTextbooksView from './CircuitTextbooksView';

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

// Mapping of textbook types to their display properties
const TEXTBOOK_TYPES = {
  'Mathematics': {
    icon: <BookIcon sx={{ fontSize: 56 }} />,
    category: 'math',
    color: 'primary'
  },
  'Science': {
    icon: <BookIcon sx={{ fontSize: 56 }} />,
    category: 'science',
    color: 'info'
  },
  'English': {
    icon: <BookIcon sx={{ fontSize: 56 }} />,
    category: 'english',
    color: 'secondary'
  },
  'Social Studies': {
    icon: <BookIcon sx={{ fontSize: 56 }} />,
    category: 'social_studies',
    color: 'success'
  },
  'Other': {
    icon: <BookIcon sx={{ fontSize: 56 }} />,
    category: 'other',
    color: 'warning'
  }
};

// Helper function to get display properties for textbook type
const getTextbookDisplay = (textbookType, data) => {
  const textbook = TEXTBOOK_TYPES[textbookType] || {
    icon: <HelpOutlineIcon sx={{ fontSize: 56 }} />,
    category: 'other',
    color: 'default'
  };
  
  let status = 'available';
  let statusColor = textbook.color;
  
  if (!data || Object.keys(data).length === 0) {
    status = 'no_data';
    statusColor = 'default';
  } else {
    const hasAvailable = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('available') ||
        value.toLowerCase().includes('yes') ||
        value.toLowerCase().includes('sufficient')
      ))
    );
    const hasInsufficient = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('insufficient') ||
        value.toLowerCase().includes('no') ||
        value.toLowerCase().includes('missing')
      ))
    );
    
    if (hasAvailable && !hasInsufficient) {
      status = 'available';
      statusColor = 'success';
    } else if (hasInsufficient) {
      status = 'insufficient';
      statusColor = 'error';
    } else {
      status = 'unknown';
      statusColor = 'warning';
    }
  }
  
  return {
    icon: textbook.icon,
    category: textbook.category,
    color: textbook.color,
    status,
    statusColor
  };
};

// Calculate summary stats from the data
const getSummaryStats = (data) => {
  if (!data || data.length === 0) return { available: 0, total: 0, percent: 0, status: 'No Data' };
  
  const total = data.length;
  const available = data.filter(item => {
    const dataKeys = Object.keys(item).filter(key => 
      !['id', 'school_id', 'school_name', 'circuit_id', 'circuit_name', 'district_id', 'district_name', 'year', 'term', 'created_at', 'updated_at'].includes(key)
    );
    
    return dataKeys.some(key => {
      const value = item[key];
      return (typeof value === 'string' && (
        value.toLowerCase().includes('available') ||
        value.toLowerCase().includes('yes') ||
        value.toLowerCase().includes('sufficient')
      ));
    });
  }).length;
  
  const percent = Math.round((available / total) * 100);
  
  let status = 'Low Availability';
  if (percent === 100) status = 'Full Availability';
  else if (percent >= 80) status = 'High Availability';
  else if (percent >= 60) status = 'Moderate Availability';
  else if (percent >= 40) status = 'Partial Availability';
  
  return { available, total, percent, status };
};

// Transform raw data into textbook-based format for summary
const transformDataToTextbooks = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Aggregate data for the region level
  const aggregatedData = {};
  rawData.forEach(item => {
    Object.keys(item).forEach(key => {
      if (!['id', 'school_id', 'school_name', 'circuit_id', 'circuit_name', 'district_id', 'district_name', 'year', 'term', 'created_at', 'updated_at'].includes(key)) {
        if (!aggregatedData[key]) {
          aggregatedData[key] = { availableCount: 0, totalCount: 0 };
        }
        // Simple aggregation: count if available/present
        if (typeof item[key] === 'string' && (
          item[key].toLowerCase().includes('available') ||
          item[key].toLowerCase().includes('yes') ||
          item[key].toLowerCase().includes('sufficient')
        )) {
          aggregatedData[key].availableCount++;
        }
        aggregatedData[key].totalCount++;
      }
    });
  });

  const textbookTypes = Object.keys(TEXTBOOK_TYPES).map(name => {
    const dataForType = aggregatedData[name.toLowerCase().replace(/ /g, '_')] || { availableCount: 0, totalCount: 0 };
    return { name, data: dataForType };
  });
  
  return textbookTypes;
};

export default function RegionTextbooksView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [districtsData, setDistrictsData] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [regionInfo, setRegionInfo] = useState({});
  const title = 'Textbooks';

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

      const res = await fetch(`/api/school-report/management/textbooks?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const textbooksData = await res.json();
      setData(textbooksData);
      
      // Group data by district, circuit, and school for drill-down
      const districtMap = new Map();
      textbooksData.forEach(item => {
        if (!districtMap.has(item.district_id)) {
          districtMap.set(item.district_id, {
            district_id: item.district_id,
            district_name: item.district_name || `District ID: ${item.district_id}`,
            circuits: new Map()
          });
        }
        
        const district = districtMap.get(item.district_id);
        
        if (!district.circuits.has(item.circuit_id)) {
          district.circuits.set(item.circuit_id, {
            circuit_id: item.circuit_id,
            circuit_name: item.circuit_name || `Circuit ID: ${item.circuit_id}`,
            schools: new Map()
          });
        }
        
        const circuit = district.circuits.get(item.circuit_id);
        
        if (!circuit.schools.has(item.school_id)) {
          circuit.schools.set(item.school_id, {
            school_id: item.school_id,
            school_name: item.school_name || `School ID: ${item.school_id}`,
            textbooks: []
          });
        }
        
        circuit.schools.get(item.school_id).textbooks.push(item);
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

  const textbookTypes = transformDataToTextbooks(data);
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
            <Typography variant="h6" gutterBottom>Region Textbook Availability</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.available} of {stats.total} textbook types available across {districtsData.length} districts
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
              {stats.percent}% overall availability
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {viewMode === 'card' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {textbookTypes.map(({ name, data: textbookData }, idx) => {
            const display = getTextbookDisplay(name, textbookData);
            
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
                        display.status === 'available' ? 'Available' :
                        display.status === 'insufficient' ? 'Insufficient' :
                        display.status === 'unknown' ? 'Unknown' : 'No Data'
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
      
      {/* District-by-district breakdown */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>District Breakdown</Typography>
      
      {districtsData.map((district) => (
        <Accordion key={district.district_id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{district.district_name} - {district.circuits.length} Circuits</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Reusing the DistrictTextbooksView for detailed district data */}
            <DistrictTextbooksView filterParams={{ district_id: district.district_id, year: filterParams.year, term: filterParams.term }} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}


