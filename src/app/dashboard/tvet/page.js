'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  CircularProgress, 
  Alert, 
  Card, 
  CardContent, 
  Stack, 
  Chip, 
  IconButton,
  Divider
} from '@mui/material';
import { 
  School, 
  Work, 
  TrendingUp, 
  TrendingDown, 
  TrendingFlat, 
  Download, 
  Engineering,
  Groups,
  Assessment,
  Business,
  Verified,
  Build
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const fetchTvetData = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/tvet-dashboard?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch TVET data');
  }

  const { data, summary, trends } = result;

  // Process the data to fit the frontend structure
  const processedData = {
    summary: {},
    programs: [],
    infrastructure: [],
    performance: [],
    partnerships: [],
    trends: [],
  };

  if (data && data.length > 0) {
    // Aggregate indicators across all records
    const totalRecords = data.length;
    
    // Summary statistics
    processedData.summary = {
      totalInstitutions: summary.total_institutions,
      averageEnrollment: summary.average_enrollment,
      completionRate: summary.completion_rate_avg,
      employmentRate: summary.employment_rate_avg,
      accreditedPercentage: summary.accredited_percentage
    };

    // Process programs data
    const programCounts = {};
    data.forEach(record => {
      if (record.indicators.programs_offered && Array.isArray(record.indicators.programs_offered)) {
        record.indicators.programs_offered.forEach(program => {
          programCounts[program] = (programCounts[program] || 0) + 1;
        });
      }
    });

    processedData.programs = Object.entries(programCounts).map(([program, count]) => ({
      name: program,
      count,
      percentage: ((count / totalRecords) * 100).toFixed(1)
    }));

    // Process infrastructure data
    processedData.infrastructure = [
      {
        name: 'Workshops Available',
        available: data.filter(d => d.indicators.workshops_available).length,
        notAvailable: data.filter(d => !d.indicators.workshops_available).length,
        percentage: ((data.filter(d => d.indicators.workshops_available).length / totalRecords) * 100).toFixed(1)
      },
      {
        name: 'Functional Equipment',
        available: data.filter(d => d.indicators.equipment_functional).length,
        notAvailable: data.filter(d => !d.indicators.equipment_functional).length,
        percentage: ((data.filter(d => d.indicators.equipment_functional).length / totalRecords) * 100).toFixed(1)
      },
      {
        name: 'Library Resources',
        available: data.filter(d => d.indicators.library_resources).length,
        notAvailable: data.filter(d => !d.indicators.library_resources).length,
        percentage: ((data.filter(d => d.indicators.library_resources).length / totalRecords) * 100).toFixed(1)
      }
    ];

    // Process performance data
    processedData.performance = [
      {
        metric: 'Completion Rate',
        value: summary.completion_rate_avg,
        icon: <Assessment />,
        color: 'success'
      },
      {
        metric: 'Employment Rate',
        value: summary.employment_rate_avg,
        icon: <Work />,
        color: 'info'
      },
      {
        metric: 'Certification Rate',
        value: (data.reduce((sum, d) => sum + (parseFloat(d.indicators.certification_rate) || 0), 0) / totalRecords).toFixed(1),
        icon: <Verified />,
        color: 'warning'
      }
    ];

    // Process partnerships data
    processedData.partnerships = [
      {
        name: 'Industry Partnerships',
        count: data.filter(d => d.indicators.industry_partnerships).length,
        percentage: ((data.filter(d => d.indicators.industry_partnerships).length / totalRecords) * 100).toFixed(1)
      },
      {
        name: 'Internship Programs',
        count: data.filter(d => d.indicators.internship_programs).length,
        percentage: ((data.filter(d => d.indicators.internship_programs).length / totalRecords) * 100).toFixed(1)
      },
      {
        name: 'Job Placement Support',
        count: data.filter(d => d.indicators.job_placement_support).length,
        percentage: ((data.filter(d => d.indicators.job_placement_support).length / totalRecords) * 100).toFixed(1)
      }
    ];

    // Process trends from API
    if (trends) {
      processedData.trends = [
        { name: 'Period 1', enrollment: trends.enrollment_trend[0], completion: trends.completion_trend[0], employment: trends.employment_trend[0] },
        { name: 'Period 2', enrollment: trends.enrollment_trend[1], completion: trends.completion_trend[1], employment: trends.employment_trend[1] },
        { name: 'Period 3', enrollment: trends.enrollment_trend[2], completion: trends.completion_trend[2], employment: trends.employment_trend[2] },
        { name: 'Period 4', enrollment: trends.enrollment_trend[3], completion: trends.completion_trend[3], employment: trends.employment_trend[3] },
        { name: 'Period 5', enrollment: trends.enrollment_trend[4], completion: trends.completion_trend[4], employment: trends.employment_trend[4] },
      ];
    }
  }

  return processedData;
};

