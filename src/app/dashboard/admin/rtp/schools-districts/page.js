'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  Grid,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Link as MuiLink,
  Breadcrumbs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Switch,
  FormControlLabel,
  Menu,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Icons
import HomeIcon from '@mui/icons-material/Home';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import SchoolIcon from '@mui/icons-material/School';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FilterListIcon from '@mui/icons-material/FilterList';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoDisturbIcon from '@mui/icons-material/DoDisturb';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import TableChartIcon from '@mui/icons-material/TableChart';

// Import export utilities
import { 
  downloadCSV, 
  createExportFilename,
  fetchAndExportCSV
} from '@/utils/export';

// Import dynamic charts component
import dynamic from 'next/dynamic';
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

// TabPanel component for Tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function SchoolsDistrictsManagementPage() {
  const router = useRouter();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [schools, setSchools] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [filters, setFilters] = useState({
    region: '',
    district: '',
    circuit: '',
    searchTerm: '',
    galopOnly: false
  });
  const [schoolPagination, setSchoolPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    totalCount: 0
  });
  const [districtPagination, setDistrictPagination] = useState({
    page: 0,
    rowsPerPage: 10,
    totalCount: 0
  });
  const [schoolSubmissionStats, setSchoolSubmissionStats] = useState([]);
  const [districtSubmissionStats, setDistrictSubmissionStats] = useState([]);
  const [selectedItinerary, setSelectedItinerary] = useState('');
  const [itineraries, setItineraries] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [showSchoolDetail, setShowSchoolDetail] = useState(false);
  const [showDistrictDetail, setShowDistrictDetail] = useState(false);

  // State for Export Menu
  const [exportMenuAnchor, setExportMenuAnchor] = useState(null);
  
  // Handle export menu open/close
  const handleExportMenuOpen = (event) => {
    setExportMenuAnchor(event.currentTarget);
  };
  
  const handleExportMenuClose = () => {
    setExportMenuAnchor(null);
  };
  
  // Define headers for different export types
  const schoolExportHeaders = [
    { key: 'name', display: 'School Name' },
    { key: 'gesCode', display: 'GES Code' },
    { key: 'district.name', display: 'District' },
    { key: 'circuit.name', display: 'Circuit' },
    { key: 'region.name', display: 'Region' },
    { key: 'isGalop', display: 'GALOP Status' },
    { key: 'schoolOutput', display: 'School Output Completion %' },
    { key: 'districtOutput', display: 'District Output Completion %' },
    { key: 'consolidatedChecklist', display: 'Consolidated Checklist Completion %' },
    { key: 'partnersInPlay', display: 'Partners in Play Completion %' },
    { key: 'responseRate', display: 'Overall Response Rate %' },
    { key: 'lastSubmission', display: 'Last Submission Date' }
  ];
  
  const districtExportHeaders = [
    { key: 'name', display: 'District Name' },
    { key: 'code', display: 'District Code' },
    { key: 'region.name', display: 'Region' },
    { key: 'schoolCount', display: 'Schools Count' },
    { key: 'responseRate', display: 'Response Rate %' },
    { key: 'schoolOutput', display: 'School Output Completion %' },
    { key: 'districtOutput', display: 'District Output Completion %' },
    { key: 'consolidatedChecklist', display: 'Consolidated Checklist Completion %' },
    { key: 'partnersInPlay', display: 'Partners in Play Completion %' },
    { key: 'lastSubmission', display: 'Last Submission Date' }
  ];
  
  // Export data to CSV
  const handleExportCSV = (event) => {
    handleExportMenuOpen(event);
  };
  
  // Handle exporting schools data
  const handleExportSchools = () => {
    handleExportMenuClose();
    
    // Prepare schools data with stats
    const schoolsWithStats = schools.map(school => {
      const stat = schoolSubmissionStats.find(s => s.id === school.id) || {};
      const responseRate = stat ? 
        Math.round((stat.schoolOutput + stat.districtOutput + 
          stat.consolidatedChecklist + stat.partnersInPlay) / 4) : 0;
          
      return {
        ...school,
        ...stat,
        isGalop: stat.isGalop ? 'GALOP School' : 'Non-GALOP School',
        responseRate
      };
    });
    
    // Create filename with filters
    const filename = createExportFilename('rtp-schools', {
      itinerary: selectedItinerary,
      region: filters.region ? regions.find(r => r.id === filters.region)?.name : 'all-regions',
      district: filters.district ? districts.find(d => d.id === filters.district)?.name : 'all-districts',
      galop: filters.galopOnly ? 'galop-only' : 'all-schools'
    });
    
    // Export to CSV
    downloadCSV(schoolsWithStats, schoolExportHeaders, filename);
  };
  
  // Handle exporting districts data
  const handleExportDistricts = () => {
    handleExportMenuClose();
    
    // Prepare districts data with stats
    const districtsWithStats = districts.map(district => {
      const stat = districtSubmissionStats.find(d => d.id === district.id) || {};
      
      return {
        ...district,
        ...stat
      };
    });
    
    // Create filename with filters
    const filename = createExportFilename('rtp-districts', {
      itinerary: selectedItinerary,
      region: filters.region ? regions.find(r => r.id === filters.region)?.name : 'all-regions'
    });
    
    // Export to CSV
    downloadCSV(districtsWithStats, districtExportHeaders, filename);
  };
  
  // Handle exporting all data
  const handleExportAll = () => {
    handleExportMenuClose();
    
    // Export both schools and districts data
    handleExportSchools();
    setTimeout(handleExportDistricts, 500); // Add delay to prevent download conflicts
  };
  
  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch regions, districts, and active itineraries
        const regionsRes = await fetch('/api/regions');
        const regionsData = await regionsRes.json();
        setRegions(regionsData.regions || []);
        
        // Fetch active itineraries
        const itinerariesRes = await fetch('/api/rtp/itineraries');
        const itinerariesData = await itinerariesRes.json();
        const activeItineraries = itinerariesData.itineraries?.filter(it => it.is_valid) || [];
        setItineraries(activeItineraries);
        if (activeItineraries.length > 0) {
          setSelectedItinerary(activeItineraries[0].id);
        }
        
        // Initial schools and districts fetch
        await fetchSchools();
        await fetchDistricts();
      } catch (err) {
        console.error(err);
        setError("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Fetch schools when filters change
  useEffect(() => {
    if (!loading) {
      fetchSchools();
    }
  }, [filters.region, filters.district, filters.galopOnly, schoolPagination.page, schoolPagination.rowsPerPage]);
  
  // Fetch districts when region filter changes
  useEffect(() => {
    fetchDistricts();
    // Reset district filter when region changes
    if (filters.region !== '') {
      setFilters(prev => ({ ...prev, district: '' }));
    }
  }, [filters.region, districtPagination.page, districtPagination.rowsPerPage]);
  
  // Fetch statistics when itinerary selection changes
  useEffect(() => {
    if (selectedItinerary) {
      fetchSchoolSubmissionStats();
      fetchDistrictSubmissionStats();
    }
  }, [selectedItinerary]);
  
  // Fetch schools with filtering
  const fetchSchools = async () => {
    try {
      let url = '/api/schools?';
      const params = [];
      
      if (filters.region) params.push(`regionId=${filters.region}`);
      if (filters.district) params.push(`districtId=${filters.district}`);
      if (filters.searchTerm) params.push(`search=${encodeURIComponent(filters.searchTerm)}`);
      if (filters.galopOnly) params.push('galopOnly=true');
      
      // Add pagination
      params.push(`page=${schoolPagination.page}`);
      params.push(`limit=${schoolPagination.rowsPerPage}`);
      
      url += params.join('&');
      
      const response = await fetch(url);
      const data = await response.json();
      
      setSchools(data.schools || []);
      setSchoolPagination(prev => ({
        ...prev,
        totalCount: data.total || 0
      }));
    } catch (err) {
      console.error('Error fetching schools:', err);
      setError('Failed to load schools data');
    }
  };
  
  // Fetch districts with filtering
  const fetchDistricts = async () => {
    try {
      let url = '/api/districts?';
      const params = [];
      
      if (filters.region) params.push(`regionId=${filters.region}`);
      
      // Add pagination
      params.push(`page=${districtPagination.page}`);
      params.push(`limit=${districtPagination.rowsPerPage}`);
      
      url += params.join('&');
      
      const response = await fetch(url);
      const data = await response.json();
      
      setDistricts(data.districts || []);
      setDistrictPagination(prev => ({
        ...prev,
        totalCount: data.total || 0
      }));
    } catch (err) {
      console.error('Error fetching districts:', err);
      setError('Failed to load districts data');
    }
  };
  
  // Fetch school submission statistics
  const fetchSchoolSubmissionStats = async () => {
    // This would be a real API call in a production environment
    // For now, generate mock data for demonstration
    const mockStats = schools.map(school => ({
      id: school.id,
      name: school.name,
      district: school.district?.name || 'Unknown',
      schoolOutput: Math.floor(Math.random() * 100),
      districtOutput: Math.floor(Math.random() * 100),
      consolidatedChecklist: Math.floor(Math.random() * 100),
      partnersInPlay: Math.floor(Math.random() * 100),
      lastSubmission: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isGalop: Math.random() > 0.5
    }));
    
    setSchoolSubmissionStats(mockStats);
  };
  
  // Fetch district submission statistics
  const fetchDistrictSubmissionStats = async () => {
    // This would be a real API call in a production environment
    // For now, generate mock data for demonstration
    const mockStats = districts.map(district => ({
      id: district.id,
      name: district.name,
      region: district.region?.name || 'Unknown',
      schoolOutput: Math.floor(Math.random() * 100),
      districtOutput: Math.floor(Math.random() * 100),
      consolidatedChecklist: Math.floor(Math.random() * 100),
      partnersInPlay: Math.floor(Math.random() * 100),
      schoolCount: Math.floor(Math.random() * 50) + 5,
      responseRate: Math.floor(Math.random() * 100),
      lastSubmission: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }));
    
    setDistrictSubmissionStats(mockStats);
  };
  
  // Handle search
  const handleSearch = () => {
    if (activeTab === 0) {
      fetchSchools();
    } else {
      fetchDistricts();
    }
  };
  
  // Handle pagination change
  const handleChangePage = (event, newPage) => {
    if (activeTab === 0) {
      setSchoolPagination(prev => ({ ...prev, page: newPage }));
    } else {
      setDistrictPagination(prev => ({ ...prev, page: newPage }));
    }
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (activeTab === 0) {
      setSchoolPagination(prev => ({ 
        ...prev, 
        rowsPerPage: newRowsPerPage,
        page: 0 
      }));
    } else {
      setDistrictPagination(prev => ({ 
        ...prev, 
        rowsPerPage: newRowsPerPage,
        page: 0 
      }));
    }
  };
  
  // Handle itinerary change
  const handleItineraryChange = (event) => {
    setSelectedItinerary(event.target.value);
  };
  
  // Handle school row click
  const handleSchoolRowClick = (school) => {
    setSelectedSchool(school);
    setShowSchoolDetail(true);
  };
  
  // Handle district row click
  const handleDistrictRowClick = (district) => {
    setSelectedDistrict(district);
    setShowDistrictDetail(true);
  };
  
  // Generate school submission chart configuration
  const generateSchoolSubmissionChart = (school) => {
    return {
      options: {
        chart: {
          id: 'school-submission-radar',
          toolbar: {
            show: false
          }
        },
        xaxis: {
          categories: ['School Output', 'District Output', 'Consolidated Checklist', 'Partners in Play']
        },
        yaxis: {
          min: 0,
          max: 100
        },
        title: {
          text: 'Submission Completion Percentages',
          align: 'center'
        },
        plotOptions: {
          radar: {
            polygons: {
              strokeColors: '#e9e9e9',
              fill: {
                colors: ['#f8f8f8', '#fff']
              }
            }
          }
        }
      },
      series: [
        {
          name: 'Completion %',
          data: [
            school.schoolOutput || 0,
            school.districtOutput || 0,
            school.consolidatedChecklist || 0,
            school.partnersInPlay || 0
          ]
        }
      ]
    };
  };
  
  // Generate district submission chart configuration
  const generateDistrictSubmissionChart = (district) => {
    return {
      options: {
        chart: {
          id: 'district-submission-bar',
          toolbar: {
            show: false
          }
        },
        plotOptions: {
          bar: {
            horizontal: false,
          }
        },
        xaxis: {
          categories: ['School Output', 'District Output', 'Consolidated Checklist', 'Partners in Play']
        },
        title: {
          text: 'Submission Counts by Category',
          align: 'center'
        }
      },
      series: [
        {
          name: 'Submissions',
          data: [
            district.schoolOutput || 0,
            district.districtOutput || 0,
            district.consolidatedChecklist || 0,
            district.partnersInPlay || 0
          ]
        }
      ]
    };
  };
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle filter changes
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset pagination when filters change
    if (activeTab === 0) {
      setSchoolPagination(prev => ({ ...prev, page: 0 }));
    } else {
      setDistrictPagination(prev => ({ ...prev, page: 0 }));
    }
  };
  
  // Handle GALOP toggle
  const handleGalopToggle = (event) => {
    setFilters(prev => ({
      ...prev,
      galopOnly: event.target.checked
    }));
  };
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Link href="/dashboard/admin/rtp" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <SportsSoccerIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Right to Play
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <GroupsIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Schools & Districts
        </Typography>
      </Breadcrumbs>
      
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <GroupsIcon sx={{ mr: 2, fontSize: 35, color: 'primary.main' }} />
          Schools & Districts Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<FileDownloadIcon />}
          onClick={handleExportCSV}
        >
          Export Data
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Itinerary Selector */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <Typography variant="h6" gutterBottom>
                  Select Itinerary for Submission Data
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Choose an itinerary to view submission statistics and participation data
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel id="itinerary-select-label">Itinerary</InputLabel>
                  <Select
                    labelId="itinerary-select-label"
                    id="itinerary-select"
                    value={selectedItinerary}
                    label="Itinerary"
                    onChange={handleItineraryChange}
                  >
                    {itineraries.map((itinerary) => (
                      <MenuItem key={itinerary.id} value={itinerary.id}>
                        {itinerary.title} ({itinerary.from_date} to {itinerary.until_date})
                      </MenuItem>
                    ))}
                    {itineraries.length === 0 && (
                      <MenuItem disabled>No active itineraries available</MenuItem>
                    )}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Main Content Area */}
          {showSchoolDetail ? (
            renderSchoolDetail()
          ) : showDistrictDetail ? (
            renderDistrictDetail()
          ) : (
            <>
              {/* Tabs for Schools and Districts */}
              <Paper sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={activeTab} 
                  onChange={handleTabChange} 
                  aria-label="schools and districts tabs"
                  variant="fullWidth"
                >
                  <Tab 
                    icon={<SchoolIcon />} 
                    iconPosition="start" 
                    label="Schools" 
                    id="tab-0" 
                    aria-controls="tabpanel-0" 
                  />
                  <Tab 
                    icon={<LocationCityIcon />} 
                    iconPosition="start" 
                    label="Districts" 
                    id="tab-1" 
                    aria-controls="tabpanel-1" 
                  />
                </Tabs>
              </Paper>
              
              {/* Schools Tab Panel */}
              <TabPanel value={activeTab} index={0}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <FilterListIcon sx={{ mr: 1 }} />
                    Filter Schools
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="region-select-label">Region</InputLabel>
                        <Select
                          labelId="region-select-label"
                          id="region-select"
                          name="region"
                          value={filters.region}
                          label="Region"
                          onChange={handleFilterChange}
                        >
                          <MenuItem value="">All Regions</MenuItem>
                          {regions.map((region) => (
                            <MenuItem key={region.id} value={region.id}>
                              {region.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="district-select-label">District</InputLabel>
                        <Select
                          labelId="district-select-label"
                          id="district-select"
                          name="district"
                          value={filters.district}
                          label="District"
                          onChange={handleFilterChange}
                          disabled={!filters.region}
                        >
                          <MenuItem value="">All Districts</MenuItem>
                          {districts
                            .filter(district => !filters.region || district.region_id === filters.region)
                            .map((district) => (
                              <MenuItem key={district.id} value={district.id}>
                                {district.name}
                              </MenuItem>
                            ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Search Schools"
                        name="searchTerm"
                        value={filters.searchTerm}
                        onChange={handleFilterChange}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch();
                          }
                        }}
                        InputProps={{
                          endAdornment: (
                            <IconButton size="small" onClick={handleSearch}>
                              <SearchIcon />
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={filters.galopOnly}
                            onChange={handleGalopToggle}
                            color="primary"
                          />
                        }
                        label="GALOP Schools Only"
                      />
                    </Grid>
                  </Grid>
                </Paper>
                
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Schools List
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>School Name</TableCell>
                          <TableCell>District</TableCell>
                          <TableCell>GALOP Status</TableCell>
                          <TableCell>Submissions</TableCell>
                          <TableCell>Response Rate</TableCell>
                          <TableCell>Last Submission</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {schools.map((school) => {
                          const schoolStat = schoolSubmissionStats.find(s => s.id === school.id);
                          const submissionRate = schoolStat ? 
                            Math.round((schoolStat.schoolOutput + schoolStat.districtOutput + 
                              schoolStat.consolidatedChecklist + schoolStat.partnersInPlay) / 4) : 0;
                            
                          return (
                            <TableRow 
                              key={school.id}
                              hover
                              onClick={() => handleSchoolRowClick(school)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell>{school.name}</TableCell>
                              <TableCell>{school.district?.name || 'N/A'}</TableCell>
                              <TableCell>
                                {schoolStat?.isGalop ? (
                                  <Chip 
                                    icon={<CheckCircleIcon />}
                                    label="GALOP" 
                                    color="primary" 
                                    size="small" 
                                  />
                                ) : (
                                  <Chip 
                                    icon={<DoDisturbIcon />}
                                    label="Non-GALOP" 
                                    variant="outlined"
                                    size="small" 
                                  />
                                )}
                              </TableCell>
                              <TableCell>
                                {schoolStat ? (
                                  <>
                                    <Tooltip title="School Output">
                                      <Chip 
                                        label={`SO: ${schoolStat.schoolOutput}%`} 
                                        size="small" 
                                        sx={{ mr: 0.5, my: 0.25 }}
                                      />
                                    </Tooltip>
                                    <Tooltip title="District Output">
                                      <Chip 
                                        label={`DO: ${schoolStat.districtOutput}%`} 
                                        size="small" 
                                        sx={{ mr: 0.5, my: 0.25 }}
                                      />
                                    </Tooltip>
                                    <Tooltip title="Consolidated Checklist">
                                      <Chip 
                                        label={`CC: ${schoolStat.consolidatedChecklist}%`} 
                                        size="small" 
                                        sx={{ mr: 0.5, my: 0.25 }}
                                      />
                                    </Tooltip>
                                    <Tooltip title="Partners in Play">
                                      <Chip 
                                        label={`PiP: ${schoolStat.partnersInPlay}%`} 
                                        size="small"
                                        sx={{ my: 0.25 }}
                                      />
                                    </Tooltip>
                                  </>
                                ) : (
                                  'No data'
                                )}
                              </TableCell>
                              <TableCell>
                                {submissionRate}%
                              </TableCell>
                              <TableCell>
                                {schoolStat?.lastSubmission || 'No submissions'}
                              </TableCell>
                              <TableCell align="right">
                                <IconButton 
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSchoolRowClick(school);
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {schools.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              No schools found matching the current filters
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={schoolPagination.totalCount}
                    page={schoolPagination.page}
                    onPageChange={handleChangePage}
                    rowsPerPage={schoolPagination.rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                  />
                </Paper>
              </TabPanel>
              
              {/* Districts Tab Panel */}
              <TabPanel value={activeTab} index={1}>
                <Paper sx={{ p: 3, mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <FilterListIcon sx={{ mr: 1 }} />
                    Filter Districts
                  </Typography>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth size="small">
                        <InputLabel id="region-select-label-district">Region</InputLabel>
                        <Select
                          labelId="region-select-label-district"
                          id="region-select-district"
                          name="region"
                          value={filters.region}
                          label="Region"
                          onChange={handleFilterChange}
                        >
                          <MenuItem value="">All Regions</MenuItem>
                          {regions.map((region) => (
                            <MenuItem key={region.id} value={region.id}>
                              {region.name}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Search Districts"
                        name="searchTerm"
                        value={filters.searchTerm}
                        onChange={handleFilterChange}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch();
                          }
                        }}
                        InputProps={{
                          endAdornment: (
                            <IconButton size="small" onClick={handleSearch}>
                              <SearchIcon />
                            </IconButton>
                          )
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
                
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Districts List
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>District Name</TableCell>
                          <TableCell>Region</TableCell>
                          <TableCell>Schools Count</TableCell>
                          <TableCell>Response Rate</TableCell>
                          <TableCell>Submission Average</TableCell>
                          <TableCell>Last Submission</TableCell>
                          <TableCell align="right">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {districts.map((district) => {
                          const districtStat = districtSubmissionStats.find(d => d.id === district.id);
                          const submissionAvg = districtStat ? 
                            Math.round((districtStat.schoolOutput + districtStat.districtOutput + 
                              districtStat.consolidatedChecklist + districtStat.partnersInPlay) / 4) : 0;
                            
                          return (
                            <TableRow 
                              key={district.id}
                              hover
                              onClick={() => handleDistrictRowClick(district)}
                              sx={{ cursor: 'pointer' }}
                            >
                              <TableCell>{district.name}</TableCell>
                              <TableCell>{district.region?.name || 'N/A'}</TableCell>
                              <TableCell>{districtStat?.schoolCount || 0}</TableCell>
                              <TableCell>{districtStat?.responseRate || 0}%</TableCell>
                              <TableCell>{submissionAvg}%</TableCell>
                              <TableCell>{districtStat?.lastSubmission || 'No submissions'}</TableCell>
                              <TableCell align="right">
                                <IconButton 
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDistrictRowClick(district);
                                  }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                        {districts.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} align="center">
                              No districts found matching the current filters
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    component="div"
                    count={districtPagination.totalCount}
                    page={districtPagination.page}
                    onPageChange={handleChangePage}
                    rowsPerPage={districtPagination.rowsPerPage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                  />
                </Paper>
              </TabPanel>
            </>
          )}
        </>
      )}
    </Container>
  );
}