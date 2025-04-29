'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  LinearProgress,
  CircularProgress,
  Divider,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { 
  InfoOutlined, 
  BarChart, 
  Close as CloseIcon,
  TrendingUp
} from '@mui/icons-material';
import { formatDate } from '@/utils/dates';
import IndicatorBreakdown from './IndicatorBreakdown';

/**
 * RTP Outcome Indicators Dashboard Component
 * Displays calculated outcome indicators based on survey responses
 * with detailed breakdown and comparison features
 * 
 * @param {Object} props - Component props
 * @param {Number} props.itineraryId - Current itinerary ID to show indicators for
 * @returns {React.Component} - RTP Outcome Indicators component
 */
export default function RTPOutcomeIndicators({ itineraryId }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [indicatorsData, setIndicatorsData] = useState(null);
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [selectedIndicator, setSelectedIndicator] = useState(null);
  const [districtBreakdown, setDistrictBreakdown] = useState([]);
  const [historicalData, setHistoricalData] = useState([]);
  const [breakdownLoading, setBreakdownLoading] = useState(false);

  useEffect(() => {
    const fetchOutcomeIndicators = async () => {
      if (!itineraryId) {
        setError('No itinerary selected');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/rtp/outcome-indicators?itineraryId=${itineraryId}`);
        
        if (!response.ok) {
          throw new Error(`Error fetching outcome indicators: ${response.statusText}`);
        }
        
        const data = await response.json();
        setIndicatorsData(data.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching RTP outcome indicators:', err);
        setError(err.message || 'Failed to load outcome indicators');
      } finally {
        setLoading(false);
      }
    };

    fetchOutcomeIndicators();
  }, [itineraryId]);

  // Fetch detailed breakdown data when an indicator is selected
  const fetchDetailedBreakdown = async (indicatorType) => {
    setBreakdownLoading(true);
    try {
      // Fetch district breakdown for comparison
      const districtResponse = await fetch(
        `/api/rtp/district-breakdown?itineraryId=${itineraryId}&indicatorType=${indicatorType}`
      );
      if (districtResponse.ok) {
        const districtData = await districtResponse.json();
        setDistrictBreakdown(districtData);
      }

      // Fetch historical data for trend comparison
      const historyResponse = await fetch(
        `/api/rtp/historical-trend?indicatorType=${indicatorType}&limit=5`
      );
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setHistoricalData(historyData);
      }
    } catch (err) {
      console.error('Error fetching detailed breakdown:', err);
    } finally {
      setBreakdownLoading(false);
    }
  };

  // Handle opening the detailed breakdown dialog
  const handleOpenBreakdown = (indicatorType) => {
    setSelectedIndicator(indicatorType);
    setBreakdownOpen(true);
    fetchDetailedBreakdown(indicatorType);
  };

  // Handle closing the breakdown dialog
  const handleCloseBreakdown = () => {
    setBreakdownOpen(false);
  };

  // Get the selected indicator data
  const getSelectedIndicatorData = () => {
    if (!selectedIndicator || !indicatorsData) return null;
    return indicatorsData[selectedIndicator];
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Calculating outcome indicators...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  if (!indicatorsData) {
    return (
      <Alert severity="info" sx={{ mt: 2 }}>
        No outcome indicator data available for the selected itinerary.
      </Alert>
    );
  }

  // Destructure the outcome indicator data
  const {
    implementationPlans,
    developmentPlans,
    lessonPlans,
    learningEnvironments,
    teacherSkills,
    enrollment,
    schoolsReached
  } = indicatorsData;

  return (
    <Box sx={{ mt: 3 }}>
      <Typography variant="h5" gutterBottom>
        RTP Outcome Indicators
      </Typography>
      
      <Grid container spacing={3}>
        {/* School Reach Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" color="primary">
                  Schools Reached
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleOpenBreakdown('schoolsReached')}
                  title="View details"
                >
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="h3" sx={{ mt: 2, fontWeight: 'bold' }}>
                {schoolsReached || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Enrollment Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Typography variant="h6" color="primary">
                  Total Primary Enrollment
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={() => handleOpenBreakdown('enrollment')}
                  title="View details"
                >
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="h3" sx={{ mt: 2, fontWeight: 'bold' }}>
                {enrollment?.totalEnrollment.toLocaleString() || 0}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Boys: {enrollment?.boysEnrollment.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Girls: {enrollment?.girlsEnrollment.toLocaleString() || 0}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Schools Count Card */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="primary">
                Schools Reporting
              </Typography>
              <Typography variant="h3" sx={{ mt: 2, fontWeight: 'bold' }}>
                {implementationPlans?.totalSchools || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Key Implementation Indicators
      </Typography>
      
      <Grid container spacing={3}>
        {/* Implementation Plans */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="subtitle1">
                Schools with Implementation Plans
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleOpenBreakdown('implementationPlans')}
                title="View details"
              >
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={implementationPlans?.percentage || 0} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {implementationPlans?.percentage?.toFixed(1) || 0}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {implementationPlans?.schoolsWithPlans || 0} out of {implementationPlans?.totalSchools || 0} schools
            </Typography>
          </Paper>
        </Grid>
        
        {/* Development Plans */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="subtitle1">
                Schools with LtP Development Plans
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleOpenBreakdown('developmentPlans')}
                title="View details"
              >
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={developmentPlans?.percentage || 0} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {developmentPlans?.percentage?.toFixed(1) || 0}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {developmentPlans?.schoolsWithUploads || 0} out of {developmentPlans?.totalSchools || 0} schools
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
        Teacher Performance Indicators
      </Typography>
      
      <Grid container spacing={3}>
        {/* Lesson Plans */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="subtitle1">
                Teachers with LtP Lesson Plans
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleOpenBreakdown('lessonPlans')}
                title="View details"
              >
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={lessonPlans?.percentage || 0} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {lessonPlans?.percentage?.toFixed(1) || 0}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {lessonPlans?.teachersWithLtPPlans || 0} out of {lessonPlans?.totalTeachers || 0} teachers
            </Typography>
          </Paper>
        </Grid>
        
        {/* Learning Environments */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="subtitle1">
                Learning Environments with LtP Methods
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleOpenBreakdown('learningEnvironments')}
                title="View details"
              >
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={learningEnvironments?.percentage || 0} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {learningEnvironments?.percentage?.toFixed(1) || 0}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {learningEnvironments?.environmentsWithLtP || 0} out of {learningEnvironments?.totalEnvironments || 0} environments
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Average Score: {learningEnvironments?.averageScore?.toFixed(2) || 0} / 5
            </Typography>
          </Paper>
        </Grid>
        
        {/* Teacher Skills */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Typography variant="subtitle1">
                Teachers with LtP Facilitation Skills
              </Typography>
              <IconButton 
                size="small" 
                onClick={() => handleOpenBreakdown('teacherSkills')}
                title="View details"
              >
                <InfoOutlined fontSize="small" />
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={teacherSkills?.percentage || 0} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {teacherSkills?.percentage?.toFixed(1) || 0}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {teacherSkills?.teachersWithSkills || 0} out of {teacherSkills?.totalTeachers || 0} teachers
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Average Score: {teacherSkills?.averageScore?.toFixed(2) || 0} / 5
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Typography variant="caption" color="text.secondary">
          Last calculated: {formatDate(new Date())}
        </Typography>
      </Box>

      {/* Detailed Breakdown Dialog */}
      <Dialog 
        open={breakdownOpen} 
        onClose={handleCloseBreakdown}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Indicator Breakdown</Typography>
            <IconButton edge="end" color="inherit" onClick={handleCloseBreakdown} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {breakdownLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <CircularProgress />
              <Typography variant="body1" sx={{ ml: 2 }}>
                Loading detailed data...
              </Typography>
            </Box>
          ) : (
            <IndicatorBreakdown 
              indicatorType={selectedIndicator}
              indicatorData={getSelectedIndicatorData()}
              historicalData={historicalData}
              districtBreakdown={districtBreakdown}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBreakdown}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}