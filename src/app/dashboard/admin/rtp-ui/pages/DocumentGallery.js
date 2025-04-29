'use client';
import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Card, 
  CardContent, 
  IconButton,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DescriptionIcon from '@mui/icons-material/Description';
import SchoolIcon from '@mui/icons-material/School';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import CloseIcon from '@mui/icons-material/Close';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { mockDocumentUploads, documentTypes } from '../mock/mockDocumentUploads';
import { teachers } from '../mock/mockDatabase';

// Helper function to format date
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function DocumentGallery({ onBack }) {
  const [documents, setDocuments] = useState(mockDocumentUploads);
  const [filteredDocuments, setFilteredDocuments] = useState(mockDocumentUploads);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocType, setSelectedDocType] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get unique regions and districts for filters
  const regions = [...new Set(documents.map(doc => doc.region))].sort();
  const districts = [...new Set(documents
    .filter(doc => !selectedRegion || doc.region === selectedRegion)
    .map(doc => doc.district))]
    .sort();

  // Apply filters when they change
  useEffect(() => {
    let filtered = [...documents];
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.documentName.toLowerCase().includes(term) || 
        (doc.description && doc.description.toLowerCase().includes(term)) ||
        (doc.school && doc.school.toLowerCase().includes(term)) ||
        (doc.district && doc.district.toLowerCase().includes(term))
      );
    }
    
    // Apply document type filter
    if (selectedDocType) {
      filtered = filtered.filter(doc => doc.documentType === parseInt(selectedDocType));
    }
    
    // Apply region filter
    if (selectedRegion) {
      filtered = filtered.filter(doc => doc.region === selectedRegion);
    }
    
    // Apply district filter
    if (selectedDistrict) {
      filtered = filtered.filter(doc => doc.district === selectedDistrict);
    }
    
    setFilteredDocuments(filtered);
  }, [searchTerm, selectedDocType, selectedRegion, selectedDistrict, documents]);

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedDocType('');
    setSelectedRegion('');
    setSelectedDistrict('');
  };

  // Handle document selection
  const handleDocumentClick = (document) => {
    setSelectedDocument(document);
    setIsDialogOpen(true);
  };

  // Close document dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
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
          <Typography color="text.primary">Document Gallery</Typography>
        </Breadcrumbs>
      </Box>

      <Paper elevation={0} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <DescriptionIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
          <Typography variant="h4" fontWeight="bold">Document Gallery</Typography>
        </Box>

        {/* Filters */}
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  label="Document Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {documentTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Region</InputLabel>
                <Select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setSelectedDistrict(''); // Reset district when region changes
                  }}
                  label="Region"
                >
                  <MenuItem value="">All Regions</MenuItem>
                  {regions.map((region) => (
                    <MenuItem key={region} value={region}>
                      {region}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small" disabled={!selectedRegion}>
                <InputLabel>District</InputLabel>
                <Select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  label="District"
                >
                  <MenuItem value="">All Districts</MenuItem>
                  {districts.map((district) => (
                    <MenuItem key={district} value={district}>
                      {district}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button 
                variant="outlined" 
                onClick={handleClearFilters}
                fullWidth
                startIcon={<FilterListIcon />}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </Box>

        {/* Results summary */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1">
            Showing {filteredDocuments.length} of {documents.length} documents
          </Typography>
          <Box>
            {selectedDocType && (
              <Chip 
                label={`Type: ${documentTypes.find(t => t.id === parseInt(selectedDocType))?.name}`}
                onDelete={() => setSelectedDocType('')}
                sx={{ mr: 1 }}
                size="small"
              />
            )}
            {selectedRegion && (
              <Chip 
                label={`Region: ${selectedRegion}`}
                onDelete={() => {
                  setSelectedRegion('');
                  setSelectedDistrict('');
                }}
                sx={{ mr: 1 }}
                size="small"
              />
            )}
            {selectedDistrict && (
              <Chip 
                label={`District: ${selectedDistrict}`}
                onDelete={() => setSelectedDistrict('')}
                size="small"
              />
            )}
          </Box>
        </Box>

        {/* Document Grid */}
        {filteredDocuments.length === 0 ? (
          <Box sx={{ py: 8, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No documents found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try adjusting your filters or search terms
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {filteredDocuments.map((document, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  variant="outlined" 
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 3
                    }
                  }}
                  onClick={() => handleDocumentClick(document)}
                >
                  <Box 
                    sx={{ 
                      height: 140, 
                      bgcolor: 'grey.100', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      position: 'relative'
                    }}
                  >
                    <DescriptionIcon sx={{ fontSize: 60, color: 'primary.main' }} />
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: 1,
                        px: 1,
                        py: 0.5,
                        fontSize: '0.75rem'
                      }}
                    >
                      {document.fileType.split('/')[1]?.toUpperCase() || 'PDF'}
                    </Box>
                  </Box>
                  <CardContent sx={{ pb: '16px !important' }}>
                    <Typography variant="subtitle1" fontWeight="medium" gutterBottom noWrap>
                      {document.documentName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {formatDate(document.uploadDate)}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {document.school ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <SchoolIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {document.school}
                          </Typography>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocationCityIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {document.district}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Document Preview Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedDocument && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{selectedDocument.documentName}</Typography>
              <IconButton onClick={handleCloseDialog}>
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <Divider />
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Box 
                    sx={{ 
                      height: 400, 
                      bgcolor: 'grey.100', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      borderRadius: 1,
                      mb: 2
                    }}
                  >
                    <DescriptionIcon sx={{ fontSize: 100, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="body1">
                    {selectedDocument.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Document Details
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Type</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {documentTypes.find(t => t.id === selectedDocument.documentType)?.name}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Uploaded By</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedDocument.uploadedBy}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Upload Date</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {formatDate(selectedDocument.uploadDate)}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">File Size</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedDocument.fileSize}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Related Survey</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedDocument.relatedSurvey === 'consolidated_checklist' 
                          ? 'Consolidated Checklist' 
                          : selectedDocument.relatedSurvey === 'district_output'
                            ? 'District Output Survey'
                            : 'School Output Survey'}
                      </Typography>
                    </Box>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Location
                    </Typography>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">Region</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedDocument.region}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">District</Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {selectedDocument.district}
                      </Typography>
                    </Box>
                    {selectedDocument.school && (
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">School</Typography>
                        <Typography variant="body1" fontWeight="medium">
                          {selectedDocument.school}
                        </Typography>
                      </Box>
                    )}
                  </Paper>

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      fullWidth 
                      startIcon={<DownloadIcon />}
                    >
                      Download
                    </Button>
                    <Button 
                      variant="outlined" 
                      fullWidth 
                      startIcon={<VisibilityIcon />}
                    >
                      Full Screen
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
