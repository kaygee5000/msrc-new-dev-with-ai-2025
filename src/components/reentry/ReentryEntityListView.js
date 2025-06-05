'use client';
import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  Alert,
  Breadcrumbs,
  Link as MuiLink
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GetApp as DownloadIcon,
  Visibility as VisibilityIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  AssignmentReturn as ReturnIcon,
  BarChart as BarChartIcon,
  Sort as SortIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import Link from 'next/link';
import Chart from 'react-apexcharts';
import { useRouter } from 'next/navigation';

/**
 * Reusable component for displaying entity list views
 * @param {Object} props
 * @param {string} props.entityType - Type of entities to display (schools, circuits, districts, regions)
 * @param {string} props.title - Page title
 * @param {string} props.description - Page description
 * @param {Object} props.parentEntity - Parent entity if applicable (e.g., district for schools list)
 * @param {Function} props.fetchEntities - Function to fetch entities
 * @param {Function} props.fetchSummary - Function to fetch summary data
 * @param {string} props.initialSearchTerm - Initial search term from URL
 * @param {Object} props.initialFilters - Initial filters from URL
 */
export default function ReentryEntityListView({
  entityType,
  title,
  description,
  parentEntity = null,
  fetchEntities,
  fetchSummary,
  initialSearchTerm = '',
  initialFilters = {}
}) {
  // State for data
  const [entities, setEntities] = useState([]);
  const [filteredEntities, setFilteredEntities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  // State for pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // State for filtering and sorting
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm || '');
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    metric: 'all',
    threshold: 'all',
    ...initialFilters
  });
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'asc'
  });
  
  // State for export menu
  const [exportAnchorEl, setExportAnchorEl] = useState(null);
  
  // Handle export menu
  const handleExportClick = (event) => {
    setExportAnchorEl(event.currentTarget);
  };
  
  const handleExportClose = () => {
    setExportAnchorEl(null);
  };
  
  const handleExport = (format) => {
    // In a real implementation, this would trigger an API call to generate the export
    console.log(`Exporting data as ${format}`);
    
    // For demo purposes, we'll just show an alert
    alert(`Data would be exported as ${format}`);
    
    handleExportClose();
  };
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle filter changes
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    const newFilterOptions = {
      ...filterOptions,
      [name]: value
    };
    setFilterOptions(newFilterOptions);
    
    // Apply filters and search
    applyFiltersAndSearch(entities, searchTerm, newFilterOptions);
  };

  // Summary card component
