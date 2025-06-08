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
  Divider,
  LinearProgress
} from '@mui/material';
import { 
  School, 
  PregnantWoman, 
  TrendingUp, 
  TrendingDown, 
  TrendingFlat, 
  Download, 
  PersonAdd,
  Groups,
  AssignmentReturn,
  SupportAgent,
  FollowTheSigns,
  ChildCare
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const fetchReentryData = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/reentry-dashboard?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch reentry data');
  }

  const { data, summary, trends } = result;

  // Process the data to fit the frontend structure
  const processedData = {
    summary: {},
    pregnancyStatus: [],
    reentryStatus: [],
    supportServices: [],
    trends: [],
  };

  if (data && data.length > 0) {
    // Summary statistics
    processedData.summary = {
      totalSchools: summary.total_schools,
      totalPregnantAttending: summary.total_pregnant_attending,
      totalPregnantNotAttending: summary.total_pregnant_not_attending,
      totalDroppedOutReturned: summary.total_dropped_out_returned,
      totalPregnantReturned: summary.total_pregnant_returned,
      reentryRate: summary.reentry_rate
    };

    // Process pregnancy status data
    processedData.pregnancyStatus = [
      {
        name: 'Pregnant Girls Attending School',
        value: summary.total_pregnant_attending,
        color: '#4CAF50',
        icon: <PregnantWoman />
      },
      {
        name: 'Pregnant Girls Not Attending School',
        value: summary.total_pregnant_not_attending,
        color: '#FF9800',
        icon: <School />
      }
    ];

    // Process reentry status data
    processedData.reentryStatus = [
      {
        name: 'Dropped Out but Returned',
        value: summary.total_dropped_out_returned,
        color: '#2196F3',
        icon: <AssignmentReturn />
      },
      {
        name: 'Pregnant Returned After Birth',
        value: summary.total_pregnant_returned,
        color: '#9C27B0',
        icon: <ChildCare />
      }
    ];

    // Process support services data
    const supportActivities = data.filter(d => d.indicators.support_activities && d.indicators.support_activities.trim() !== '').length;
    const followupActivities = data.filter(d => d.indicators.followup_activities && d.indicators.followup_activities.trim() !== '').length;
    
    processedData.supportServices = [
      {
        name: 'Schools with Support Activities',
        count: supportActivities,
        percentage: ((supportActivities / data.length) * 100).toFixed(1),
        icon: <SupportAgent />
      },
      {
        name: 'Schools with Follow-up Activities',
        count: followupActivities,
        percentage: ((followupActivities / data.length) * 100).toFixed(1),
        icon: <FollowTheSigns />
      }
    ];

    // Process trends from API
    if (trends) {
      processedData.trends = [
        { name: 'Period 1', attending: trends.pregnant_attending_trend[0], reentry: trends.reentry_trend[0], support: trends.support_activities_trend[0] },
        { name: 'Period 2', attending: trends.pregnant_attending_trend[1], reentry: trends.reentry_trend[1], support: trends.support_activities_trend[1] },
        { name: 'Period 3', attending: trends.pregnant_attending_trend[2], reentry: trends.reentry_trend[2], support: trends.support_activities_trend[2] },
        { name: 'Period 4', attending: trends.pregnant_attending_trend[3], reentry: trends.reentry_trend[3], support: trends.support_activities_trend[3] },
        { name: 'Period 5', attending: trends.pregnant_attending_trend[4], reentry: trends.reentry_trend[4], support: trends.support_activities_trend[4] },
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

const COLORS = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#F44336'];

export default function ReentryDashboard() {
  const [reentryData, setReentryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState({ year: '2024', term: 'Term 1', level: 'region' });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchReentryData(filterPeriod);
        setReentryData(data);
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
      <Typography variant="h6" sx={{ ml: 2 }}>Loading Pregnancy & Re-entry Dashboard...</Typography>
    </Box>
  );

  if (error) return (
    <Alert severity="error" sx={{ m: 2 }}>Error loading pregnancy & re-entry data: {error}</Alert>
  );

  if (!reentryData) return (
    <Alert severity="info" sx={{ m: 2 }}>No pregnancy & re-entry data available.</Alert>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>Pregnancy & Re-entry Dashboard</Typography>
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
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <School color="primary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{reentryData.summary.totalSchools}</Typography>
                  <Typography variant="body2" color="text.secondary">Total Schools</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PregnantWoman color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{reentryData.summary.totalPregnantAttending}</Typography>
                  <Typography variant="body2" color="text.secondary">Pregnant Attending</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <PersonAdd color="warning" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{reentryData.summary.totalPregnantNotAttending}</Typography>
                  <Typography variant="body2" color="text.secondary">Not Attending</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <AssignmentReturn color="info" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{reentryData.summary.totalDroppedOutReturned}</Typography>
                  <Typography variant="body2" color="text.secondary">Returned to School</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <ChildCare color="secondary" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{reentryData.summary.totalPregnantReturned}</Typography>
                  <Typography variant="body2" color="text.secondary">Returned After Birth</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center">
                <TrendingUp color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h4">{reentryData.summary.reentryRate}%</Typography>
                  <Typography variant="body2" color="text.secondary">Re-entry Rate</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pregnancy Status */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Pregnancy Status</Typography>
      <Grid container spacing={3} mb={4}>
        {reentryData.pregnancyStatus.map((status, index) => (
          <Grid item xs={12} sm={6} md={6} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  {status.icon}
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {status.name}
                  </Typography>
                </Stack>
                <Typography variant="h3" sx={{ color: status.color, mb: 1 }}>
                  {status.value}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(status.value / (reentryData.summary.totalPregnantAttending + reentryData.summary.totalPregnantNotAttending)) * 100} 
                  sx={{ height: 8, borderRadius: 4, backgroundColor: '#f0f0f0' }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Re-entry Status */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Re-entry Status</Typography>
      <Grid container spacing={3} mb={4}>
        {reentryData.reentryStatus.map((status, index) => (
          <Grid item xs={12} sm={6} md={6} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={2}>
                  {status.icon}
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {status.name}
                  </Typography>
                </Stack>
                <Typography variant="h3" sx={{ color: status.color, mb: 1 }}>
                  {status.value}
                </Typography>
                <LinearProgress 
                  variant="determinate" 
                  value={(status.value / (reentryData.summary.totalDroppedOutReturned + reentryData.summary.totalPregnantReturned)) * 100} 
                  sx={{ height: 8, borderRadius: 4, backgroundColor: '#f0f0f0' }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Support Services */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Support Services</Typography>
      <Grid container spacing={3} mb={4}>
        {reentryData.supportServices.map((service, index) => (
          <Grid item xs={12} sm={6} md={6} key={index}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  {service.icon}
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {service.name}
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Chip label={`${service.count} schools`} color="primary" size="small" />
                  <Chip label={`${service.percentage}% coverage`} color="info" size="small" />
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
          <LineChart data={reentryData.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Line type="monotone" dataKey="attending" stroke="#4CAF50" name="Pregnant Attending" />
            <Line type="monotone" dataKey="reentry" stroke="#2196F3" name="Re-entry Rate %" />
            <Line type="monotone" dataKey="support" stroke="#FF9800" name="Support Activities" />
          </LineChart>
        </ResponsiveContainer>
        <Typography variant="caption" display="block" sx={{ mt: 2 }}>
          Note: Trend data shows progress over the last 5 periods. Values represent counts and percentages for different indicators.
        </Typography>
      </Paper>

      {/* Drill-down */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Drill-down Capabilities</Typography>
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1">
          Click on summary cards or trend data points to drill down to specific schools, circuits, districts, or regions. 
          This functionality will be fully implemented once the backend APIs are ready for detailed data exploration.
        </Typography>
      </Paper>
    </Box>
  );
}

