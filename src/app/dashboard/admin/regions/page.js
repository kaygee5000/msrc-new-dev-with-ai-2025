"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Breadcrumbs,
  Link,
  Alert,
  Snackbar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAuth } from '@/context/AuthContext';

export default function RegionsAdmin() {
  const router = useRouter();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Use the auth context instead of localStorage
  const { user, isAuthenticated, loading: authLoading } = useAuth();

  // Check user authentication and admin status
  useEffect(() => {
    // If auth is still loading, wait
    if (authLoading) return;
    
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
   
    
    // If authenticated, fetch regions
    fetchRegions();
  }, [isAuthenticated, authLoading, router, user]);

  // Fetch regions data
  const fetchRegions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/regions');
      
      if (!response.ok) {
        throw new Error('Failed to fetch regions');
      }
      
      const data = await response.json();
      console.log(data.regions, 'regions data');	
      
      if (Array.isArray(data.regions)) {
        setRegions(data.regions);
      } else {
        setRegions([]);
      }
    } catch (err) {
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Error: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (region = null) => {
    if (region) {
      setEditingRegion(region);
      setFormData({
        name: region.name,
        code: region.code,
        description: region.description || ''
      });
    } else {
      setEditingRegion(null);
      setFormData({
        name: '',
        code: '',
        description: ''
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRegion(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      
      const url = editingRegion 
        ? `/api/regions/${editingRegion.id}` 
        : '/api/regions';
        
      const method = editingRegion ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${editingRegion ? 'update' : 'create'} region`);
      }
      
      const result = await response.json();
      
      // Update the regions list
      if (editingRegion) {
        setRegions(prev => 
          prev.map(r => r.id === editingRegion.id ? result : r)
        );
      } else {
        setRegions(prev => [...prev, result]);
      }
      
      setSnackbar({
        open: true,
        message: `Region ${editingRegion ? 'updated' : 'created'} successfully!`,
        severity: 'success'
      });
      
      handleCloseDialog();
    } catch (err) {
      setError(err.message);
      setSnackbar({
        open: true,
        message: `Error: ${err.message}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (regionId) => {
    if (window.confirm('Are you sure you want to delete this region? This action cannot be undone.')) {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/regions/${regionId}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete region');
        }
        
        // Remove the region from the list
        setRegions(prev => prev.filter(r => r.id !== regionId));
        
        setSnackbar({
          open: true,
          message: 'Region deleted successfully!',
          severity: 'success'
        });
      } catch (err) {
        setError(err.message);
        setSnackbar({
          open: true,
          message: `Error: ${err.message}`,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };

  if (!isAuthenticated) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>;
  }

  return (
    <Box sx={{ p: 1, backgroundColor: '#f5f7fa', minHeight: 'calc(100vh - 64px)' }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          color="inherit" 
          href="/dashboard" 
          sx={{ display: 'flex', alignItems: 'center' }}
          onClick={(e) => {
            e.preventDefault();
            router.push('/dashboard');
          }}
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Dashboard
        </Link>
        
        <Typography color="text.primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <LocationOnIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          Regions
        </Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            Regions Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Create, view, update and delete regions in the system
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Region
        </Button>
      </Box>

      {/* Content */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading && regions.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error && regions.length === 0 ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : (
          <>
            <TableContainer>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {regions
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((region) => (
                      <TableRow 
                        hover 
                        key={region.id} 
                        onClick={() => router.push(`/dashboard/admin/regions/${region.id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{region.name}</TableCell>
                        <TableCell>{region.description}</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            color="info" 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/admin/regions/${region.id}`); }}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton 
                            color="primary" 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleOpenDialog(region); }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="error" 
                            size="small" 
                            onClick={(e) => { e.stopPropagation(); handleDelete(region.id); }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  {regions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body1" sx={{ py: 3 }}>
                          No regions found. Click the "Add Region" button to create one.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={regions.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>

      {/* Add/Edit Region Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingRegion ? 'Edit Region' : 'Add New Region'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Region Name"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={handleInputChange}
            sx={{ mb: 2, mt: 1 }}
            required
          />
          <TextField
            margin="dense"
            name="code"
            label="Region Code"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.code}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
            required
            helperText="A short, unique code for the region (e.g., 'WR' for Western Region)"
          />
          <TextField
            margin="dense"
            name="description"
            label="Description (Optional)"
            type="text"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary" 
            disabled={!formData.name || !formData.code || loading}
          >
            {loading ? <CircularProgress size={24} /> : (editingRegion ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}