
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
import PeopleIcon from '@mui/icons-material/People';
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism';
import Diversity3Icon from '@mui/icons-material/Diversity3';
import HandshakeIcon from '@mui/icons-material/Handshake';
import EventIcon from '@mui/icons-material/Event';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Import the enhanced Circuit and School views for drill-down
import CircuitCommunityInvolvementView from './CircuitCommunityInvolvementView';
import SchoolCommunityInvolvementView from './SchoolCommunityInvolvementView';

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

// Mapping of community involvement types to their display properties
const COMMUNITY_INVOLVEMENT_TYPES = {
  'PTA Meetings': {
    icon: <PeopleIcon sx={{ fontSize: 56 }} />,
    category: 'meetings',
    color: 'primary'
  },
  'Community Outreach': {
    icon: <Diversity3Icon sx={{ fontSize: 56 }} />,
    category: 'outreach',
    color: 'info'
  },
  'Volunteer Activities': {
    icon: <VolunteerActivismIcon sx={{ fontSize: 56 }} />,
    category: 'volunteer',
    color: 'secondary'
  },
  'Partnerships': {
    icon: <HandshakeIcon sx={{ fontSize: 56 }} />,
    category: 'partnerships',
    color: 'success'
  },
  'Events': {
    icon: <EventIcon sx={{ fontSize: 56 }} />,
    category: 'events',
    color: 'warning'
  }
};

// Helper function to get display properties for involvement type
const getInvolvementDisplay = (involvementType, data) => {
  const involvement = COMMUNITY_INVOLVEMENT_TYPES[involvementType] || {
    icon: <HelpOutlineIcon sx={{ fontSize: 56 }} />,
    category: 'other',
    color: 'default'
  };
  
  let status = 'active';
  let statusColor = involvement.color;
  
  if (!data || Object.keys(data).length === 0) {
    status = 'no_data';
    statusColor = 'default';
  } else {
    const hasActive = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('active') ||
        value.toLowerCase().includes('yes') ||
        value.toLowerCase().includes('participating')
      ))
    );
    const hasInactive = Object.values(data).some(value => 
      (typeof value === 'string' && (
        value.toLowerCase().includes('inactive') ||
        value.toLowerCase().includes('no') ||
        value.toLowerCase().includes('not participating')
      ))
    );
    
    if (hasActive && !hasInactive) {
      status = 'active';
      statusColor = 'success';
    } else if (hasInactive) {
      status = 'inactive';
      statusColor = 'error';
    } else {
      status = 'unknown';
      statusColor = 'warning';
    }
  }
  
  return {
    icon: involvement.icon,
    category: involvement.category,
    color: involvement.color,
    status,
    statusColor
  };
};

// Calculate summary stats from the data
const getSummaryStats = (data) => {
  if (!data || data.length === 0) return { active: 0, total: 0, percent: 0, status: 'No Data' };
  
  const total = data.length;
  const active = data.filter(item => {
    const dataKeys = Object.keys(item).filter(key => 
      !['id', 'school_id', 'school_name', 'circuit_id', 'circuit_name', 'year', 'term', 'created_at', 'updated_at'].includes(key)
    );
    
    return dataKeys.some(key => {
      const value = item[key];
      return (typeof value === 'string' && (
        value.toLowerCase().includes('active') ||
        value.toLowerCase().includes('yes') ||
        value.toLowerCase().includes('participating')
      ));
    });
  }).length;
  
  const percent = Math.round((active / total) * 100);
  
  let status = 'Low Engagement';
  if (percent === 100) status = 'Full Engagement';
  else if (percent >= 80) status = 'High Engagement';
  else if (percent >= 60) status = 'Moderate Engagement';
  else if (percent >= 40) status = 'Partial Engagement';
  
  return { active, total, percent, status };
};

// Transform raw data into involvement-based format for summary
const transformDataToInvolvements = (rawData) => {
  if (!rawData || rawData.length === 0) return [];
  
  // Aggregate data for the district level
  const aggregatedData = {};
  rawData.forEach(item => {
    Object.keys(item).forEach(key => {
      if (!['id', 'school_id', 'school_name', 'circuit_id', 'circuit_name', 'year', 'term', 'created_at', 'updated_at'].includes(key)) {
        if (!aggregatedData[key]) {
          aggregatedData[key] = { activeCount: 0, totalCount: 0 };
        }
        // Simple aggregation: count if active/present
        if (typeof item[key] === 'string' && (
          item[key].toLowerCase().includes('active') ||
          item[key].toLowerCase().includes('yes') ||
          item[key].toLowerCase().includes('participating')
        )) {
          aggregatedData[key].activeCount++;
        }
        aggregatedData[key].totalCount++;
      }
    });
  });

  const involvementTypes = Object.keys(COMMUNITY_INVOLVEMENT_TYPES).map(name => {
    const dataForType = aggregatedData[name.toLowerCase().replace(/ /g, '_')] || { activeCount: 0, totalCount: 0 };
    return { name, data: dataForType };
  });
  
  return involvementTypes;
};

export default function DistrictCommunityInvolvementView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [circuitsData, setCircuitsData] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [districtInfo, setDistrictInfo] = useState({});
  const title = 'Community Involvement';

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

      const res = await fetch(`/api/school-report/community-involvement/community-involvement?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const communityData = await res.json();
      setData(communityData);
      
      // Group data by circuit for drill-down
      const circuitMap = new Map();
      communityData.forEach(item => {
        if (!circuitMap.has(item.circuit_id)) {
          circuitMap.set(item.circuit_id, {
            circuit_id: item.circuit_id,
            circuit_name: item.circuit_name || `Circuit ID: ${item.circuit_id}`,
            schools: new Map()
          });
        }
        
        const circuit = circuitMap.get(item.circuit_id);
        
        if (!circuit.schools.has(item.school_id)) {
          circuit.schools.set(item.school_id, {
            school_id: item.school_id,
            school_name: item.school_name || `School ID: ${item.school_id}`,
            involvement: []
          });
        }
        
        circuit.schools.get(item.school_id).involvement.push(item);
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

  const involvementTypes = transformDataToInvolvements(data);
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
            <Typography variant="h6" gutterBottom>District Community Engagement</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.active} of {stats.total} involvement types active across {circuitsData.length} circuits
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
              {stats.percent}% overall engagement
            </Typography>
          </Box>
        </Stack>
      </Paper>
      
      {viewMode === 'card' ? (
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {involvementTypes.map(({ name, data: involvementData }, idx) => {
            const display = getInvolvementDisplay(name, involvementData);
            
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
                        display.status === 'active' ? 'Active' :
                        display.status === 'inactive' ? 'Inactive' :
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
      
      {/* Circuit-by-circuit breakdown */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>Circuit Breakdown</Typography>
      
      {circuitsData.map((circuit) => (
        <Accordion key={circuit.circuit_id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{circuit.circuit_name} - {circuit.schools.length} Schools</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Reusing the CircuitCommunityInvolvementView for detailed circuit data */}
            <CircuitCommunityInvolvementView filterParams={{ circuit_id: circuit.circuit_id, year: filterParams.year, term: filterParams.term }} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}

