'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Box, 
  Paper, 
  Typography, 
  Grid, 
  Button, 
  Card, 
  CardContent, 
  Divider, 
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Breadcrumbs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Switch
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Import our data service and utilities
import rtpApiService from '../../../../../../utils/RTP_apiService';
import { formatDate, calculatePercentage, capPercentage } from '../../../../../../utils/RTP_dataUtils';
import { useRTP_DataSource } from '../../../../../../context/RTP_DataSourceContext';

// Helper function to get survey type name
function getSurveyTypeName(type) {
  const typeMap = {
    'school_output': 'School Output',
    'district_output': 'District Output',
    'consolidated_checklist': 'Consolidated Checklist',
    'partners_in_play': 'Partners in Play'
  };
  
  return typeMap[type] || type.replace(/_/g, ' ');
}

// Helper function to get survey type icon
function getSurveyTypeIcon(type) {
  switch (type) {
    case 'school_output':
      return <SchoolIcon />;
    case 'district_output':
      return <BusinessIcon />;
    case 'consolidated_checklist':
      return <AssignmentIcon />;
    case 'partners_in_play':
      return <PersonIcon />;
    default:
      return <AssignmentIcon />;
  }
}

export default function SurveyViewPage() {
  const params = useParams();
  const router = useRouter();
  const { useMockData, toggleDataSource } = useRTP_DataSource();
  
  // State
  const [surveyId, setSurveyId] = useState(null);
  const [surveyData, setSurveyData] = useState(null);
  const [relatedSubmissions, setRelatedSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (params?.surveyId) {
      const id = decodeURIComponent(params.surveyId);
      setSurveyId(id);
      
      async function fetchSurveyData() {
        setLoading(true);
        setError(null);
        
        try {
          // Fetch the specific survey
          const survey = await rtpApiService.getSubmissionById(id, useMockData);
          
          if (!survey) {
            setError(`Survey with ID ${id} could not be found. It may have been deleted or is not accessible.`);
            setLoading(false);
            return;
          }
          
          setSurveyData(survey);
          
          try {
            // Find related submissions (same survey type, same teacher/school/district)
            const allSubmissions = await rtpApiService.getAllSubmissions(useMockData);
            
            // Filter related submissions
            const related = allSubmissions.filter(sub => 
              sub.id && sub.id.toString() !== id.toString() && 
              (
                sub.survey_type === survey.survey_type ||
                sub.teacher === survey.teacher ||
                sub.school === survey.school
              )
            );
            
            // Sort by date (newest first) and limit to 5
            const sortedRelated = related
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .slice(0, 5);
              
            setRelatedSubmissions(sortedRelated);
          } catch (relatedError) {
            // Log error but don't fail the whole page - related submissions are not critical
            console.error('Error fetching related submissions:', relatedError);
            setRelatedSubmissions([]);
          }
        } catch (err) {
          console.error('Error fetching survey data:', err);
          
          // Get user-friendly error message if available
          const errorMessage = err.getUserMessage ? 
            err.getUserMessage() : 
            'Failed to load survey data. Please try again later.';
            
          setError(errorMessage);
        } finally {
          setLoading(false);
        }
      }
      
      fetchSurveyData();
    }
  }, [params, useMockData]);
  
  // Handle back button click
  const handleBack = () => {
    router.back();
  };
  
  // Render loading state
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
      </Box>
    );
  }
  
  // Render not found state
  if (!surveyData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 3 }}>
          Survey not found. The survey may have been deleted or the ID is invalid.
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
      </Box>
    );
  }
  
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
      
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link href="/dashboard/admin/rtp/dashboard" passHref>
          <Typography color="inherit" sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            Dashboard
          </Typography>
        </Link>
        <Typography color="text.primary">Survey Details</Typography>
      </Breadcrumbs>
      
      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleBack}>
          Back
        </Button>
      </Box>
      
      {/* Survey Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 2 }}>
            {getSurveyTypeIcon(surveyData.survey_type)}
          </Box>
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {getSurveyTypeName(surveyData.survey_type)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Submission ID: {surveyData.id}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={2}>
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PersonIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" fontWeight="medium">
                    Teacher
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {surveyData.teacher}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SchoolIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" fontWeight="medium">
                    School
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {surveyData.school}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <BusinessIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" fontWeight="medium">
                    District
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {surveyData.district}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <DateRangeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="body1" fontWeight="medium">
                    Date
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ mt: 1 }}>
                  {formatDate(surveyData.date)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Survey Details */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight="medium" gutterBottom>
          Survey Details
        </Typography>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Question</TableCell>
                <TableCell>Answer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {surveyData.question_text && (
                <TableRow>
                  <TableCell>{surveyData.question_text}</TableCell>
                  <TableCell>{surveyData.answer}</TableCell>
                </TableRow>
              )}
              {surveyData.questions && surveyData.questions.map((question, index) => (
                <TableRow key={index}>
                  <TableCell>{question.text}</TableCell>
                  <TableCell>{question.answer}</TableCell>
                </TableRow>
              ))}
              {!surveyData.question_text && !surveyData.questions && (
                <TableRow>
                  <TableCell colSpan={2}>
                    <Typography variant="body2" color="text.secondary">
                      No detailed question data available for this submission.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Related Submissions */}
      <Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight="medium" gutterBottom>
          Related Submissions
        </Typography>
        
        {relatedSubmissions.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Survey Type</TableCell>
                  <TableCell>Teacher</TableCell>
                  <TableCell>School</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {relatedSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>{formatDate(submission.date)}</TableCell>
                    <TableCell>{getSurveyTypeName(submission.survey_type)}</TableCell>
                    <TableCell>{submission.teacher}</TableCell>
                    <TableCell>{submission.school}</TableCell>
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
        ) : (
          <Typography variant="body2" color="text.secondary">
            No related submissions found.
          </Typography>
        )}
      </Paper>
      
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
        >
          Back to Dashboard
        </Button>
        
        <Box>
          <Button 
            variant="outlined" 
            component={Link}
            href={`/dashboard/admin/rtp/teacher-submissions/${encodeURIComponent(surveyData.teacher)}`}
            sx={{ mr: 2 }}
          >
            View Teacher Submissions
          </Button>
          
          <Button 
            variant="contained" 
            component={Link}
            href={`/dashboard/admin/rtp/hierarchy-view/school/${encodeURIComponent(surveyData.school)}`}
          >
            View School Details
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
