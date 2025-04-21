'use client';

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Container, 
  Paper, 
  Button, 
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Stack,
  Breadcrumbs,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Tabs,
  Tab,
  Tooltip,
  Switch,
  FormControlLabel,
  Radio,
  RadioGroup,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Autocomplete
} from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import HomeIcon from '@mui/icons-material/Home';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CategoryIcon from '@mui/icons-material/Category';
import SchoolIcon from '@mui/icons-material/School';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import GroupsIcon from '@mui/icons-material/Groups';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import { useSearchParams } from 'next/navigation';

// Question type constants
const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Numeric Input' },
  { value: 'date', label: 'Date' },
  { value: 'rating', label: 'Rating Scale' }
];

// Categories constants
const CATEGORIES = [
  { id: 1, name: 'School Output Indicators', icon: <SchoolIcon /> },
  { id: 2, name: 'District Output Indicators', icon: <AssessmentIcon /> },
  { id: 3, name: 'Consolidated Checklist', icon: <PlaylistAddCheckIcon /> },
  { id: 4, name: 'Partners in Play', icon: <GroupsIcon /> }
];

export default function QuestionsManagementPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itineraryId = params.id;
  const categoryFilter = searchParams.get('category');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filteredQuestions, setFilteredQuestions] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter ? parseInt(categoryFilter) : 'all');
  const [selectedType, setSelectedType] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Dialog states
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionForm, setQuestionForm] = useState({
    id: null,
    category_id: '',
    question_text: '',
    question_type: 'single_choice',
    is_required: true,
    score_weight: 1,
    option_order: 'asc',
    options: []
  });
  
  useEffect(() => {
    const fetchItineraryData = async () => {
      setLoading(true);
      try {
        // In a real implementation, fetch from API
        // const response = await fetch(`/api/rtp/itineraries/${itineraryId}`);
        // const data = await response.json();
        // setItinerary(data.itinerary);
        
        // Simulate API response with mock data
        setTimeout(() => {
          const mockItinerary = {
            id: itineraryId,
            title: `Term 2 Sports Assessment ${new Date().getFullYear()}`,
            period: "Term",
            type: "Regular",
            year: new Date().getFullYear(),
            from_date: "2025-03-01",
            until_date: "2025-04-15",
            is_valid: true,
            description: "This itinerary assesses the implementation of sports programs across schools in the district for the second term of the school year."
          };
          
          setItinerary(mockItinerary);
          
          // Mock questions data
          const mockQuestions = [
            {
              id: 1,
              category_id: 1,
              question_text: 'How many sports sessions were conducted in the last month?',
              question_type: 'number',
              is_required: true,
              score_weight: 2,
              option_order: 'asc',
              options: []
            },
            {
              id: 2,
              category_id: 1,
              question_text: 'Which sports activities are being offered at the school?',
              question_type: 'multiple_choice',
              is_required: true,
              score_weight: 1,
              option_order: 'asc',
              options: [
                { id: 1, value: 'football', label: 'Football', is_correct: true },
                { id: 2, value: 'basketball', label: 'Basketball', is_correct: true },
                { id: 3, value: 'volleyball', label: 'Volleyball', is_correct: true },
                { id: 4, value: 'athletics', label: 'Athletics', is_correct: true },
                { id: 5, value: 'other', label: 'Other', is_correct: true }
              ]
            },
            {
              id: 3,
              category_id: 2,
              question_text: 'Has the district provided sports equipment to schools this term?',
              question_type: 'single_choice',
              is_required: true,
              score_weight: 3,
              option_order: 'asc',
              options: [
                { id: 6, value: 'yes', label: 'Yes', is_correct: true },
                { id: 7, value: 'no', label: 'No', is_correct: false }
              ]
            },
            {
              id: 4,
              category_id: 2,
              question_text: 'How many schools in the district have implemented the Right to Play program?',
              question_type: 'number',
              is_required: true,
              score_weight: 2,
              option_order: 'asc',
              options: []
            },
            {
              id: 5,
              category_id: 3,
              question_text: 'Rate the quality of sports facilities in the school',
              question_type: 'rating',
              is_required: true,
              score_weight: 2,
              option_order: 'asc',
              options: [
                { id: 8, value: '1', label: 'Poor', is_correct: false },
                { id: 9, value: '2', label: 'Fair', is_correct: false },
                { id: 10, value: '3', label: 'Good', is_correct: true },
                { id: 11, value: '4', label: 'Very Good', is_correct: true },
                { id: 12, value: '5', label: 'Excellent', is_correct: true }
              ]
            },
            {
              id: 6,
              category_id: 3,
              question_text: 'Are there trained sports teachers/coaches at the school?',
              question_type: 'single_choice',
              is_required: true,
              score_weight: 3,
              option_order: 'asc',
              options: [
                { id: 13, value: 'yes', label: 'Yes', is_correct: true },
                { id: 14, value: 'no', label: 'No', is_correct: false }
              ]
            },
            {
              id: 7,
              category_id: 4,
              question_text: 'Which partner organizations are supporting sports programs in the school?',
              question_type: 'multiple_choice',
              is_required: false,
              score_weight: 1,
              option_order: 'asc',
              options: [
                { id: 15, value: 'rtp', label: 'Right to Play', is_correct: true },
                { id: 16, value: 'unicef', label: 'UNICEF', is_correct: true },
                { id: 17, value: 'ministry', label: 'Ministry of Education', is_correct: true },
                { id: 18, value: 'local', label: 'Local businesses', is_correct: true },
                { id: 19, value: 'other', label: 'Other', is_correct: true }
              ]
            },
            {
              id: 8,
              category_id: 4,
              question_text: 'Describe any partnerships that have been formed to support sports activities',
              question_type: 'text',
              is_required: false,
              score_weight: 1,
              option_order: 'asc',
              options: []
            }
          ];
          
          setQuestions(mockQuestions);
          applyFilters(mockQuestions, selectedCategory, selectedType, search);
          setLoading(false);
        }, 1000);
      } catch (err) {
        console.error(err);
        setError('Failed to load itinerary data');
        setLoading(false);
      }
    };
    
    if (itineraryId) {
      fetchItineraryData();
    }
  }, [itineraryId, categoryFilter]);

  // Apply filters to questions
  const applyFilters = (questionList, categoryId, type, searchTerm) => {
    let filtered = [...questionList];
    
    // Apply category filter
    if (categoryId !== 'all') {
      filtered = filtered.filter(q => q.category_id === categoryId);
    }
    
    // Apply type filter
    if (type !== 'all') {
      filtered = filtered.filter(q => q.question_type === type);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(term) || 
        q.options.some(opt => opt.label.toLowerCase().includes(term))
      );
    }
    
    setFilteredQuestions(filtered);
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    applyFilters(questions, selectedCategory, selectedType, value);
  };
  
  // Handle category filter change
  const handleCategoryChange = (e) => {
    const value = e.target.value;
    setSelectedCategory(value);
    applyFilters(questions, value, selectedType, search);
  };
  
  // Handle type filter change
  const handleTypeChange = (e) => {
    const value = e.target.value;
    setSelectedType(value);
    applyFilters(questions, selectedCategory, value, search);
  };
  
  // Handle pagination
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Question dialog handlers
  const handleOpenQuestionDialog = (question = null) => {
    if (question) {
      setCurrentQuestion(question);
      setQuestionForm({
        id: question.id,
        category_id: question.category_id,
        question_text: question.question_text,
        question_type: question.question_type,
        is_required: question.is_required,
        score_weight: question.score_weight,
        option_order: question.option_order,
        options: [...question.options]
      });
    } else {
      setCurrentQuestion(null);
      setQuestionForm({
        id: null,
        category_id: selectedCategory !== 'all' ? selectedCategory : '',
        question_text: '',
        question_type: 'single_choice',
        is_required: true,
        score_weight: 1,
        option_order: 'asc',
        options: []
      });
    }
    setOpenQuestionDialog(true);
  };
  
  const handleCloseQuestionDialog = () => {
    setOpenQuestionDialog(false);
  };
  
  // Delete dialog handlers
  const handleOpenDeleteDialog = (question) => {
    setCurrentQuestion(question);
    setOpenDeleteDialog(true);
  };
  
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
  };
  
  // Form input handlers
  const handleQuestionFormChange = (e) => {
    const { name, value, checked } = e.target;
    if (name === 'is_required') {
      setQuestionForm({
        ...questionForm,
        [name]: checked
      });
    } else {
      setQuestionForm({
        ...questionForm,
        [name]: value
      });
    }
  };
  
  // Add new option
  const handleAddOption = () => {
    const newOption = {
      id: Date.now(), // Temporary ID for new options
      value: '',
      label: '',
      is_correct: false
    };
    
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, newOption]
    });
  };
  
  // Update option
  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...questionForm.options];
    updatedOptions[index] = {
      ...updatedOptions[index],
      [field]: value
    };
    
    setQuestionForm({
      ...questionForm,
      options: updatedOptions
    });
  };
  
  // Remove option
  const handleRemoveOption = (index) => {
    const updatedOptions = [...questionForm.options];
    updatedOptions.splice(index, 1);
    
    setQuestionForm({
      ...questionForm,
      options: updatedOptions
    });
  };
  
  // Save question
  const handleSaveQuestion = () => {
    // Validate form
    if (!questionForm.category_id || !questionForm.question_text) {
      setError('Please fill in all required fields');
      return;
    }
    
    // Check if options are required but empty
    const requiresOptions = ['single_choice', 'multiple_choice', 'rating'].includes(questionForm.question_type);
    if (requiresOptions && questionForm.options.length < 2) {
      setError('This question type requires at least two answer options');
      return;
    }
    
    // Check for empty option values
    if (requiresOptions && questionForm.options.some(opt => !opt.value || !opt.label)) {
      setError('All options must have a value and label');
      return;
    }
    
    // In a real application, save to API
    // For this prototype, update local state
    let updatedQuestions;
    
    if (questionForm.id) {
      // Update existing question
      updatedQuestions = questions.map(q => 
        q.id === questionForm.id ? { ...questionForm } : q
      );
    } else {
      // Add new question
      const newQuestion = {
        ...questionForm,
        id: Math.max(...questions.map(q => q.id)) + 1
      };
      updatedQuestions = [...questions, newQuestion];
    }
    
    setQuestions(updatedQuestions);
    applyFilters(updatedQuestions, selectedCategory, selectedType, search);
    handleCloseQuestionDialog();
    setError(null);
  };
  
  // Delete question
  const handleDeleteQuestion = () => {
    if (!currentQuestion) return;
    
    // In a real application, delete via API
    // For this prototype, update local state
    const updatedQuestions = questions.filter(q => q.id !== currentQuestion.id);
    setQuestions(updatedQuestions);
    applyFilters(updatedQuestions, selectedCategory, selectedType, search);
    handleCloseDeleteDialog();
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        separator={<NavigateNextIcon fontSize="small" />} 
        aria-label="breadcrumb"
        sx={{ mb: 3 }}
      >
        <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        <Link href="/dashboard/admin/rtp" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <SportsSoccerIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Right to Play
        </Link>
        <Link href="/dashboard/admin/rtp/itineraries" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          <CalendarMonthIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Itineraries
        </Link>
        <Link href={`/dashboard/admin/rtp/itineraries/${itineraryId}`} style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
          Itinerary Details
        </Link>
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <FormatListBulletedIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Questions Management
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center' }}>
          <FormatListBulletedIcon sx={{ mr: 2, fontSize: 35, color: 'primary.main' }} />
          Questions Management
        </Typography>
        
        <Box>
          <Button 
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            component={Link}
            href={`/dashboard/admin/rtp/itineraries/${itineraryId}`}
            sx={{ mr: 2 }}
          >
            Back to Itinerary
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={() => handleOpenQuestionDialog()}
          >
            Add Question
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Itinerary Overview */}
          {itinerary && (
            <Paper sx={{ p: 3, mb: 4 }}>
              <Typography variant="h5" color="primary" gutterBottom>
                {itinerary.title}
              </Typography>
              <Typography variant="body1" paragraph>
                {itinerary.description}
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip 
                  label={itinerary.is_valid ? "Active" : "Inactive"} 
                  color={itinerary.is_valid ? "success" : "default"} 
                />
                <Typography variant="body2">
                  <strong>Period:</strong> {itinerary.period} {itinerary.type} {itinerary.year}
                </Typography>
                <Typography variant="body2">
                  <strong>Date Range:</strong> {itinerary.from_date} to {itinerary.until_date}
                </Typography>
              </Stack>
            </Paper>
          )}
          
          {/* Filters */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Search Questions"
                  variant="outlined"
                  value={search}
                  onChange={handleSearchChange}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="category-select-label">Category</InputLabel>
                  <Select
                    labelId="category-select-label"
                    id="category-select"
                    value={selectedCategory}
                    label="Category"
                    onChange={handleCategoryChange}
                    startAdornment={<CategoryIcon sx={{ color: 'text.secondary', mr: 1 }} />}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel id="type-select-label">Question Type</InputLabel>
                  <Select
                    labelId="type-select-label"
                    id="type-select"
                    value={selectedType}
                    label="Question Type"
                    onChange={handleTypeChange}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {QUESTION_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                  >
                    Import
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    startIcon={<CloudDownloadIcon />}
                    fullWidth
                  >
                    Export
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
          
          {/* Questions Table */}
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer>
              <Table stickyHeader aria-label="questions table">
                <TableHead>
                  <TableRow>
                    <TableCell width="5%">ID</TableCell>
                    <TableCell width="35%">Question</TableCell>
                    <TableCell width="15%">Category</TableCell>
                    <TableCell width="15%">Type</TableCell>
                    <TableCell width="10%">Required</TableCell>
                    <TableCell width="10%">Weight</TableCell>
                    <TableCell width="10%" align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredQuestions.length > 0 ? (
                    filteredQuestions
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((question) => {
                        const category = categories.find(c => c.id === question.category_id);
                        const questionType = QUESTION_TYPES.find(t => t.value === question.question_type);
                        
                        return (
                          <TableRow key={question.id} hover>
                            <TableCell>{question.id}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                                {question.question_text}
                              </Typography>
                              {question.options.length > 0 && (
                                <Typography variant="caption" color="text.secondary" component="div">
                                  {question.options.length} options
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip 
                                icon={category?.icon} 
                                label={category?.name || 'Unknown'} 
                                size="small"
                                sx={{ maxWidth: '100%' }}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={questionType?.label || question.question_type} 
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              {question.is_required ? (
                                <Chip label="Required" size="small" color="error" />
                              ) : (
                                <Chip label="Optional" size="small" />
                              )}
                            </TableCell>
                            <TableCell>{question.score_weight}</TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit Question">
                                <IconButton 
                                  size="small" 
                                  color="primary"
                                  onClick={() => handleOpenQuestionDialog(question)}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete Question">
                                <IconButton 
                                  size="small" 
                                  color="error"
                                  onClick={() => handleOpenDeleteDialog(question)}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body1" sx={{ py: 2 }}>
                          No questions found. Try adjusting your filters or adding new questions.
                        </Typography>
                        <Button 
                          variant="contained" 
                          startIcon={<AddIcon />}
                          onClick={() => handleOpenQuestionDialog()}
                          sx={{ mt: 1 }}
                        >
                          Add Question
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            {filteredQuestions.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredQuestions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            )}
          </Paper>
          
          {/* Question Stats by Category */}
          <Paper sx={{ p: 3, mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Questions by Category
            </Typography>
            <Grid container spacing={3}>
              {categories.map((category) => {
                const categoryQuestions = questions.filter(q => q.category_id === category.id);
                return (
                  <Grid item xs={12} sm={6} md={3} key={category.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ mr: 1, color: 'primary.main' }}>
                            {category.icon}
                          </Box>
                          <Typography variant="h6" component="div">
                            {category.name}
                          </Typography>
                        </Box>
                        <Typography variant="body2" gutterBottom color="text.secondary">
                          Questions: {categoryQuestions.length}
                        </Typography>
                        <Button 
                          variant="outlined" 
                          size="small" 
                          fullWidth
                          onClick={() => {
                            setSelectedCategory(category.id);
                            applyFilters(questions, category.id, selectedType, search);
                          }}
                          sx={{ mt: 1 }}
                        >
                          View Questions
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </>
      )}
      
      {/* Question Form Dialog */}
      <Dialog 
        open={openQuestionDialog} 
        onClose={handleCloseQuestionDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {currentQuestion ? 'Edit Question' : 'Add New Question'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Category Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="form-category-label">Category</InputLabel>
                <Select
                  labelId="form-category-label"
                  id="form-category"
                  name="category_id"
                  value={questionForm.category_id}
                  onChange={handleQuestionFormChange}
                  label="Category"
                >
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Question Type */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth margin="normal" required>
                <InputLabel id="form-type-label">Question Type</InputLabel>
                <Select
                  labelId="form-type-label"
                  id="form-type"
                  name="question_type"
                  value={questionForm.question_type}
                  onChange={handleQuestionFormChange}
                  label="Question Type"
                >
                  {QUESTION_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            {/* Question Text */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question Text"
                name="question_text"
                value={questionForm.question_text}
                onChange={handleQuestionFormChange}
                margin="normal"
                required
                multiline
                rows={2}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={questionForm.is_required}
                    onChange={handleQuestionFormChange}
                    name="is_required"
                    color="primary"
                  />
                }
                label="Required Question"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Score Weight"
                name="score_weight"
                type="number"
                inputProps={{ min: 1, max: 10 }}
                value={questionForm.score_weight}
                onChange={handleQuestionFormChange}
                margin="normal"
              />
            </Grid>
            
            {/* Options Section - Only for relevant question types */}
            {['single_choice', 'multiple_choice', 'rating'].includes(questionForm.question_type) && (
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    Answer Options
                  </Typography>
                  <Button
                    startIcon={<AddIcon />}
                    onClick={handleAddOption}
                    variant="outlined"
                  >
                    Add Option
                  </Button>
                </Box>
                
                {questionForm.options.length > 0 ? (
                  questionForm.options.map((option, index) => (
                    <Box key={option.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Option Value"
                            value={option.value}
                            onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                            size="small"
                            required
                          />
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <TextField
                            fullWidth
                            label="Display Text"
                            value={option.label}
                            onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                            size="small"
                            required
                          />
                        </Grid>
                        <Grid item xs={8} md={3}>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={option.is_correct}
                                onChange={(e) => handleOptionChange(index, 'is_correct', e.target.checked)}
                                color="primary"
                              />
                            }
                            label="Correct Answer"
                          />
                        </Grid>
                        <Grid item xs={4} md={1}>
                          <IconButton 
                            color="error" 
                            onClick={() => handleRemoveOption(index)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    No options added yet. Click "Add Option" to create answer choices.
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQuestionDialog} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveQuestion} 
            variant="contained" 
            color="primary"
            startIcon={<SaveIcon />}
          >
            Save Question
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleCloseDeleteDialog}
      >
        <DialogTitle>
          Delete Question
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the question: "{currentQuestion?.question_text}"? 
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteQuestion} 
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}