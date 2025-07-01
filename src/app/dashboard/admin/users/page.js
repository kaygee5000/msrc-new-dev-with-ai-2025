'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tooltip,
  CircularProgress,
  Pagination,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FilterListIcon from '@mui/icons-material/FilterList';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UsersList() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null, userName: '' });

  // Fetch users on component mount and when filters change
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, typeFilter, fetchUsers]);
  
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const queryParams = new URLSearchParams({
        page,
        limit: rowsPerPage,
        ...(typeFilter && { type: typeFilter }),
        ...(searchTerm && { search: searchTerm }),
        includeProgramRoles: true // Request program roles with users
      });
      
      const response = await fetch(`/api/users?${queryParams.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setUsers(data.users);
        setTotalUsers(data.total);
      } else {
        throw new Error(data.message || 'Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'An error occurred while fetching users');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, typeFilter, searchTerm]);
  
  const handleSearch = () => {
    setPage(1); // Reset to first page
    fetchUsers();
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };
  
  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
    setPage(1); // Reset to first page
  };
  
  const resetFilters = () => {
    setTypeFilter('');
    setSearchTerm('');
    setPage(1);
  };
  
  const handleDeleteClick = (userId, userName) => {
    setDeleteDialog({
      open: true,
      userId,
      userName
    });
  };
  
  const handleDeleteConfirm = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(`/api/users/${deleteDialog.userId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Remove user from the local state
        setUsers(users.filter(user => user.id !== deleteDialog.userId));
        setTotalUsers(prev => prev - 1);
      } else {
        throw new Error(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message || 'An error occurred while deleting the user');
    } finally {
      setLoading(false);
      setDeleteDialog({ open: false, userId: null, userName: '' });
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, userId: null, userName: '' });
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
      'national_admin': 'error',
      'regional_admin': 'primary',
      'district_admin': 'primary',
      'data_collector': 'success',
      'circuit_supervisor': 'success',
      'head_teacher': 'warning',
      // 'rtp_collector': 'warning',
      'super_admin': 'error'
    };
    
    return typeMap[type] || 'default';
  };
  
  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            User Management
          </Typography>
          
          <Box>
            <Button 
              variant="outlined" 
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mr: 1 }}
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <Button 
              variant="outlined" 
              startIcon={<FileUploadIcon />}
              component={Link}
              href="/dashboard/admin/users/batch-create"
              sx={{ mr: 1 }}
            >
              Batch Upload
            </Button>
            
            <Button 
              variant="contained" 
              startIcon={<PersonAddIcon />}
              component={Link}
              href="/dashboard/admin/users/create"
            >
              Add User
            </Button>
          </Box>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                placeholder="Search by name, email, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm('')}
                      >
                        &times;
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            
            <Grid size={{ xs: 12, md: 2 }}>
              <Button 
                variant="contained" 
                onClick={handleSearch}
                fullWidth
              >
                Search
              </Button>
            </Grid>
            
            <Grid size={{ xs: 12, md: 2 }}>
              <Button 
                variant="outlined" 
                onClick={resetFilters}
                startIcon={<RefreshIcon />}
                fullWidth
              >
                Reset
              </Button>
            </Grid>
            
            <Grid size={{ xs: 12, md: 2 }}>
              <Button 
                variant="outlined" 
                onClick={fetchUsers}
                startIcon={<RefreshIcon />}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        {showFilters && (
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <FormControl fullWidth>
                  <InputLabel id="type-filter-label">User Type</InputLabel>
                  <Select
                    labelId="type-filter-label"
                    id="type-filter"
                    value={typeFilter}
                    label="User Type"
                    onChange={handleTypeFilterChange}
                  >
                    <MenuItem value="">All Types</MenuItem>
                    <MenuItem value="national_admin">National Admin</MenuItem>
                    <MenuItem value="regional_admin">Regional Admin</MenuItem>
                    <MenuItem value="district_admin">District Admin</MenuItem>
                    <MenuItem value="circuit_supervisor">SISO</MenuItem>
                    <MenuItem value="head_teacher">Head Facilitator</MenuItem>
                    <MenuItem value="data_collector">Data Collector</MenuItem>
                    {/* <MenuItem value="rtp_collector">RTP Collector</MenuItem> */}
                    {/* <MenuItem value="super_admin">Super Admin</MenuItem> */}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <TableContainer component={Paper} elevation={0} variant="outlined">
          <Table sx={{ minWidth: 650 }} aria-label="users table">
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      Loading users...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography variant="body1">
                      No users found.
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {searchTerm || typeFilter ? 
                        'Try changing your search criteria or filters.' : 
                        'Click "Add User" to create a new user.'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{(user.first_name + " " + user.last_name) || "No Name"}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone_number || '-'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={formatUserType(user.type)} 
                        color={getUserTypeColor(user.type)} 
                        size="small" 
                        variant="outlined"
                      />
                    </TableCell>
                   
                    <TableCell>
                      {user.birth_date ? 
                        new Date(user.birth_date).toLocaleDateString() : 
                        '-'}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View User">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => router.push(`/dashboard/admin/users/${user.id}`)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Edit User">
                        <IconButton 
                          size="small" 
                          color="secondary"
                          onClick={() => router.push(`/dashboard/admin/users/${user.id}/edit`)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      
                      <Tooltip title="Delete User">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDeleteClick(user.id, user.first_name + " " + user.last_name)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            {loading ? 
              'Loading...' : 
              `Showing ${users.length} of ${totalUsers} users`}
          </Typography>
          
          <Stack spacing={2} direction="row" alignItems="center">
            <Pagination 
              count={Math.ceil(totalUsers / rowsPerPage)} 
              page={page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton 
              showLastButton
            />
            
            <FormControl variant="outlined" size="small" sx={{ minWidth: 80 }}>
              <InputLabel id="rows-per-page-label">Per Page</InputLabel>
              <Select
                labelId="rows-per-page-label"
                id="rows-per-page"
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(e.target.value);
                  setPage(1);
                }}
                label="Per Page"
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Box>
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialog.open}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Confirm User Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete user <strong>{deleteDialog.userName}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={loading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}