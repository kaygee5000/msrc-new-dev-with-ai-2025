'use client';

import { useState, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
  Grid,
  Link as MuiLink,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import Link from 'next/link';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function BatchUserCreation() {
  const [file, setFile] = useState(null);
  const [sendNotifications, setSendNotifications] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const fileInputRef = useRef(null);
  
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (!selectedFile) {
      setFile(null);
      return;
    }
    
    // Check file type
    const fileExt = selectedFile.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls'].includes(fileExt)) {
      setError('Unsupported file format. Please upload a CSV or Excel file.');
      setFile(null);
      return;
    }
    
    setFile(selectedFile);
    setError('');
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      
      // Check file type
      const fileExt = droppedFile.name.split('.').pop().toLowerCase();
      if (!['csv', 'xlsx', 'xls'].includes(fileExt)) {
        setError('Unsupported file format. Please upload a CSV or Excel file.');
        return;
      }
      
      setFile(droppedFile);
      setError('');
    }
  };
  
  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('sendNotifications', sendNotifications.toString());
      
      const response = await fetch('/api/users/batch-create', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to process user batch');
      }
      
      setResults(data);
    } catch (err) {
      console.error('Error uploading user batch:', err);
      setError(err.message || 'An error occurred while processing the file');
    } finally {
      setUploading(false);
    }
  };
  
  const downloadTemplate = () => {
    // Create template CSV content
    const csvContent = 'name,email,phone,type,role,title,region_id,district_id,circuit_id\n' +
      'John Doe,john.doe@example.com,+233123456789,data_collector,user,Data Officer,1,101,1001\n' +
      'Jane Smith,jane.smith@example.com,+233987654321,district_admin,admin,District Manager,2,102,';
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'msrc_users_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const resetForm = () => {
    setFile(null);
    setResults(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Format the user type for display
  const formatUserType = (type) => {
    if (!type) return 'Unknown';
    
    // Convert snake_case to Title Case
    return type
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get color for user type chip
  const getUserTypeColor = (type) => {
    if (!type) return 'default';
    
    const typeMap = {
      'national_admin': 'primary',
      'district_admin': 'primary',
      'data_collector': 'success',
      'rtp_collector': 'warning',
      'super_admin': 'error'
    };
    
    return typeMap[type] || 'default';
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button 
            component={Link} 
            href="/dashboard/admin/users" 
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2 }}
          >
            Back to Users
          </Button>
          
          <Typography variant="h4" component="h1">
            Batch Create Users
          </Typography>
        </Box>
        
        {!results ? (
          // File upload form
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              Upload a CSV or Excel file with user information to create multiple users at once. 
              Download the template below for the required format.
            </Alert>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box 
              sx={{ 
                border: '2px dashed #ccc', 
                borderRadius: 2, 
                p: 3, 
                textAlign: 'center',
                mb: 3,
                cursor: 'pointer',
                '&:hover': {
                  borderColor: 'primary.main'
                },
                bgcolor: file ? 'rgba(25, 118, 210, 0.04)' : 'transparent'
              }}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={handleFileChange}
                ref={fileInputRef}
              />
              
              <CloudUploadIcon color="primary" sx={{ fontSize: 48, mb: 2 }} />
              
              {file ? (
                <>
                  <Typography variant="h6" gutterBottom>
                    File Selected:
                  </Typography>
                  <Chip 
                    label={file.name} 
                    color="primary" 
                    variant="outlined" 
                    onDelete={() => setFile(null)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </>
              ) : (
                <>
                  <Typography variant="h6" gutterBottom>
                    Drag and drop file here
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    or click to browse
                  </Typography>
                </>
              )}
            </Box>
            
            <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  startIcon={<DownloadIcon />}
                  onClick={downloadTemplate}
                  fullWidth
                >
                  Download Template
                </Button>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={sendNotifications}
                      onChange={(e) => setSendNotifications(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Send welcome emails/SMS to users"
                />
              </Grid>
            </Grid>
            
            <Button
              variant="contained"
              size="large"
              disabled={!file || uploading}
              onClick={handleUpload}
              fullWidth
              startIcon={uploading ? <CircularProgress size={24} /> : null}
            >
              {uploading ? 'Processing...' : 'Upload and Create Users'}
            </Button>
          </>
        ) : (
          // Results view
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <CheckCircleOutlineIcon 
                color="success" 
                sx={{ fontSize: 32, mr: 1 }} 
              />
              <Typography variant="h5">
                File Processed
              </Typography>
            </Box>
            
            <Alert 
              severity={results.failed > 0 ? "warning" : "success"} 
              sx={{ mb: 3 }}
            >
              Processed {results.total} users. Successfully created {results.created} users.
              {results.failed > 0 && ` Failed to create ${results.failed} users.`}
            </Alert>
            
            <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
              Successfully Created Users ({results.created})
            </Typography>
            
            {results.users.length > 0 ? (
              <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'grey.100' }}>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Type</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.users.map((user, index) => (
                      <TableRow key={index} hover>
                        <TableCell>{user.first_name + " " + user.last_name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Chip 
                            label={formatUserType(user.type)} 
                            color={getUserTypeColor(user.type)} 
                            size="small" 
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', p: 3, mb: 4 }}>
                <Typography color="text.secondary">
                  No users were created successfully.
                </Typography>
              </Box>
            )}
            
            {results.errors.length > 0 && (
              <>
                <Typography variant="h6" sx={{ mt: 4, mb: 2 }}>
                  Failed Users ({results.failed})
                </Typography>
                
                <TableContainer component={Paper} elevation={0} variant="outlined" sx={{ mb: 4 }}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: 'grey.100' }}>
                        <TableCell>Identifier</TableCell>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {results.errors.map((error, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{error.email}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <ErrorOutlineIcon color="error" sx={{ mr: 1, fontSize: 20 }} />
                              {error.error}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  fullWidth
                  component={Link}
                  href="/dashboard/admin/users"
                >
                  Return to User List
                </Button>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={resetForm}
                >
                  Upload Another File
                </Button>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>
    </Box>
  );
}