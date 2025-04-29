'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Box, 
  Typography, 
  Paper, 
  Breadcrumbs, 
  Link, 
  IconButton, 
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Avatar,
  Card,
  CardContent,
  Grid,
  Button
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ChecklistIcon from '@mui/icons-material/Checklist';
import SportsIcon from '@mui/icons-material/Sports';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AssignmentIcon from '@mui/icons-material/Assignment';

// Import mock data
import { 
  schoolOutputSubmissions, 
  districtOutputSubmissions, 
  consolidatedChecklistSubmissions, 
  partnersInPlaySubmissions 
} from '../../mock/mockSubmissions';

// Import utility functions
import { formatDate } from '../../utils/dataUtils';

// Helper function to get survey type name
const getSurveyTypeName = (type) => {
  switch (type) {
    case 'school_output':
      return 'School Output Survey';
    case 'district_output':
      return 'District Output Survey';
    case 'consolidated_checklist':
      return 'Consolidated Checklist';
    case 'partners_in_play':
      return 'Partners in Play';
    default:
      return type;
  }
};

// Helper function to get survey type icon
const getSurveyTypeIcon = (type) => {
  switch (type) {
    case 'school_output':
      return <SchoolIcon color="primary" />;
    case 'district_output':
      return <AccountBalanceIcon color="secondary" />;
    case 'consolidated_checklist':
      return <ChecklistIcon color="success" />;
    case 'partners_in_play':
      return <SportsIcon color="warning" />;
    default:
      return <AssignmentIcon />;
  }
};

export default function SurveyViewPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [surveyId, setSurveyId] = useState('');
  const [surveyData, setSurveyData] = useState(null);
  const [relatedSubmissions, setRelatedSubmissions] = useState([]);
  
  useEffect(() => {
    if (params?.surveyId) {
      const id = decodeURIComponent(params.surveyId);
      setSurveyId(id);
      
      // Combine all submissions
      const allSubmissions = [
        ...schoolOutputSubmissions,
        ...districtOutputSubmissions,
        ...consolidatedChecklistSubmissions,
        ...partnersInPlaySubmissions
      ];
      
      // Find the specific survey
      const survey = allSubmissions.find(sub => sub.id.toString() === id);
      setSurveyData(survey || null);
      
      if (survey) {
        // Find related submissions (same survey type, same teacher/school/district)
        const related = allSubmissions.filter(sub => 
          sub.id.toString() !== id && 
          sub.survey_type === survey.survey_type &&
          (sub.teacher === survey.teacher || 
           sub.school === survey.school || 
           sub.district === survey.district)
        );
        setRelatedSubmissions(related);
      }
      
      setIsLoading(false);
    }
  }, [params]);
  
  // Handle back button
  const handleBack = () => {
    router.back();
  };
  
  // Handle navigation to teacher view
  const handleViewTeacher = (teacherName) => {
    router.push(`/dashboard/admin/rtp-ui/teacher-submissions/${encodeURIComponent(teacherName)}`);
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (!surveyData) {
    return (
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Breadcrumbs aria-label="breadcrumb">
            <Link underline="hover" color="inherit" onClick={handleBack} sx={{ cursor: 'pointer' }}>
              Dashboard
            </Link>
            <Typography color="text.primary">Survey Not Found</Typography>
          </Breadcrumbs>
        </Box>
        
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" color="error">Survey not found</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            The survey with ID {surveyId} could not be found.
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: 3 }}
            onClick={handleBack}
          >
            Go Back
          </Button>
        </Paper>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumb Navigation */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" onClick={handleBack} sx={{ cursor: 'pointer' }}>
            Dashboard
          </Link>
          <Typography color="text.primary">Survey Details</Typography>
        </Breadcrumbs>
      </Box>
      
      {/* Survey Type Header */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            {getSurveyTypeIcon(surveyData.survey_type)}
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="bold">{getSurveyTypeName(surveyData.survey_type)}</Typography>
            <Typography variant="body1" color="text.secondary">
              Submitted on {formatDate(surveyData.submitted_at)}
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
                  <Typography variant="subtitle2">Teacher</Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  fontWeight="medium" 
                  sx={{ 
                    mt: 1, 
                    cursor: 'pointer',
                    color: 'primary.main',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                  onClick={() => handleViewTeacher(surveyData.teacher)}
                >
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
                  <Typography variant="subtitle2">School</Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium" sx={{ mt: 1 }}>
                  {surveyData.school}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2">District</Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium" sx={{ mt: 1 }}>
                  {surveyData.district}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{xs:12, sm:6, md:3}}>
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationOnIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2">Region</Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium" sx={{ mt: 1 }}>
                  {surveyData.region}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Survey Response Details */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Typography variant="h5" fontWeight="medium" gutterBottom>
          Survey Response
        </Typography>
        
        <TableContainer sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Question</TableCell>
                <TableCell>Response</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell width="70%">{surveyData.question_text}</TableCell>
                <TableCell>
                  <Typography fontWeight="medium">
                    {surveyData.answer}
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      {/* Related Submissions */}
      {relatedSubmissions.length > 0 && (
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h5" fontWeight="medium" gutterBottom>
            Related Submissions
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Other submissions from the same teacher, school, or district
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Teacher</TableCell>
                  <TableCell>Question</TableCell>
                  <TableCell>Response</TableCell>
                  <TableCell>Submitted</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {relatedSubmissions.slice(0, 10).map((submission, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{submission.teacher}</TableCell>
                    <TableCell>{submission.question_text}</TableCell>
                    <TableCell>{submission.answer}</TableCell>
                    <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => router.push(`/dashboard/admin/rtp-ui/survey-view/${submission.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {relatedSubmissions.length > 10 && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Showing 10 of {relatedSubmissions.length} related submissions
              </Typography>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