function SummaryCard({ title, value, subtitle, icon, color }) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography color="textSecondary" gutterBottom>
                {title}
              </Typography>
              <Typography variant="h4" sx={{ mb: 1 }}>
                {value}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            </Box>
            <Box sx={{ bgcolor: color, p: 1.5, borderRadius: 2, opacity: 0.8 }}>
              {icon}
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  }
  
  
  // Handle sorting
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
    
    // Apply sorting
    const sortedEntities = [...filteredEntities].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'asc' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    console.log("sortedEntities", sortedEntities);
    setFilteredEntities(sortedEntities);
  };
  
  // Apply filters and search
  const applyFiltersAndSearch = (allEntities, query, filters) => {
    let result = [...allEntities];
    
    // Apply search query
    if (query) {
      const lowerCaseQuery = query.toLowerCase();
      result = result.filter(entity => 
        entity.name.toLowerCase().includes(lowerCaseQuery) ||
        (entity.location && entity.location.toLowerCase().includes(lowerCaseQuery))
      );
    }
    
    // Apply status filter
    if (filters.status !== 'all') {
      result = result.filter(entity => entity.status === filters.status);
    }
    
    // Apply metric filter
    if (filters.metric !== 'all') {
      // Apply threshold filter
      if (filters.threshold !== 'all') {
        const threshold = parseInt(filters.threshold, 10);
        
        switch (filters.metric) {
          case 'pregnantInSchool':
            result = result.filter(entity => {
              const value = entity.metrics.pregnantInSchool.value;
              return filters.threshold === 'above' ? value >= threshold : value < threshold;
            });
            break;
          case 'pregnantOutOfSchool':
            result = result.filter(entity => {
              const value = entity.metrics.pregnantOutOfSchool.value;
              return filters.threshold === 'above' ? value >= threshold : value < threshold;
            });
            break;
          case 'reentryCount':
            result = result.filter(entity => {
              const value = entity.metrics.reentryCount.value;
              return filters.threshold === 'above' ? value >= threshold : value < threshold;
            });
            break;
          case 'reentryRate':
            result = result.filter(entity => {
              const value = entity.metrics.reentryRate.value;
              return filters.threshold === 'above' ? value >= threshold : value < threshold;
            });
            break;
          default:
            break;
        }
      }
    }
    
    setFilteredEntities(result);
  };
  
  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Use the provided fetch functions
        const entitiesData = await fetchEntities(entityType, parentEntity);
        const summaryData = await fetchSummary(entityType, parentEntity);
        
        console.log("entitiesData in ReentryEntityListView", entitiesData);
        console.log("summaryData in ReentryEntityListView", summaryData);
        
        // Handle the entities data structure from the API
        const formattedEntities = entitiesData.entities ? entitiesData.entities.map(entity => ({
          id: entity.id.toString(),
          name: entity.name,
          location: entity.location || entity.district_name,
          stats: {
            pregnantInSchool: {
              value: entity.in_school || 0,
              trend: 'stable' // API doesn't provide trend data yet
            },
            pregnantOutOfSchool: {
              value: entity.out_of_school || 0,
              trend: 'stable'
            },
            reentryCount: {
              value: entity.returned || 0,
              trend: 'stable'
            },
            reentryRate: {
              value: entity.reentry_rate || 0,
              trend: 'stable'
            }
          }
        })) : [];
        
        setEntities(formattedEntities);
        setFilteredEntities(formattedEntities);
        setSummary(summaryData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [entityType, parentEntity, fetchEntities, fetchSummary]);

  // Get entity-specific details
  const getEntityDetails = () => {
    switch (entityType) {
      case 'schools':
        return {
          detailPath: '/dashboard/admin/reentry/schools',
          nameLabel: 'School Name',
          locationLabel: 'Location',
          icon: <SchoolIcon sx={{ color: 'white' }} />
        };
      case 'circuits':
        return {
          detailPath: '/dashboard/admin/reentry/circuits',
          nameLabel: 'Circuit Name',
          locationLabel: 'Location',
          icon: <BarChartIcon sx={{ color: 'white' }} />
        };
      case 'districts':
        return {
          detailPath: '/dashboard/admin/reentry/districts',
          nameLabel: 'District Name',
          locationLabel: 'Region',
          icon: <BarChartIcon sx={{ color: 'white' }} />
        };
      case 'regions':
        return {
          detailPath: '/dashboard/admin/reentry/regions',
          nameLabel: 'Region Name',
          locationLabel: 'Country',
          icon: <BarChartIcon sx={{ color: 'white' }} />
        };
      default:
        return {
          detailPath: '/dashboard/admin/reentry',
          nameLabel: 'Name',
          locationLabel: 'Location',
          icon: <BarChartIcon sx={{ color: 'white' }} />
        };
    }
  };

  const entityDetails = getEntityDetails();

  // Loading state
  if (loading) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 5, display: 'flex', justifyContent: 'center' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container maxWidth="xl">
        <Paper sx={{ p: 3, textAlign: 'center', color: 'error.main', my: 5 }}>
          {error}
        </Paper>
      </Container>
    );
  }



  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Breadcrumbs */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Breadcrumbs>
            <MuiLink component={Link} href="/dashboard/admin" underline="hover" color="inherit">
              Dashboard
            </MuiLink>
            <MuiLink component={Link} href="/dashboard/admin/reentry" underline="hover" color="inherit">
              Reentry
            </MuiLink>
            <Typography color="text.primary">{title}</Typography>
          </Breadcrumbs>
          
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => router.push('/dashboard/admin/reentry')}
            variant="outlined"
          >
            Back to Dashboard
          </Button>
        </Box>

        {/* Header */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            {title}
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {description}
          </Typography>
          
          {parentEntity && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Viewing data for {parentEntity.type}: <strong>{parentEntity.name}</strong>
            </Alert>
          )}
        </Paper>

        {/* Summary Cards */}
        {summary && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{xs: 12, sm: 6, md: 3}} sx={{ display: 'flex' }}>
              <SummaryCard
                title="Total Entities"
                value={summary.overview.totalSchools || 0}
                subtitle={`Total number of ${entityType}`}
                icon={entityDetails.icon}
                color="#4CAF50"
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 3}} sx={{ display: 'flex' }}>
              <SummaryCard
                title="Pregnant In School"
                value={summary.overview.pregnantInSchool || 0}
                subtitle="Current students who are pregnant"
                icon={<PersonIcon sx={{ color: 'white' }} />}
                color="#FF9800"
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 3}} sx={{ display: 'flex' }}>
              <SummaryCard
                title="Dropped Out"
                value={summary.overview.droppedOut || 0}
                subtitle="Students who dropped out due to pregnancy"
                icon={<TrendingDownIcon sx={{ color: 'white' }} />}
                color="#F44336"
              />
            </Grid>
            <Grid size={{xs: 12, sm: 6, md: 3}} sx={{ display: 'flex' }}>
              <SummaryCard
                title="Re-entry Rate"
                value={`${summary.overview.reentryRate || 0}%`}
                subtitle={`${summary.overview.returnedToSchool || 0} students returned to school`}
                icon={<ReturnIcon sx={{ color: 'white' }} />}
                color="#2196F3"
              />
            </Grid>
          </Grid>
        )}

        {/* Charts */}
        {summary && summary.charts && (
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{xs: 12, md: 6}}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Top 5 {entityType.charAt(0).toUpperCase() + entityType.slice(1)} by Re-entry Rate
                </Typography>
                <Chart
                  options={{
                    chart: {
                      type: 'bar',
                    },
                    plotOptions: {
                      bar: {
                        horizontal: true,
                        barHeight: '70%',
                      }
                    },
                    dataLabels: {
                      enabled: true,
                      formatter: function (val) {
                        return val + '%';
                      },
                      offsetX: 20
                    },
                    xaxis: {
                      categories: summary.charts.topEntitiesByReentryRate.categories,
                      labels: {
                        formatter: function (val) {
                          return val + '%';
                        }
                      }
                    },
                    colors: ['#4CAF50']
                  }}
                  series={summary.charts.topEntitiesByReentryRate.series}
                  type="bar"
                  height={300}
                />
              </Paper>
            </Grid>
            <Grid size={{xs: 12, md: 6}}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Distribution by Status
                </Typography>
                <Chart
                  options={{
                    chart: {
                      type: 'donut',
                    },
                    labels: summary.charts.statusDistribution.labels,
                    colors: ['#4CAF50', '#F44336', '#FF9800'],
                    legend: {
                      position: 'bottom'
                    },
                    plotOptions: {
                      pie: {
                        donut: {
                          size: '60%'
                        }
                      }
                    }
                  }}
                  series={summary.charts.statusDistribution.series}
                  type="donut"
                  height={300}
                />
              </Paper>
            </Grid>
          </Grid>
        )}

        {/* Search and filter bar */}
        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearchChange}
            sx={{ mr: 2, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={filterOptions.status}
              label="Status"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Metric</InputLabel>
            <Select
              name="metric"
              value={filterOptions.metric}
              label="Metric"
              onChange={handleFilterChange}
            >
              <MenuItem value="all">All Metrics</MenuItem>
              <MenuItem value="pregnantInSchool">Pregnant In School</MenuItem>
              <MenuItem value="pregnantOutOfSchool">Pregnant Out of School</MenuItem>
              <MenuItem value="reentryCount">Re-entry Count</MenuItem>
              <MenuItem value="reentryRate">Re-entry Rate</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth size="small">
            <InputLabel>Threshold</InputLabel>
            <Select
              name="threshold"
              value={filterOptions.threshold}
              label="Threshold"
              onChange={handleFilterChange}
              disabled={filterOptions.metric === 'all'}
            >
              <MenuItem value="all">No Threshold</MenuItem>
              <MenuItem value="above">Above</MenuItem>
              <MenuItem value="below">Below</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExportClick}
            fullWidth
          >
            Export
          </Button>
          <Menu
            anchorEl={exportAnchorEl}
            open={Boolean(exportAnchorEl)}
            onClose={handleExportClose}
          >
            <MenuItem onClick={() => handleExport('csv')}>CSV</MenuItem>
            <MenuItem onClick={() => handleExport('excel')}>Excel</MenuItem>
            <MenuItem onClick={() => handleExport('pdf')}>PDF</MenuItem>
          </Menu>
        </Box>

        {/* Entities Table */}
        <Paper sx={{ width: '100%', mb: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2">{entityDetails.nameLabel}</Typography>
                      <IconButton size="small" onClick={() => handleSort('name')}>
                        <SortIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>{entityDetails.locationLabel}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2">Pregnant In School</Typography>
                      <IconButton size="small" onClick={() => handleSort('metrics.pregnantInSchool.value')}>
                        <SortIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2">Pregnant Out of School</Typography>
                      <IconButton size="small" onClick={() => handleSort('metrics.pregnantOutOfSchool.value')}>
                        <SortIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2">Re-entry Count</Typography>
                      <IconButton size="small" onClick={() => handleSort('metrics.reentryCount.value')}>
                        <SortIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="subtitle2">Re-entry Rate</Typography>
                      <IconButton size="small" onClick={() => handleSort('metrics.reentryRate.value')}>
                        <SortIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEntities.length > 0 ? (
                  filteredEntities
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((entity) => (
                      <TableRow key={entity.id} hover>
                        <TableCell component="th" scope="row">
                          {entity.name}
                        </TableCell>
                        <TableCell>{entity.location || entity.district_name}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {entity.stats?.pregnantInSchool?.value}
                            {entity.stats?.pregnantInSchool?.trend === 'up' ? (
                              <TrendingUpIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                            ) : (
                              <TrendingDownIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {entity.stats?.pregnantOutOfSchool?.value}
                            {entity.stats?.pregnantOutOfSchool?.trend === 'up' ? (
                              <TrendingUpIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                            ) : (
                              <TrendingDownIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {entity.stats?.reentryCount?.value}
                            {entity.stats?.reentryCount?.trend === 'up' ? (
                              <TrendingUpIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                            ) : (
                              <TrendingDownIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {entity.stats?.reentryRate?.value}%
                            {entity.stats?.reentryRate?.trend === 'up' ? (
                              <TrendingUpIcon color="success" fontSize="small" sx={{ ml: 1 }} />
                            ) : (
                              <TrendingDownIcon color="error" fontSize="small" sx={{ ml: 1 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              component={Link}
                              href={`${entityDetails.detailPath}/${entity.id}`}
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Typography variant="body1" sx={{ py: 2 }}>
                        No entities found matching your criteria.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredEntities.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Paper>
      </Box>
    </Container>
  );
}
