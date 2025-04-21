'use client';

import React, { useEffect, useState } from 'react';
import Charts from '@/components/Charts';
import { useRouter } from 'next/navigation';
import { 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Box,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Alert,
  Stack,
  Menu,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AnalyticsIcon from '@mui/icons-material/BarChart';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';

function CreateItineraryDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    type: 'quarterly',
    period: '',
    year: '',
    from_date: '',
    until_date: ''
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/rtp/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to create itinerary');
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Itinerary</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              name="title"
              label="Title"
              value={form.title}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel id="type-label">Type</InputLabel>
              <Select
                labelId="type-label"
                name="type"
                value={form.type}
                onChange={handleChange}
                label="Type"
              >
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="semi_annually">Semi-Annually</MenuItem>
                <MenuItem value="annually">Annually</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="period"
              label="Period"
              value={form.period}
              onChange={handleChange}
              type="number"
              InputProps={{ inputProps: { min: 1 } }}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="year"
              label="Year"
              value={form.year}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="from_date"
              label="From Date"
              value={form.from_date}
              onChange={handleChange}
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="until_date"
              label="Until Date"
              value={form.until_date}
              onChange={handleChange}
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
          </Grid>
        </Grid>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary" 
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? 'Creating...' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditItineraryDialog({ open, onClose, onSaved, itinerary }) {
  const [form, setForm] = useState(itinerary || {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  useEffect(() => { setForm(itinerary || {}); }, [itinerary]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/rtp/itineraries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) throw new Error('Failed to update itinerary');
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Edit Itinerary</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              name="title"
              label="Title"
              value={form.title || ''}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth required>
              <InputLabel id="type-label-edit">Type</InputLabel>
              <Select
                labelId="type-label-edit"
                name="type"
                value={form.type || ''}
                onChange={handleChange}
                label="Type"
              >
                <MenuItem value="quarterly">Quarterly</MenuItem>
                <MenuItem value="semi_annually">Semi-Annually</MenuItem>
                <MenuItem value="annually">Annually</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="period"
              label="Period"
              value={form.period || ''}
              onChange={handleChange}
              type="number"
              InputProps={{ inputProps: { min: 1 } }}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="year"
              label="Year"
              value={form.year || ''}
              onChange={handleChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="from_date"
              label="From Date"
              value={form.from_date || ''}
              onChange={handleChange}
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="until_date"
              label="Until Date"
              value={form.until_date || ''}
              onChange={handleChange}
              type="date"
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />
          </Grid>
        </Grid>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary" 
          disabled={saving}
          startIcon={saving ? <CircularProgress size={20} /> : null}
        >
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ItineraryAdminPage({ onItinerarySelected }) {
  const router = useRouter();
  const [itineraries, setItineraries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, itinerary: null });
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [currentItinerary, setCurrentItinerary] = useState(null);

  useEffect(() => {
    async function fetchItineraries() {
      setLoading(true);
      try {
        const res = await fetch('/api/rtp/itineraries');
        const data = await res.json();
        console.log('Fetched itineraries:', data);
        
        setItineraries(data.itineraries || []);
      } catch (err) {
        setError('Failed to load itineraries');
      } finally {
        setLoading(false);
      }
    }
    fetchItineraries();
  }, []);

  const reload = () => {
    setLoading(true);
    setError(null);
    fetch('/api/rtp/itineraries')
      .then(res => res.json())
      .then(data => setItineraries(data.itineraries || []))
      .catch(() => setError('Failed to load itineraries'))
      .finally(() => setLoading(false));
  };

  const handleActionMenuOpen = (event, itinerary) => {
    setActionMenuAnchor(event.currentTarget);
    setCurrentItinerary(itinerary);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
  };

  const handleRowClick = (itinerary) => {
    setSelectedItinerary(itinerary);
    // Navigate to the itinerary questions page
    router.push(`/dashboard/admin/rtp/itineraries/${itinerary.id}/questions`);
  };

  const handleSelectItinerary = () => {
    if (currentItinerary && onItinerarySelected) {
      onItinerarySelected(currentItinerary);
    }
    handleActionMenuClose();
  };

  async function handleDelete() {
    if (!currentItinerary) return;
    if (!window.confirm('Delete this itinerary?')) return;
    await fetch('/api/rtp/itineraries?id=' + currentItinerary.id, { method: 'DELETE' });
    reload();
    handleActionMenuClose();
  }

  function handleEdit() {
    if (!currentItinerary) return;
    setEditDialog({open: true, itinerary: currentItinerary});
    handleActionMenuClose();
  }

  function handleExportCSV() {
    if (!currentItinerary) return;
    // TODO: Implement CSV export for itinerary data
    alert('Export CSV for itinerary ' + currentItinerary.title);
    handleActionMenuClose();
  }

  function handleShowAnalytics() {
    if (!currentItinerary) return;
    setSelectedItinerary(currentItinerary);
    setShowAnalytics(true);
    handleActionMenuClose();
  }

  const handleViewQuestions = () => {
    if (!currentItinerary) return;
    router.push(`/dashboard/admin/rtp/itineraries/${currentItinerary.id}/questions`);
    handleActionMenuClose();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Itinerary Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => setShowDialog(true)}
        >
          Create Itinerary
        </Button>
      </Box>
      
      <CreateItineraryDialog open={showDialog} onClose={() => setShowDialog(false)} onCreated={reload} />
      <EditItineraryDialog open={editDialog.open} onClose={() => setEditDialog({open:false,itinerary:null})} onSaved={reload} itinerary={editDialog.itinerary} />
      
      {/* Summary dashboard */}
      <Paper sx={{ width: '100%', mb: 4, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="itineraries table">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Year</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>From</TableCell>
                <TableCell>Until</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <CircularProgress size={40} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : itineraries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} align="center">
                    <Typography variant="body1" sx={{ py: 2 }}>No itineraries found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                itineraries.map(it => (
                  <TableRow 
                    key={it.id} 
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      backgroundColor: selectedItinerary?.id === it.id ? 'action.selected' : 'inherit',
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      }
                    }}
                    onClick={() => handleRowClick(it)}
                  >
                    <TableCell>{it.id}</TableCell>
                    <TableCell>{it.title}</TableCell>
                    <TableCell>{it.type}</TableCell>
                    <TableCell>{it.period}</TableCell>
                    <TableCell>{it.year}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: it.is_valid ? 'success.light' : 'text.disabled',
                          color: 'white',
                        }}
                      >
                        {it.is_valid ? 'Active' : 'Inactive'}
                      </Box>
                    </TableCell>
                    <TableCell>{it.from_date}</TableCell>
                    <TableCell>{it.until_date}</TableCell>
                    <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Actions">
                        <IconButton
                          size="small"
                          onClick={(e) => handleActionMenuOpen(e, it)}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Paper>
      
      {/* Actions Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        {onItinerarySelected && (
          <MenuItem onClick={handleSelectItinerary}>
            <Typography variant="inherit" noWrap>
              Select
            </Typography>
          </MenuItem>
        )}
        <MenuItem onClick={handleViewQuestions}>
          <QuestionMarkIcon fontSize="small" sx={{ mr: 1 }} color="primary" />
          <Typography variant="inherit" noWrap>
            Manage Questions
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          <Typography variant="inherit" noWrap>
            Edit
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} color="error" />
          <Typography variant="inherit" noWrap>
            Delete
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleShowAnalytics}>
          <AnalyticsIcon fontSize="small" sx={{ mr: 1 }} color="info" />
          <Typography variant="inherit" noWrap>
            Analytics
          </Typography>
        </MenuItem>
        <MenuItem onClick={handleExportCSV}>
          <FileDownloadIcon fontSize="small" sx={{ mr: 1 }} color="success" />
          <Typography variant="inherit" noWrap>
            Export
          </Typography>
        </MenuItem>
      </Menu>
      
      {/* Analytics modal/section */}
      <Dialog 
        open={showAnalytics && !!selectedItinerary} 
        onClose={() => setShowAnalytics(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Analytics for: {selectedItinerary?.title}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ minHeight: '50vh' }}>
            {selectedItinerary && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="body1" gutterBottom>
                  Loading analytics for {selectedItinerary?.title}...
                </Typography>
                {/* Provide default props to Charts component to prevent TypeError */}
                <Charts 
                  itineraryId={selectedItinerary.id} 
                  type="bar"
                  options={{
                    chart: {
                      type: 'bar',
                      toolbar: {
                        show: false
                      }
                    },
                    xaxis: {
                      categories: ['Loading...']
                    }
                  }}
                  series={[{
                    name: 'Loading data...',
                    data: [0]
                  }]}
                  height={300}
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAnalytics(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}