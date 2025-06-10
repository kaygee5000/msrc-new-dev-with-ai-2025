
import { useState, useEffect, useCallback } from 'react';
import NProgress from 'nprogress';
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
  AccordionDetails,
  Button,
  Skeleton
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

// Import the enhanced District and Circuit views for drill-down
import DistrictCommunityInvolvementView from './DistrictCommunityInvolvementView';
import CircuitCommunityInvolvementView from './CircuitCommunityInvolvementView';

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
      !['id', 'school_id', 'school_name', 'circuit_id', 'circuit_name', 'district_id', 'district_name', 'year', 'term', 'created_at', 'updated_at'].includes(key)
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
  
  // Aggregate data for the region level
  const aggregatedData = {};
  rawData.forEach(item => {
    Object.keys(item).forEach(key => {
      if (!['id', 'school_id', 'school_name', 'circuit_id', 'circuit_name', 'district_id', 'district_name', 'year', 'term', 'created_at', 'updated_at'].includes(key)) {
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

export default function RegionCommunityInvolvementView({ filterParams, loadOnDemand = false, reportTitle = 'Community Involvement' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [districtsData, setDistrictsData] = useState([]);
  const [viewMode, setViewMode] = useState('card');
  const [regionInfo, setRegionInfo] = useState({});
  const [dataLoaded, setDataLoaded] = useState(!loadOnDemand);
  const title = 'Community Involvement';

  const fetchData = useCallback(async () => {
    NProgress.start();
    setLoading(true);
    setError(null);
    setDataLoaded(false); // Reset before fetch attempt
    if (!filterParams?.region_id) {
      setData(null);
      setDistrictsData([]);
      setRegionInfo({});
      setLoading(false);
      NProgress.done();
      if (!loadOnDemand) setDataLoaded(true); // Considered 'loaded' as empty if not on-demand
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

      const res = await fetch(`/api/school-report/community-involvement/community-involvement?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      const communityData = await res.json();
      setData(communityData);
      
      // Group data by district, circuit, and school for drill-down
      const districtMap = new Map();
      communityData.forEach(item => {
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
            involvement: []
          });
        }
        
        circuit.schools.get(item.school_id).involvement.push(item);
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
      setDataLoaded(true); // Data successfully loaded

    } catch(e) { 
      console.error(`Error fetching ${title} data:`, e); 
      setError(e.message); 
      setData(null);
      setDistrictsData([]);
      // dataLoaded remains false if an error occurs
    } finally {
      setLoading(false);
      NProgress.done();
    }
  }, [filterParams]);

  useEffect(() => {
    if (!loadOnDemand) {
      fetchData();
    } else {
      setData(null);
      setDistrictsData([]);
      setError(null);
      setLoading(false);
      setDataLoaded(false);
      if (NProgress.isStarted()) NProgress.done();
    }
  }, [filterParams, loadOnDemand, fetchData]);

  // --- Conditional Rendering --- 

  // On-demand load button
  if (loadOnDemand && !dataLoaded && !loading && !error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 3, minHeight: 200 }}>
        <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            {reportTitle} Data
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Click the button to load the {reportTitle.toLowerCase()} data for the selected region.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={async () => { NProgress.start(); setLoading(true); setError(null); await fetchData(); setDataLoaded(true); NProgress.done(); }}
            startIcon={<VolunteerActivismIcon />}
          >
            Load {reportTitle} Data
          </Button>
        </Paper>
      </Box>
    );
  }

  // Skeleton loader
  if (loading) {
    if (!NProgress.isStarted()) NProgress.start();
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
          <Skeleton variant="text" width={180} sx={{ mr: 1 }} /> <CircularProgress size={20} />
        </Typography>
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom><Skeleton width="50%" /></Typography>
          <Grid container spacing={2}>
            <Grid size="xs"><Skeleton variant="text" width="70%" /><Skeleton variant="text" width="90%" /></Grid>
            <Grid size="xs"><Skeleton variant="text" width="70%" /><Skeleton variant="text" width="90%" /></Grid>
          </Grid>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom><Skeleton width="40%" /></Typography>
          <Grid container spacing={2}>
            <Grid size="xs"><Skeleton variant="text" width="80%" /><Skeleton variant="text" width="60%" /></Grid>
            <Grid size="xs"><Skeleton variant="text" width="80%" /><Skeleton variant="text" width="60%" /></Grid>
          </Grid>
        </Paper>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[...Array(4)].map((_, i) => (
            <Grid size="xs" key={i}>
              <Skeleton variant="rectangular" height={150} />
            </Grid>
          ))}
        </Grid>
        {[...Array(2)].map((_, i) => (
          <Paper key={i} variant="outlined" sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Skeleton width="60%" />
            </AccordionSummary>
          </Paper>
        ))}
      </Box>
    );
  } else {
    if (NProgress.isStarted()) NProgress.done();
  }

  // Error state
  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ p: 3, minHeight: 200 }}>
        <Alert severity="error" action={
          <Button color="inherit" size="small" onClick={fetchData} sx={{ml: 2}}>
            TRY AGAIN
          </Button>
        }>
          <Typography fontWeight="bold">{reportTitle} Data Error</Typography>
          {error}
        </Alert>
      </Box>
    );
  }

  // No data state
  if (!data || data.length === 0) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No {reportTitle.toLowerCase()} data available for this region.
        <Button color="primary" size="small" onClick={fetchData} sx={{ml: 2}}>
          REFRESH
        </Button>
      </Alert>
    );
  }

  const involvementTypes = data ? transformDataToInvolvements(data) : [];
  const stats = data ? getSummaryStats(data) : { active: 0, total: 0, percent: 0, status: 'No Data' };

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
          <Grid size="xs">
            <Typography variant="caption" color="text.secondary">Year</Typography>
            <Typography variant="body2">{filterParams.year || 'N/A'}</Typography>
          </Grid>
          <Grid size="xs">
            <Typography variant="caption" color="text.secondary">Term</Typography>
            <Typography variant="body2">{filterParams.term || 'N/A'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary stats */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" spacing={3} alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" gutterBottom>Region Community Engagement</Typography>
            <Typography variant="body2" color="text.secondary">
              {stats.active} of {stats.total} involvement types active across {districtsData.length} districts
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
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={idx}>
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
      
      {/* District-by-district breakdown */}
      <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>District Breakdown</Typography>
      
      {districtsData.map((district) => (
        <Accordion key={district.district_id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{district.district_name} - {district.circuits.length} Circuits</Typography>
          </AccordionSummary>
          <AccordionDetails>
            {/* Reusing the DistrictCommunityInvolvementView for detailed district data */}
            <DistrictCommunityInvolvementView filterParams={{ district_id: district.district_id, year: filterParams.year, term: filterParams.term }} />
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}


