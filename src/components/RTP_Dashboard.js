'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';

// Import our data service
import rtpApiService from '../utils/RTP_apiService';
import { useRTP_DataSource } from '../context/RTP_DataSourceContext';

// Import components
import IndicatorCard from '../app/dashboard/admin/rtp-ui/components/IndicatorCard';
// import DrilldownDialog from '../app/dashboard/admin/rtp-ui/components/DrilldownDialog';

// Import utility functions
import { formatDate, calculatePercentage, capPercentage } from '../app/dashboard/admin/rtp-ui/utils/dataUtils';

/**
 * Dashboard component for the RTP dashboard
 */
export default function RTP_Dashboard() {
  const router = useRouter();
  const { useMockData, toggleDataSource } = useRTP_DataSource();
  
  // State
  const [outcomeIndicators, setOutcomeIndicators] = useState([]);
  const [outputIndicators, setOutputIndicators] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [drilldownIndicator, setDrilldownIndicator] = useState(null);
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data on component mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      
      try {
        // Use Promise.allSettled to handle partial failures
        const results = await Promise.allSettled([
          rtpApiService.getOutcomeIndicators(useMockData),
          rtpApiService.getOutputIndicators(useMockData),
          rtpApiService.getRecentSubmissions(useMockData, 10)
        ]);
        
        // Process results and handle partial failures
        const [outcomesResult, outputsResult, submissionsResult] = results;
        
        // Handle outcome indicators
        if (outcomesResult.status === 'fulfilled') {
          setOutcomeIndicators(outcomesResult.value);
        } else {
          console.error('Error fetching outcome indicators:', outcomesResult.reason);
          // Don't set error state for partial failures, just log them
        }
        
        // Handle output indicators
        if (outputsResult.status === 'fulfilled') {
          setOutputIndicators(outputsResult.value);
        } else {
          console.error('Error fetching output indicators:', outputsResult.reason);
          // Don't set error state for partial failures, just log them
        }
        
        // Handle recent submissions
        if (submissionsResult.status === 'fulfilled') {
          setRecentSubmissions(submissionsResult.value);
        } else {
          console.error('Error fetching recent submissions:', submissionsResult.reason);
          // Don't set error state for partial failures, just log them
        }
        
        // Check if all requests failed
        const allFailed = results.every(result => result.status === 'rejected');
        if (allFailed) {
          setError('Failed to load dashboard data. Please try again later.');
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        
        // Get user-friendly error message if available
        const errorMessage = err.getUserMessage ? 
          err.getUserMessage() : 
          'Failed to load dashboard data. Please try again later.';
          
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [useMockData]);

  // Helper function to get trend icon
  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUpIcon color="success" />;
    if (trend < 0) return <TrendingDownIcon color="error" />;
    return <TrendingFlatIcon color="action" />;
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Data Source Toggle */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <FormControlLabel
          control={
            <Switch
              checked={!useMockData}
              onChange={toggleDataSource}
              color="primary"
            />
          }
          label={useMockData ? "Using Mock Data" : "Using Live Data"}
        />
      </Box>
      
      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Loading Indicator */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Dashboard Header */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              RTP Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Overview of Reading to Play program indicators and recent submissions
            </Typography>
          </Box>
          
          {/* Outcome Indicators */}
          <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h5" fontWeight="medium">
                  Outcome Indicators
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      Student Learning
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      {outcomeIndicators
                        .filter(ind => ['oi1', 'oi2'].includes(ind.id))
                        .map((indicator) => (
                          <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                            <IndicatorCard 
                              indicator={indicator} 
                              onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                            />
                          </Grid>
                        ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
                
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      Teacher Performance
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      {outcomeIndicators
                        .filter(ind => ['oi3', 'oi4', 'oi5'].includes(ind.id))
                        .map((indicator) => (
                          <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                            <IndicatorCard 
                              indicator={indicator} 
                              onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                            />
                          </Grid>
                        ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
                
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      School Environment
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={3}>
                      {outcomeIndicators
                        .filter(ind => ['oi6', 'oi7', 'oi8', 'oi9'].includes(ind.id))
                        .map((indicator) => (
                          <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                            <IndicatorCard 
                              indicator={indicator} 
                              onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                            />
                          </Grid>
                        ))}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </AccordionDetails>
            </Accordion>
          </Paper>
          
          {/* Output Indicators */}
          <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Accordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h5" fontWeight="medium">
                  Output Indicators
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      School Outputs
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          Teacher Capacity
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={3}>
                          {outputIndicators
                            .filter(ind => ind.category === 'school_output' && ind.subcategory === 'teacher_capacity')
                            .map((indicator) => (
                              <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                                <IndicatorCard 
                                  indicator={indicator} 
                                  onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                                />
                              </Grid>
                            ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          Curriculum Implementation
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={3}>
                          {outputIndicators
                            .filter(ind => ind.category === 'school_output' && ind.subcategory === 'curriculum')
                            .map((indicator) => (
                              <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                                <IndicatorCard 
                                  indicator={indicator} 
                                  onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                                />
                              </Grid>
                            ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          Student Engagement
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={3}>
                          {outputIndicators
                            .filter(ind => ind.category === 'school_output' && ind.subcategory === 'student_engagement')
                            .map((indicator) => (
                              <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                                <IndicatorCard 
                                  indicator={indicator} 
                                  onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                                />
                              </Grid>
                            ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </AccordionDetails>
                </Accordion>
                
                <Accordion defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">
                      District Outputs
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          District Support
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={3}>
                          {outputIndicators
                            .filter(ind => ind.category === 'district_output' && ind.subcategory === 'district_support')
                            .map((indicator) => (
                              <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                                <IndicatorCard 
                                  indicator={indicator} 
                                  onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                                />
                              </Grid>
                            ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                    
                    <Accordion>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle1">
                          Monitoring and Evaluation
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={3}>
                          {outputIndicators
                            .filter(ind => ind.category === 'district_output' && ind.subcategory === 'monitoring')
                            .map((indicator) => (
                              <Grid size={{xs:12, sm:6, md:4, lg:3}} key={indicator.id}>
                                <IndicatorCard 
                                  indicator={indicator} 
                                  onClick={() => { setDrilldownIndicator(indicator); setDrilldownOpen(true); }}
                                />
                              </Grid>
                            ))}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  </AccordionDetails>
                </Accordion>
              </AccordionDetails>
            </Accordion>
          </Paper>
          
          {/* Recent Submissions Table */}
          <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <HistoryIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h5" fontWeight="medium">
                  Recent Submissions
                </Typography>
              </Box>
              <Button 
                variant="outlined" 
                size="small"
                component={Link}
                href="/dashboard/admin/rtp/hierarchy-view/region/All"
              >
                View All Submissions
              </Button>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Survey Type</TableCell>
                    <TableCell>Teacher</TableCell>
                    <TableCell>School</TableCell>
                    <TableCell>District</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>{formatDate(submission.date)}</TableCell>
                      <TableCell>{submission.survey_type.replace(/_/g, ' ')}</TableCell>
                      <TableCell>{submission.teacher}</TableCell>
                      <TableCell>{submission.school}</TableCell>
                      <TableCell>{submission.district}</TableCell>
                      <TableCell>
                        <Button 
                          variant="text" 
                          size="small"
                          component={Link}
                          href={`/dashboard/admin/rtp/survey-view/${submission.id}`}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
          
          {/* Drilldown Dialog */}
          {/* <DrilldownDialog 
            open={drilldownOpen} 
            onClose={() => setDrilldownOpen(false)} 
            indicator={drilldownIndicator} 
          /> */}
        </>
      )}
    </Box>
  );
}
