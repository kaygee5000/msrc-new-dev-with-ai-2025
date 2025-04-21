"use client";

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Divider,
  Paper,
  Alert,
  Chip,
  CircularProgress,
  Stack
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import TableViewIcon from '@mui/icons-material/TableView';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ChecklistIcon from '@mui/icons-material/Checklist';
import GroupsIcon from '@mui/icons-material/Groups';
import InsightsIcon from '@mui/icons-material/Insights';

import { createExportFilename, fetchAndExportCSV } from '@/utils/export';

/**
 * Export Dashboard for RTP module
 * Allows users to export various RTP data in CSV format
 */
export default function ExportDashboard() {
  // State for filters and UI controls
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Filter states
  const [selectedItinerary, setSelectedItinerary] = useState('');
  const [schoolType, setSchoolType] = useState('all');
  const [exportSection, setExportSection] = useState('output'); // output, outcome, analytics
  
  // Options for exports
  const [itineraries, setItineraries] = useState([]);

  useEffect(() => {
    // Fetch available itineraries
    // This would be replaced with an actual API call in production
    setItineraries([
      { id: '2025-Q1', name: '2025 Q1 Assessment' },
      { id: '2024-Q4', name: '2024 Q4 Assessment' },
      { id: '2024-Q3', name: '2024 Q3 Assessment' }
    ]);
  }, []);

  // Reset success/error messages when filters change
  useEffect(() => {
    setError(null);
    setSuccess(null);
  }, [selectedItinerary, schoolType, exportSection]);

  // Handle export of output indicators data
  const handleExportOutputIndicators = async (level = 'all') => {
    if (!selectedItinerary) {
      setError('Please select an itinerary before exporting data');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Define the export headers
      const headers = [
        { key: 'level', display: 'Level' },
        { key: 'schoolName', display: 'School Name' },
        { key: 'district', display: 'District' },
        { key: 'region', display: 'Region' },
        { key: 'isGalop', display: 'GALOP School' },
        { key: 'indicator', display: 'Indicator' },
        { key: 'value', display: 'Value' },
        { key: 'gender', display: 'Gender' },
        { key: 'submissionDate', display: 'Submission Date' }
      ];

      // Define filename
      const filename = createExportFilename(`rtp-output-indicators-${level}`, {
        itinerary: selectedItinerary,
        schoolType
      });

      // Construct API URL with query parameters
      const apiUrl = `/api/rtp/export/output?itineraryId=${selectedItinerary}&schoolType=${schoolType}&level=${level}`;

      // Call export function
      const result = await fetchAndExportCSV(
        apiUrl,
        headers,
        filename,
        response => response.data // Extract the data property from the API response
      );

      if (result.success) {
        setSuccess(`Successfully exported ${level} output indicators data`);
      } else {
        setError(`Failed to export data: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error exporting output indicators:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle export of outcome indicators data
  const handleExportOutcomeIndicators = async (surveyType = 'all') => {
    if (!selectedItinerary) {
      setError('Please select an itinerary before exporting data');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Define the export headers
      const headers = [
        { key: 'surveyType', display: 'Survey Type' },
        { key: 'schoolName', display: 'School Name' },
        { key: 'district', display: 'District' },
        { key: 'region', display: 'Region' },
        { key: 'isGalop', display: 'GALOP School' },
        { key: 'questionNumber', display: 'Question Number' },
        { key: 'questionText', display: 'Question Text' },
        { key: 'responseText', display: 'Response' },
        { key: 'responseValue', display: 'Value' },
        { key: 'categoryId', display: 'Category' },
        { key: 'teacherName', display: 'Teacher Name' },
        { key: 'teacherGender', display: 'Teacher Gender' },
        { key: 'submissionDate', display: 'Submission Date' },
        { key: 'assessorName', display: 'Assessor Name' },
        { key: 'assessorRole', display: 'Assessor Role' }
      ];

      // Define filename
      const surveyTypeLabel = surveyType === 'consolidated-checklist' ? 'checklist' : 
                             surveyType === 'partners-in-play' ? 'partners' : 'all-surveys';
      
      const filename = createExportFilename(`rtp-outcome-${surveyTypeLabel}`, {
        itinerary: selectedItinerary,
        schoolType
      });

      // Construct API URL with query parameters
      const apiUrl = `/api/rtp/export/outcome?itineraryId=${selectedItinerary}&schoolType=${schoolType}&surveyType=${surveyType}`;

      // Call export function
      const result = await fetchAndExportCSV(
        apiUrl,
        headers,
        filename,
        response => response.data // Extract the data property from the API response
      );

      if (result.success) {
        setSuccess(`Successfully exported ${surveyTypeLabel} outcome data`);
      } else {
        setError(`Failed to export data: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error exporting outcome indicators:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle export of analytics data
  const handleExportAnalytics = async (analyticsType) => {
    if (!selectedItinerary) {
      setError('Please select an itinerary before exporting data');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let headers = [];
      let apiUrl = '';
      let filename = '';

      switch (analyticsType) {
        case 'gender-analysis':
          headers = [
            { key: 'dataType', display: 'Data Category' },
            { key: 'category', display: 'Subcategory' },
            { key: 'male', display: 'Male' },
            { key: 'female', display: 'Female' },
            { key: 'total', display: 'Total' },
            { key: 'femalePercentage', display: 'Female %' },
            { key: 'gap', display: 'Gender Gap' },
            { key: 'district', display: 'District' },
            { key: 'term', display: 'Term' }
          ];
          apiUrl = `/api/rtp/export/gender-analysis?itineraryId=${selectedItinerary}&schoolType=${schoolType}&exportType=all`;
          filename = createExportFilename('rtp-gender-analysis', {
            itinerary: selectedItinerary,
            schoolType
          });
          break;
          
        case 'outcomes-summary':
          headers = [
            { key: 'indicator', display: 'Outcome Indicator' },
            { key: 'description', display: 'Description' },
            { key: 'value', display: 'Value' },
            { key: 'percentageOfTarget', display: '% of Target' },
            { key: 'trend', display: 'Trend (vs Previous)' },
            { key: 'district', display: 'District' }
          ];
          apiUrl = `/api/rtp/export/analytics/outcomes?itineraryId=${selectedItinerary}&schoolType=${schoolType}`;
          filename = createExportFilename('rtp-outcomes-summary', {
            itinerary: selectedItinerary,
            schoolType
          });
          break;
          
        case 'school-participation':
          headers = [
            { key: 'schoolName', display: 'School Name' },
            { key: 'district', display: 'District' },
            { key: 'region', display: 'Region' },
            { key: 'isGalop', display: 'GALOP School' },
            { key: 'outputSubmitted', display: 'Output Data Submitted' },
            { key: 'checklistSubmitted', display: 'Checklist Submitted' },
            { key: 'partnersSubmitted', display: 'Partners Survey Submitted' },
            { key: 'completionPercentage', display: 'Completion %' },
            { key: 'lastSubmissionDate', display: 'Last Submission Date' }
          ];
          apiUrl = `/api/rtp/export/analytics/participation?itineraryId=${selectedItinerary}&schoolType=${schoolType}`;
          filename = createExportFilename('rtp-school-participation', {
            itinerary: selectedItinerary,
            schoolType
          });
          break;
          
        default:
          setError('Invalid analytics type');
          setLoading(false);
          return;
      }

      // Call export function
      const result = await fetchAndExportCSV(
        apiUrl,
        headers,
        filename,
        response => response.data // Extract the data property from the API response
      );

      if (result.success) {
        setSuccess(`Successfully exported ${analyticsType} data`);
      } else {
        setError(`Failed to export data: ${result.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Error exporting analytics data:', err);
      setError('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Export RTP Data
      </Typography>
      <Typography variant="body1" paragraph>
        Export Right to Play data in CSV format for use in external applications like Excel and other analysis tools.
      </Typography>
      
      {/* Filter Controls */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="itinerary-select-label">Itinerary</InputLabel>
              <Select
                labelId="itinerary-select-label"
                id="itinerary-select"
                value={selectedItinerary}
                label="Itinerary"
                onChange={(e) => setSelectedItinerary(e.target.value)}
              >
                <MenuItem value="">
                  <em>Select an itinerary</em>
                </MenuItem>
                {itineraries.map((itinerary) => (
                  <MenuItem key={itinerary.id} value={itinerary.id}>
                    {itinerary.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="school-type-select-label">School Type</InputLabel>
              <Select
                labelId="school-type-select-label"
                id="school-type-select"
                value={schoolType}
                label="School Type"
                onChange={(e) => setSchoolType(e.target.value)}
              >
                <MenuItem value="all">All Schools</MenuItem>
                <MenuItem value="galop">GALOP Schools Only</MenuItem>
                <MenuItem value="non-galop">Non-GALOP Schools Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel id="export-section-select-label">Export Section</InputLabel>
              <Select
                labelId="export-section-select-label"
                id="export-section-select"
                value={exportSection}
                label="Export Section"
                onChange={(e) => setExportSection(e.target.value)}
              >
                <MenuItem value="output">Output Indicators</MenuItem>
                <MenuItem value="outcome">Outcome Indicators</MenuItem>
                <MenuItem value="analytics">Analytics Data</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Status Messages */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}
      
      {/* Export Options */}
      {exportSection === 'output' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2" gutterBottom>
              Output Indicators
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Export raw output indicator data collected from schools and districts.
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <SchoolIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" component="div" gutterBottom>
                  School-Level Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Export all 18 school-level output indicators, including gender-disaggregated teacher and student data.
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                  onClick={() => handleExportOutputIndicators('school')}
                  disabled={loading || !selectedItinerary}
                >
                  Export School Data
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <AccountBalanceIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" component="div" gutterBottom>
                  District-Level Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Export all 13 district-level output indicators, including support teams and training data.
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                  onClick={() => handleExportOutputIndicators('district')}
                  disabled={loading || !selectedItinerary}
                >
                  Export District Data
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <TableViewIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" component="div" gutterBottom>
                  Complete Output Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Export all output indicators from both school and district levels in a single file.
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                  onClick={() => handleExportOutputIndicators('all')}
                  disabled={loading || !selectedItinerary}
                >
                  Export All Output Data
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {exportSection === 'outcome' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2" gutterBottom>
              Outcome Indicators
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Export survey responses from outcome indicators assessments.
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <ChecklistIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" component="div" gutterBottom>
                  Consolidated Checklist
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Export all responses from the Consolidated Checklist survey (30 questions).
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                  onClick={() => handleExportOutcomeIndicators('consolidated-checklist')}
                  disabled={loading || !selectedItinerary}
                >
                  Export Checklist Data
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <GroupsIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" component="div" gutterBottom>
                  Partners in Play
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Export all responses from the Partners in Play survey (64 questions).
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                  onClick={() => handleExportOutcomeIndicators('partners-in-play')}
                  disabled={loading || !selectedItinerary}
                >
                  Export Partners Data
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <TableViewIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" component="div" gutterBottom>
                  Complete Survey Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Export all survey responses from both assessment types in a single file.
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                  onClick={() => handleExportOutcomeIndicators('all')}
                  disabled={loading || !selectedItinerary}
                >
                  Export All Survey Data
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {exportSection === 'analytics' && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" component="h2" gutterBottom>
              Analytics Data
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Export analyzed and processed data for reporting and visualization.
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <InsightsIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" component="div" gutterBottom>
                  Gender Analysis
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Export gender-disaggregated data analysis including trends and comparisons.
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                  onClick={() => handleExportAnalytics('gender-analysis')}
                  disabled={loading || !selectedItinerary}
                >
                  Export Gender Analysis
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <AssessmentIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" component="div" gutterBottom>
                  Outcomes Summary
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Export calculated outcome indicators with targets and trends.
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                  onClick={() => handleExportAnalytics('outcomes-summary')}
                  disabled={loading || !selectedItinerary}
                >
                  Export Outcomes Summary
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <SchoolIcon color="primary" sx={{ fontSize: 40, mb: 2 }} />
                <Typography variant="h6" component="div" gutterBottom>
                  School Participation
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Export school participation data including submission status and completion rates.
                </Typography>
                <Button 
                  variant="contained" 
                  fullWidth
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FileDownloadIcon />}
                  onClick={() => handleExportAnalytics('school-participation')}
                  disabled={loading || !selectedItinerary}
                >
                  Export Participation Data
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      <Box sx={{ mt: 4 }}>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          All exports are provided in CSV format. For complex data analysis, please use spreadsheet software like Microsoft Excel.
        </Typography>
        <Stack direction="row" spacing={1} mt={1}>
          <Chip label="CSV Format" size="small" color="primary" variant="outlined" />
          <Chip label="Gender-Disaggregated" size="small" color="primary" variant="outlined" />
          <Chip label="Raw Data" size="small" color="primary" variant="outlined" />
        </Stack>
      </Box>
    </Box>
  );
}