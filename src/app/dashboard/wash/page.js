'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Skeleton, Alert, Card, CardContent, Stack, Chip, Tooltip, IconButton } from '@mui/material';
import { WaterDrop, LocalHospital, Wc, CheckCircle, Cancel, HelpOutline, TrendingUp, TrendingDown, TrendingFlat, Download } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import progressBar from '@/utils/nprogress';

// Configure progressBar
progressBar.setup();

const fetchWashData = async (filters) => {
  const params = new URLSearchParams(filters);
  const response = await fetch(`/api/wash-dashboard?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || 'Failed to fetch WASH data');
  }

  const { data, summary, trends } = result;

  // Process the data to fit the frontend structure
  const processedData = {
    summary: {},
    facilityAvailability: [],
    problems: [],
    trends: [],
  };

  if (data && data.length > 0) {
    // Aggregate indicators across all records
    const totalRecords = data.length;
    const aggregatedIndicators = {
      safeDrinkingWater: data.filter(d => d.indicators.safe_drinking_water).length / totalRecords,
      waterForOtherPurposes: data.filter(d => d.indicators.water_for_other_purposes).length / totalRecords,
      separateToilets: data.filter(d => d.indicators.separate_toilets).length / totalRecords,
      adequateToiletsBoys: data.filter(d => d.indicators.adequate_toilets_boys).length / totalRecords,
      urinal: data.filter(d => d.indicators.urinal_available).length / totalRecords,
      urinalPrivacyGirls: data.filter(d => d.indicators.urinal_privacy_girls).length / totalRecords,
      toiletCleanAccessible: data.filter(d => d.indicators.toilet_clean_accessible).length / totalRecords,
      toiletDisabilityFriendly: data.filter(d => d.indicators.toilet_disability_friendly).length / totalRecords,
      girlsChangingRoom: data.filter(d => d.indicators.girls_changing_room).length / totalRecords,
      soapWaterAvailable: data.filter(d => d.indicators.soap_water_available).length / totalRecords,
      refuseDisposalSite: data.filter(d => d.indicators.refuse_disposal_site).length / totalRecords,
      childrenWashHands: data.filter(d => d.indicators.children_wash_hands).length / totalRecords,
      childrenLearnHIVAIDS: data.filter(d => d.indicators.hiv_aids_education).length / totalRecords,
      sportsPlayFacilities: data.filter(d => d.indicators.sports_facilities).length / totalRecords,
      teachersIntegrateHealthHygiene: data.filter(d => d.indicators.health_hygiene_teaching).length / totalRecords,
      firstAidBox: data.filter(d => d.indicators.first_aid_box).length / totalRecords,
      dustBinsInUse: data.filter(d => d.indicators.dust_bins_in_use).length / totalRecords,
      teachersWashHands: data.filter(d => d.indicators.teachers_wash_hands).length / totalRecords,
      schoolCompoundCleanSafe: data.filter(d => d.indicators.compound_clean_safe).length / totalRecords,
      vulnerableChildrenSupport: data.filter(d => d.indicators.vulnerable_children_support).length / totalRecords,
    };

    // Convert to boolean based on majority (>50%)
    Object.keys(aggregatedIndicators).forEach(key => {
      processedData.summary[key] = aggregatedIndicators[key] > 0.5;
    });

    // Process facility availability
    const facilityStats = {
      toilet: { available: 0, notFunctioning: 0, notAvailable: 0 },
      urinal: { available: 0, notFunctioning: 0, notAvailable: 0 },
      water: { available: 0, notFunctioning: 0, notAvailable: 0 },
      veronicaBucket: { available: 0, notFunctioning: 0, notAvailable: 0 },
      changingRooms: { available: 0, notFunctioning: 0, notAvailable: 0 },
    };

    data.forEach(record => {
      // Count facility statuses
      if (record.indicators.toilet_status) {
        const status = record.indicators.toilet_status.toLowerCase();
        if (status.includes('available')) facilityStats.toilet.available++;
        else if (status.includes('not functioning')) facilityStats.toilet.notFunctioning++;
        else facilityStats.toilet.notAvailable++;
      }

      if (record.indicators.urinal_status) {
        const status = record.indicators.urinal_status.toLowerCase();
        if (status.includes('available')) facilityStats.urinal.available++;
        else if (status.includes('not functioning')) facilityStats.urinal.notFunctioning++;
        else facilityStats.urinal.notAvailable++;
      }

      if (record.indicators.water_status) {
        const status = record.indicators.water_status.toLowerCase();
        if (status.includes('available')) facilityStats.water.available++;
        else if (status.includes('not functioning')) facilityStats.water.notFunctioning++;
        else facilityStats.water.notAvailable++;
      }

      if (record.indicators.veronica_bucket_status) {
        const status = record.indicators.veronica_bucket_status.toLowerCase();
        if (status.includes('available')) facilityStats.veronicaBucket.available++;
        else if (status.includes('not functioning')) facilityStats.veronicaBucket.notFunctioning++;
        else facilityStats.veronicaBucket.notAvailable++;
      }

      if (record.indicators.changing_rooms_status) {
        const status = record.indicators.changing_rooms_status.toLowerCase();
        if (status.includes('available')) facilityStats.changingRooms.available++;
        else if (status.includes('not functioning')) facilityStats.changingRooms.notFunctioning++;
        else facilityStats.changingRooms.notAvailable++;
      }
    });

    processedData.facilityAvailability = [
      { type: 'Toilet (Seats/Cubicles)', available: facilityStats.toilet.available, notFunctioning: facilityStats.toilet.notFunctioning, notAvailable: facilityStats.toilet.notAvailable },
      { type: 'Urinal', available: facilityStats.urinal.available, notFunctioning: facilityStats.urinal.notFunctioning, notAvailable: facilityStats.urinal.notAvailable },
      { type: 'Water', available: facilityStats.water.available, notFunctioning: facilityStats.water.notFunctioning, notAvailable: facilityStats.water.notAvailable },
      { type: 'Handwashing facility (Veronica Buckets)', available: facilityStats.veronicaBucket.available, notFunctioning: facilityStats.veronicaBucket.notFunctioning, notAvailable: facilityStats.veronicaBucket.notAvailable },
      { type: 'Changing rooms for girls', available: facilityStats.changingRooms.available, notFunctioning: facilityStats.changingRooms.notFunctioning, notAvailable: facilityStats.changingRooms.notAvailable },
    ];

    // Process problems
    const problemCounts = {};
    data.forEach(record => {
      if (record.indicators.problems) {
        try {
          const problems = JSON.parse(record.indicators.problems);
          if (Array.isArray(problems)) {
            problems.forEach(problem => {
              problemCounts[problem] = (problemCounts[problem] || 0) + 1;
            });
          }
        } catch (e) {
          // Handle non-JSON problems
          if (typeof record.indicators.problems === 'string') {
            problemCounts[record.indicators.problems] = (problemCounts[record.indicators.problems] || 0) + 1;
          }
        }
      }
    });

    processedData.problems = Object.entries(problemCounts).map(([problem, count]) => ({
      problem,
      count,
      percentage: ((count / totalRecords) * 100).toFixed(1)
    }));

    // Process trends from API
    if (trends) {
      processedData.trends = [
        { name: 'Period 1', safeDrinkingWater: trends.safe_water_trend[0], waterForOtherPurposes: trends.safe_water_trend[0], separateToilets: trends.sanitation_trend[0] },
        { name: 'Period 2', safeDrinkingWater: trends.safe_water_trend[1], waterForOtherPurposes: trends.safe_water_trend[1], separateToilets: trends.sanitation_trend[1] },
        { name: 'Period 3', safeDrinkingWater: trends.safe_water_trend[2], waterForOtherPurposes: trends.safe_water_trend[2], separateToilets: trends.sanitation_trend[2] },
        { name: 'Period 4', safeDrinkingWater: trends.safe_water_trend[3], waterForOtherPurposes: trends.safe_water_trend[3], separateToilets: trends.sanitation_trend[3] },
        { name: 'Period 5', safeDrinkingWater: trends.safe_water_trend[4], waterForOtherPurposes: trends.safe_water_trend[4], separateToilets: trends.sanitation_trend[4] },
      ];
    }
  }

  return processedData;
};

const WASH_INDICATORS = [
  { id: 'safeDrinkingWater', label: 'Safe Drinking Water', icon: <WaterDrop />, category: 'General' },
  { id: 'waterForOtherPurposes', label: 'Water for Other Purposes', icon: <WaterDrop />, category: 'General' },
  { id: 'separateToilets', label: 'Separate Toilets for Boys and Girls', icon: <Wc />, category: 'General' },
  { id: 'adequateToiletsBoys', label: 'Adequate Toilets for Boys', icon: <Wc />, category: 'General' },
  { id: 'urinal', label: 'Urinal in the School', icon: <Wc />, category: 'General' },
  { id: 'urinalPrivacyGirls', label: 'Urinal Provides Adequate Privacy for Girls', icon: <Wc />, category: 'General' },
  { id: 'toiletCleanAccessible', label: 'Toilet Clean and Accessible', icon: <Wc />, category: 'General' },
  { id: 'toiletDisabilityFriendly', label: 'Toilet Disability-Friendly', icon: <Wc />, category: 'General' },
  { id: 'girlsChangingRoom', label: 'Girls’ Toilet Has Changing Room', icon: <Wc />, category: 'General' },
  { id: 'soapWaterAvailable', label: 'Soap and Water Available', icon: <WaterDrop />, category: 'General' },
  { id: 'refuseDisposalSite', label: 'Final Refuse Disposal Site', icon: <Wc />, category: 'General' },
  { id: 'childrenWashHands', label: 'Children Wash Hands with Soap', icon: <WaterDrop />, category: 'General' },
  { id: 'childrenLearnHIVAIDS', label: 'Children Learn About HIV & AIDS', icon: <LocalHospital />, category: 'General' },
  { id: 'sportsPlayFacilities', label: 'Facilities for Sports and Play', icon: <WaterDrop />, category: 'General' },
  { id: 'teachersIntegrateHealthHygiene', label: 'Teachers Integrate Health and Hygiene', icon: <LocalHospital />, category: 'General' },
  { id: 'firstAidBox', label: 'Fully Stocked First Aid Box', icon: <LocalHospital />, category: 'Facilities' },
  { id: 'dustBinsInUse', label: 'Dust Bins in Use', icon: <Wc />, category: 'Facilities' },
  { id: 'teachersWashHands', label: 'Teachers Wash Hands with Soap and Water', icon: <WaterDrop />, category: 'Facilities' },
  { id: 'schoolCompoundCleanSafe', label: 'School Compound Clean and Safe', icon: <Wc />, category: 'Facilities' },
  { id: 'vulnerableChildrenSupport', label: 'Vulnerable Children Receive Support', icon: <LocalHospital />, category: 'Facilities' },
];

const getStatusDisplay = (value) => {
  if (value === true) return { icon: <CheckCircle />, color: 'success', label: 'Yes' };
  if (value === false) return { icon: <Cancel />, color: 'error', label: 'No' };
  return { icon: <HelpOutline />, color: 'info', label: 'N/A' };
};

const TrendIndicator = ({ value }) => {
  if (value > 0) return <TrendingUp color="success" fontSize="small" />;
  if (value < 0) return <TrendingDown color="error" fontSize="small" />;
  return <TrendingFlat color="action" fontSize="small" />;
};

export default function WashDashboard() {
  const [washData, setWashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState({ year: '2024', term: 'Term 1', level: 'region' }); // Default filter

  useEffect(() => {
    progressBar.setup();
    
    const loadData = async () => {
      setLoading(true);
      setError(null);
      progressBar.start();
      try {
        const data = await fetchWashData(filterPeriod);
        setWashData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        progressBar.done();
      }
    };
    loadData();
  }, [filterPeriod]);

  const handleExport = () => {
    alert('Export functionality will be implemented here!');
  };

  if (loading) return (
    <Box sx={{ p: 3 }}>
      {/* Header Skeleton */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Skeleton variant="text" width={300} height={40} />
        <Skeleton variant="circular" width={40} height={40} />
      </Stack>

      {/* Period Selection Skeleton */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Skeleton variant="text" width={200} height={30} sx={{ mb: 1 }} />
        <Skeleton variant="text" width={150} height={24} />
      </Paper>

      {/* General Indicators Skeleton */}
      <Skeleton variant="text" width={250} height={30} sx={{ mt: 4, mb: 2 }} />
      <Grid container spacing={2}>
        {Array(8).fill(0).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width="80%" height={24} />
                </Stack>
                <Skeleton variant="rectangular" width={80} height={24} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Facility Availability Skeleton */}
      <Skeleton variant="text" width={250} height={30} sx={{ mt: 4, mb: 2 }} />
      <Grid container spacing={2}>
        {Array(5).fill(0).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width="80%" height={24} />
                </Stack>
                <Stack spacing={1}>
                  <Skeleton variant="text" width="100%" height={24} />
                  <Skeleton variant="text" width="100%" height={24} />
                  <Skeleton variant="text" width="100%" height={24} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Problems Skeleton */}
      <Skeleton variant="text" width={250} height={30} sx={{ mt: 4, mb: 2 }} />
      <Grid container spacing={2}>
        {Array(4).fill(0).map((_, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Skeleton variant="circular" width={24} height={24} />
                  <Skeleton variant="text" width="80%" height={24} />
                </Stack>
                <Stack spacing={1}>
                  <Skeleton variant="text" width="100%" height={24} />
                  <Skeleton variant="text" width="100%" height={24} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Trends Skeleton */}
      <Skeleton variant="text" width={250} height={30} sx={{ mt: 4, mb: 2 }} />
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Skeleton variant="rectangular" width="100%" height={300} />
        <Skeleton variant="text" width="70%" height={20} sx={{ mt: 2 }} />
      </Paper>
    </Box>
  );

  if (error) return (
    <Alert severity="error" sx={{ m: 2 }}>Error loading WASH data: {error}</Alert>
  );

  if (!washData) return (
    <Alert severity="info" sx={{ m: 2 }}>No WASH data available.</Alert>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>WASH Dashboard</Typography>
        <IconButton color="primary" onClick={handleExport}><Download /> Export Report</IconButton>
      </Stack>

      {/* Period Selection (Placeholder) */}
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Filter by Period</Typography>
        {/* This will be replaced by a proper period selector component */}
        <Chip label={`Current Period: ${filterPeriod.year} - ${filterPeriod.term} (${filterPeriod.level})`} color="primary" />
      </Paper>

      {/* General Indicators */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>General Indicators</Typography>
      <Grid container spacing={2}>
        {WASH_INDICATORS.filter(ind => ind.category === 'General').map(indicator => {
          const status = getStatusDisplay(washData.summary[indicator.id]);
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={indicator.id}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                    {indicator.icon}
                    <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                      {indicator.label}
                    </Typography>
                  </Stack>
                  <Chip label={status.label} color={status.color} size="small" />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Facility Availability */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Facility Availability</Typography>
      <Grid container spacing={2}>
        {washData.facilityAvailability.map((facility, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Wc />
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {facility.type}
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Chip label={`Available: ${facility.available}`} color="success" size="small" />
                  <Chip label={`Not Functioning: ${facility.notFunctioning}`} color="warning" size="small" />
                  <Chip label={`Not Available: ${facility.notAvailable}`} color="error" size="small" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Problems */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Identified Problems</Typography>
      <Grid container spacing={2}>
        {washData.problems.length > 0 ? washData.problems.map((problemData, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                  <Cancel color="error" />
                  <Typography variant="subtitle1" component="div" sx={{ fontWeight: 'medium' }}>
                    {problemData.problem}
                  </Typography>
                </Stack>
                <Stack spacing={1}>
                  <Chip label={`Count: ${problemData.count}`} color="error" size="small" />
                  <Chip label={`${problemData.percentage}% of schools`} color="info" size="small" />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )) : (
          <Grid item xs={12}>
            <Alert severity="info">No problems identified in the current data.</Alert>
          </Grid>
        )}
      </Grid>

      {/* Trends (Placeholder) */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Key Trends</Typography>
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={washData.trends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <RechartsTooltip />
            <Legend />
            <Line type="monotone" dataKey="safeDrinkingWater" stroke="#8884d8" name="Safe Drinking Water" />
            <Line type="monotone" dataKey="waterForOtherPurposes" stroke="#82ca9d" name="Water for Other Purposes" />
            <Line type="monotone" dataKey="separateToilets" stroke="#ffc658" name="Separate Toilets" />
          </LineChart>
        </ResponsiveContainer>
        <Typography variant="caption" display="block" sx={{ mt: 2 }}>
          Note: Trend data is illustrative. Actual data will be integrated with drill-down.
        </Typography>
      </Paper>

      {/* Drill-down (Placeholder) */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Drill-down Capabilities</Typography>
      <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
        <Typography variant="body1">Clicking on summary cards or trend data points will allow drill-down to specific schools, circuits, districts, or regions. This functionality will be fully implemented once the backend APIs are ready for detailed data.</Typography>
      </Paper>
    </Box>
  );
}
