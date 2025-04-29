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
  Tabs,
  Tab,
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
  Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
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

export default function TeacherSubmissionsPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [teacherName, setTeacherName] = useState('');
  const [submissions, setSubmissions] = useState([]);
  const [teacherInfo, setTeacherInfo] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  
  useEffect(() => {
    if (params?.teacherName) {
      const decodedName = decodeURIComponent(params.teacherName);
      setTeacherName(decodedName);
      
      // Combine all submissions
      const allSubmissions = [
        ...schoolOutputSubmissions,
        ...districtOutputSubmissions,
        ...consolidatedChecklistSubmissions,
        ...partnersInPlaySubmissions
      ];
      
      // Filter submissions for this teacher
      const teacherSubmissions = allSubmissions.filter(sub => sub.teacher === decodedName);
      setSubmissions(teacherSubmissions);
      
      // Get teacher info from the first submission
      if (teacherSubmissions.length > 0) {
        const firstSub = teacherSubmissions[0];
        setTeacherInfo({
          name: firstSub.teacher,
          school: firstSub.school,
          district: firstSub.district,
          region: firstSub.region,
          circuit: firstSub.circuit
        });
      }
      
      setIsLoading(false);
    }
  }, [params]);
  
  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  // Handle back button
  const handleBack = () => {
    router.back();
  };
  
  // Group submissions by survey type
  const submissionsByType = submissions.reduce((acc, sub) => {
    if (!acc[sub.survey_type]) {
      acc[sub.survey_type] = [];
    }
    acc[sub.survey_type].push(sub);
    return acc;
  }, {});
  
  // Get unique survey types
  const surveyTypes = Object.keys(submissionsByType);
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
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
          <Typography color="text.primary">Teacher Submissions</Typography>
        </Breadcrumbs>
      </Box>
      
      {/* Teacher Info Card */}
      {teacherInfo && (
        <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h4" fontWeight="bold">{teacherName}</Typography>
              <Typography variant="body1" color="text.secondary">
                {teacherInfo.school}, {teacherInfo.district} District
              </Typography>
            </Box>
          </Box>
          
          <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{xs:12, sm:6, md:3}}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <SchoolIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">School</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium" sx={{ mt: 1 }}>
                    {teacherInfo.school}
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
                    {teacherInfo.district}
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
                    {teacherInfo.region}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
          <Grid size={{xs:12, sm:6, md:3}}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AssignmentIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="subtitle2">Submissions</Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="medium" sx={{ mt: 1 }}>
                    {submissions.length} total
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {/* Tabs for different survey types */}
      <Paper elevation={0} sx={{ borderRadius: 2 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="All Submissions" />
          {surveyTypes.map((type, index) => (
            <Tab key={type} label={getSurveyTypeName(type)} />
          ))}
        </Tabs>
        
        <Box sx={{ p: 3 }}>
          {activeTab === 0 ? (
            // All submissions tab
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Survey Type</TableCell>
                    <TableCell>Question</TableCell>
                    <TableCell>Answer</TableCell>
                    <TableCell>Submitted</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissions.map((submission, index) => (
                    <TableRow key={index} hover>
                      <TableCell>
                        <Chip 
                          label={getSurveyTypeName(submission.survey_type)} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{submission.question_text}</TableCell>
                      <TableCell>{submission.answer}</TableCell>
                      <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            // Survey type specific tab
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Question</TableCell>
                    <TableCell>Answer</TableCell>
                    <TableCell>Submitted</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {submissionsByType[surveyTypes[activeTab - 1]]?.map((submission, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{submission.question_text}</TableCell>
                      <TableCell>{submission.answer}</TableCell>
                      <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>
    </Box>
  );
}