const TrendIndicator = ({ value }) => {
  if (value > 0) return <TrendingUp color="success" fontSize="small" />;
  if (value < 0) return <TrendingDown color="error" fontSize="small" />;
  return <TrendingFlat color="action" fontSize="small" />;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function TvetDashboard() {
  const [tvetData, setTvetData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState({ year: '2024', term: 'Term 1', level: 'region' });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchTvetData(filterPeriod);
        setTvetData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [filterPeriod]);

  const handleExport = () => {
    alert('Export functionality will be implemented here!');
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ ml: 2 }}>Loading TVET Dashboard...</Typography>
    </Box>
  );

  if (error) return (
    <Alert severity="error" sx={{ m: 2 }}>Error loading TVET data: {error}</Alert>
  );

  if (!tvetData) return (
    <Alert severity="info" sx={{ m: 2 }}>No TVET data available.</Alert>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>TVET Dashboard</Typography>
        <IconButton color="primary" onClick={handleExport}>
          <Download /> Export Report
        </IconButton>
      </Stack>

      {/* Period Selection */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filter by Period</Typography>
        <Chip label={`Current Period: ${filterPeriod.year} - ${filterPeriod.term} (${filterPeriod.level})`} color="primary" />
      </Paper>

      {/* Summary Cards */}
      <Typography variant="h5" gutterBottom>Overview</Typography>
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <School color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{tvetData.summary.totalInstitutions}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Institutions</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Groups color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{tvetData.summary.averageEnrollment}</Typography>
                  <Typography variant="body2" color="text.secondary">Average Enrollment</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Assessment color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{tvetData.summary.completionRate}%</Typography>
                  <Typography variant="body2" color="text.secondary">Completion Rate</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <Work color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{tvetData.summary.employmentRate}%</Typography>
                  <Typography variant="body2" color="text.secondary">Employment Rate</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Programs Offered */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Programs Offered</Typography>
      <Grid container spacing={3} mb={4}>
        {tvetData.programs.slice(0, 8).map((program, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Engineering color="primary" />
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {program.name}
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Chip label={`${program.count} institutions`} color="primary" size="small" />
                  <Chip label={`${program.percentage}% coverage`} color="info" size="small" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Infrastructure Status */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Infrastructure Status</Typography>
      <Grid container spacing={3} mb={4}>
        {tvetData.infrastructure.map((infra, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Build color="secondary" />
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {infra.name}
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Chip label={`Available: ${infra.available}`} color="success" size="small" />
                  <Chip label={`Not Available: ${infra.notAvailable}`} color="error" size="small" />
                  <Chip label={`${infra.percentage}% availability`} color="info" size="small" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Performance Metrics */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Performance Metrics</Typography>
      <Grid container spacing={3} mb={4}>
        {tvetData.performance.map((perf, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  {perf.icon}
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {perf.metric}
                  </Typography>
                </Stack>
                <Typography variant="h4" color={`${perf.color}.main`}>
                  {perf.value}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Industry Partnerships */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Industry Partnerships</Typography>
      <Grid container spacing={3} mb={4}>
        {tvetData.partnerships.map((partnership, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Business color="warning" />
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {partnership.name}
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Chip label={`${partnership.count} institutions`} color="warning" size="small" />
                  <Chip label={`${partnership.percentage}% participation`} color="info" size="small" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Trends */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Key Trends</Typography>
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={tvetData.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Line type="monotone" dataKey="enrollment" stroke="#8884d8" name="Enrollment" />
            <Line type="monotone" dataKey="completion" stroke="#82ca9d" name="Completion Rate %" />
            <Line type="monotone" dataKey="employment" stroke="#ffc658" name="Employment Rate %" />
          </LineChart>
        </ResponsiveContainer>
        <Typography variant="caption" display="block" sx={{ mt: 2 }}>
          Note: Trend data shows progress over the last 5 periods. Enrollment numbers are in absolute values, while completion and employment rates are percentages.
        </Typography>
      </Paper>

      {/* Drill-down */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Drill-down Capabilities</Typography>
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1">
          Click on summary cards or trend data points to drill down to specific institutions, circuits, districts, or regions. 
          This functionality will be fully implemented once the backend APIs are ready for detailed data exploration.
        </Typography>
      </Paper>
    </Box>
  );
}

