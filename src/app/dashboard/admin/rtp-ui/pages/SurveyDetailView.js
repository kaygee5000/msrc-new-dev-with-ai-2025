'use client';
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Divider, 
  IconButton,
  Breadcrumbs,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Grid,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import DescriptionIcon from '@mui/icons-material/Description';
import { 
  schoolOutputSubmissions, 
  districtOutputSubmissions, 
  consolidatedChecklistSubmissions, 
  partnersInPlaySubmissions 
} from '../mock/mockSubmissions';
import { mockDocumentUploads } from '../mock/mockDocumentUploads';

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function SurveyDetailView({ entityType, entityName, region, district, onBack }) {
  const [activeTab, setActiveTab] = useState(0);
  const [submissions, setSubmissions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [schools, setSchools] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Filter submissions and documents based on entity type and name
  useEffect(() => {
    // Reset selections when entity changes
    setSelectedTeacher(null);
    setSelectedSchool(null);
    
    if (entityType === 'school') {
      // Filter submissions for this school
      const schoolSubs = [
        ...schoolOutputSubmissions.filter(sub => sub.school === entityName),
        ...consolidatedChecklistSubmissions.filter(sub => sub.school === entityName),
        ...partnersInPlaySubmissions.filter(sub => sub.school === entityName)
      ];
      setSubmissions(schoolSubs);
      
      // Get unique teachers in this school
      const uniqueTeachers = [...new Set(schoolSubs
        .filter(sub => sub.teacher)
        .map(sub => sub.teacher))];
      
      setTeachers(uniqueTeachers.map(teacher => ({
        name: teacher,
        submissions: schoolSubs.filter(sub => sub.teacher === teacher)
      })));
      
      // Filter documents for this school
      setDocuments(mockDocumentUploads.filter(doc => doc.school === entityName));
    } else if (entityType === 'district') {
      // Filter submissions for this district
      const districtSubs = [
        ...schoolOutputSubmissions.filter(sub => sub.district === entityName),
        ...districtOutputSubmissions.filter(sub => sub.district === entityName),
        ...consolidatedChecklistSubmissions.filter(sub => sub.district === entityName),
        ...partnersInPlaySubmissions.filter(sub => sub.district === entityName)
      ];
      setSubmissions(districtSubs);
      
      // Get unique schools in this district
      const uniqueSchools = [...new Set(districtSubs
        .filter(sub => sub.school)
        .map(sub => sub.school))];
      
      setSchools(uniqueSchools.map(school => ({
        name: school,
        submissions: districtSubs.filter(sub => sub.school === school)
      })));
      
      // Get unique teachers in this district
      const uniqueTeachers = [...new Set(districtSubs
        .filter(sub => sub.teacher)
        .map(sub => sub.teacher))];
      
      setTeachers(uniqueTeachers.map(teacher => ({
        name: teacher,
        submissions: districtSubs.filter(sub => sub.teacher === teacher)
      })));
      
      // Filter documents for this district
      setDocuments(mockDocumentUploads.filter(doc => 
        doc.district === entityName || 
        (doc.school && schools.some(s => s.name === doc.school))
      ));
    }
  }, [entityType, entityName, schools]);

  // Handle teacher selection
  const handleTeacherSelect = (teacherName) => {
    if (selectedTeacher === teacherName) {
      setSelectedTeacher(null); // Deselect if already selected
    } else {
      setSelectedTeacher(teacherName);
      setSelectedSchool(null); // Clear school selection
    }
  };

  // Handle school selection
  const handleSchoolSelect = (schoolName) => {
    if (selectedSchool === schoolName) {
      setSelectedSchool(null); // Deselect if already selected
    } else {
      setSelectedSchool(schoolName);
      setSelectedTeacher(null); // Clear teacher selection
    }
  };

  // Filter submissions based on selections
  const filteredSubmissions = submissions.filter(sub => {
    if (selectedTeacher) {
      return sub.teacher === selectedTeacher;
    }
    if (selectedSchool) {
      return sub.school === selectedSchool;
    }
    return true;
  });

  // Group submissions by survey type
  const groupedSubmissions = filteredSubmissions.reduce((acc, sub) => {
    if (!acc[sub.survey_type]) {
      acc[sub.survey_type] = [];
    }
    acc[sub.survey_type].push(sub);
    return acc;
  }, {});

  // Get survey type names for display
  const getSurveyTypeName = (type) => {
    const names = {
      'school_output': 'School Output Survey',
      'district_output': 'District Output Survey',
      'consolidated_checklist': 'Consolidated Checklist',
      'partners_in_play': 'Partners in Play'
    };
    return names[type] || type;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={onBack} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Breadcrumbs aria-label="breadcrumb">
          <Link underline="hover" color="inherit" onClick={onBack} sx={{ cursor: 'pointer' }}>
            Dashboard
          </Link>
          <Typography color="text.primary">
            {entityType === 'school' ? 'School' : 'District'} Details
          </Typography>
        </Breadcrumbs>
      </Box>

      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {entityType === 'school' ? (
            <SchoolIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          ) : (
            <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>D</Avatar>
          )}
          <Box>
            <Typography variant="h4" fontWeight="bold">{entityName}</Typography>
            <Typography variant="body1" color="text.secondary">
              {region} Region, {district} {entityType === 'school' ? 'District' : ''}
            </Typography>
          </Box>
        </Box>

        <Tabs 
          value={activeTab} 
          onChange={handleTabChange} 
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        >
          <Tab label="Overview" />
          <Tab label="Submissions" />
          <Tab label="Documents" />
          {entityType === 'district' && <Tab label="Schools" />}
          <Tab label="Teachers" />
        </Tabs>

        {/* Overview Tab */}
        {activeTab === 0 && (
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                      Submissions
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {submissions.length}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {Object.keys(groupedSubmissions).map(type => (
                        <Box key={type} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="body2">{getSurveyTypeName(type)}</Typography>
                          <Typography variant="body2" fontWeight="bold">
                            {groupedSubmissions[type].length}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                      Documents
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {documents.length}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {documents.slice(0, 3).map((doc, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <DescriptionIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                          <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>
                            {doc.documentName}
                          </Typography>
                        </Box>
                      ))}
                      {documents.length > 3 && (
                        <Typography variant="body2" color="primary">
                          +{documents.length - 3} more
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" fontWeight="medium" gutterBottom>
                      {entityType === 'school' ? 'Teachers' : 'Schools'}
                    </Typography>
                    <Typography variant="h3" color="primary">
                      {entityType === 'school' ? teachers.length : schools.length}
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      {(entityType === 'school' ? teachers : schools).slice(0, 3).map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          {entityType === 'school' ? (
                            <PersonIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                          ) : (
                            <SchoolIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                          )}
                          <Typography variant="body2" noWrap sx={{ maxWidth: '80%' }}>
                            {item.name}
                          </Typography>
                        </Box>
                      ))}
                      {(entityType === 'school' ? teachers.length : schools.length) > 3 && (
                        <Typography variant="body2" color="primary">
                          +{(entityType === 'school' ? teachers.length : schools.length) - 3} more
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>Recent Activity</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell>Submitted By</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {[...submissions, ...documents]
                      .sort((a, b) => new Date(b.submitted_at || b.uploadDate) - new Date(a.submitted_at || a.uploadDate))
                      .slice(0, 5)
                      .map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{formatDate(item.submitted_at || item.uploadDate)}</TableCell>
                          <TableCell>
                            {item.survey_type ? (
                              <Chip 
                                size="small" 
                                label={getSurveyTypeName(item.survey_type)} 
                                color="primary" 
                                variant="outlined" 
                              />
                            ) : (
                              <Chip 
                                size="small" 
                                label="Document Upload" 
                                color="secondary" 
                                variant="outlined" 
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            {item.question_text || item.documentName}
                          </TableCell>
                          <TableCell>
                            {item.teacher || item.uploadedBy || 'Unknown'}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        )}

        {/* Submissions Tab */}
        {activeTab === 1 && (
          <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <Typography variant="h6" sx={{ flexGrow: 1 }}>
                Survey Submissions {selectedTeacher ? `by ${selectedTeacher}` : ''}
                {selectedSchool ? `for ${selectedSchool}` : ''}
              </Typography>
              {selectedTeacher && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => setSelectedTeacher(null)}
                >
                  Clear Filter
                </Button>
              )}
              {selectedSchool && (
                <Button 
                  variant="outlined" 
                  size="small" 
                  onClick={() => setSelectedSchool(null)}
                >
                  Clear Filter
                </Button>
              )}
            </Box>

            {Object.keys(groupedSubmissions).length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No submissions found
              </Typography>
            ) : (
              Object.keys(groupedSubmissions).map(surveyType => (
                <Accordion key={surveyType} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="subtitle1" fontWeight="medium">
                        {getSurveyTypeName(surveyType)} ({groupedSubmissions[surveyType].length})
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Question</TableCell>
                            <TableCell>Response</TableCell>
                            {!selectedTeacher && <TableCell>Submitted By</TableCell>}
                            {entityType === 'district' && !selectedSchool && <TableCell>School</TableCell>}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {groupedSubmissions[surveyType]
                            .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))
                            .map((submission, index) => (
                              <TableRow key={index}>
                                <TableCell>{formatDate(submission.submitted_at)}</TableCell>
                                <TableCell>{submission.question_text}</TableCell>
                                <TableCell>
                                  <Typography fontWeight="medium">
                                    {submission.answer}
                                  </Typography>
                                </TableCell>
                                {!selectedTeacher && (
                                  <TableCell>
                                    {submission.teacher ? (
                                      <Button 
                                        size="small" 
                                        startIcon={<PersonIcon />}
                                        onClick={() => handleTeacherSelect(submission.teacher)}
                                      >
                                        {submission.teacher}
                                      </Button>
                                    ) : (
                                      'N/A'
                                    )}
                                  </TableCell>
                                )}
                                {entityType === 'district' && !selectedSchool && (
                                  <TableCell>
                                    {submission.school ? (
                                      <Button 
                                        size="small" 
                                        startIcon={<SchoolIcon />}
                                        onClick={() => handleSchoolSelect(submission.school)}
                                      >
                                        {submission.school}
                                      </Button>
                                    ) : (
                                      'District Level'
                                    )}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
                </Accordion>
              ))
            )}
          </Box>
        )}

        {/* Documents Tab */}
        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Document Uploads
            </Typography>
            
            {documents.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No documents found
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {documents.map((doc, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <Box 
                        sx={{ 
                          height: 140, 
                          bgcolor: 'grey.100', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center' 
                        }}
                      >
                        <DescriptionIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                      </Box>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight="medium" gutterBottom noWrap>
                          {doc.documentName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Uploaded: {formatDate(doc.uploadDate)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          By: {doc.uploadedBy}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          <Button variant="contained" size="small" fullWidth>
                            View Document
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Schools Tab (District only) */}
        {activeTab === 3 && entityType === 'district' && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Schools in {entityName} District
            </Typography>
            
            {schools.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No schools found
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {schools.map((school, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <SchoolIcon color="primary" sx={{ mr: 1 }} />
                          <Typography variant="h6" fontWeight="medium">
                            {school.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" gutterBottom>
                          Submissions: {school.submissions.length}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          Teachers: {[...new Set(school.submissions.filter(s => s.teacher).map(s => s.teacher))].length}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            fullWidth
                            onClick={() => handleSchoolSelect(school.name)}
                          >
                            View Details
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* Teachers Tab */}
        {activeTab === 4 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Teachers {entityType === 'district' ? `in ${entityName} District` : `at ${entityName}`}
            </Typography>
            
            {teachers.length === 0 ? (
              <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                No teachers found
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {teachers.map((teacher, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main', mr: 1 }}>
                            {teacher.name.charAt(0)}
                          </Avatar>
                          <Typography variant="h6" fontWeight="medium">
                            {teacher.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" gutterBottom>
                          Submissions: {teacher.submissions.length}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          Last Activity: {formatDate(teacher.submissions
                            .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0]?.submitted_at || new Date())}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Button 
                            variant="outlined" 
                            size="small" 
                            fullWidth
                            onClick={() => handleTeacherSelect(teacher.name)}
                          >
                            View Submissions
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
}
