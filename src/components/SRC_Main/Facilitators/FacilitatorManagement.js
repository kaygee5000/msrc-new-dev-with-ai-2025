import React, { useState } from 'react';
import {
  Box, Button, ButtonGroup, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress, Alert, Tooltip,
  Menu, MenuItem, Checkbox, FormControlLabel, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DownloadIcon from '@mui/icons-material/Download';

const VIEW = {
  FACILITATORS: 'facilitators',
  ATTENDANCE: 'attendance',
  LESSONS: 'lessons',
};

export default function FacilitatorManagement({ filterParams }) {
  const [activeView, setActiveView] = useState(VIEW.FACILITATORS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  // Column selection
  const FACILITATOR_COLUMNS = [
    { key: 'first_name', label: 'First Name', always: false },
    { key: 'last_name', label: 'Last Name', always: false },
    { key: 'staff_number', label: 'Staff Number', always: false },
    { key: 'rank', label: 'Rank', always: false },
    { key: 'qualification', label: 'Qualification', always: false },
    { key: 'school_name', label: 'School', always: false },
  ];
  const ATTENDANCE_COLUMNS = [
    { key: 'first_name', label: 'First Name', always: false },
    { key: 'last_name', label: 'Last Name', always: false },
    { key: 'staff_number', label: 'Staff Number', always: false },
    { key: 'school_name', label: 'School', always: false },
    { key: 'present_days', label: 'Present Days', always: false },
    { key: 'absent_days', label: 'Absent Days', always: false },
    { key: 'late_days', label: 'Late Days', always: false },
    { key: 'attendance_rate', label: 'Attendance %', always: false },
    { key: 'punctuality_rate', label: 'Punctuality %', always: false },
  ];
  const LESSON_COLUMNS = [
    { key: 'first_name', label: 'First Name', always: false },
    { key: 'last_name', label: 'Last Name', always: false },
    { key: 'staff_number', label: 'Staff Number', always: false },
    { key: 'school_name', label: 'School', always: false },
    { key: 'subject', label: 'Subject', always: false },
    { key: 'units_covered', label: 'Units Covered', always: false },
    { key: 'lessons_planned', label: 'Lessons Planned', always: false },
    { key: 'exercises_given', label: 'Exercises Given', always: false },
    { key: 'exercises_marked', label: 'Exercises Marked', always: false },
  ];
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedColumns, setSelectedColumns] = useState(FACILITATOR_COLUMNS.map(col => col.key));
  // Dialog states
  const [editDialog, setEditDialog] = useState({ open: false, row: null });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, row: null });
  const [transferDialog, setTransferDialog] = useState({ open: false, row: null, reason: '' });

  // Fetch data only when view changes
  const fetchData = async (view) => {
    setLoading(true);
    setError(null);
    setData([]);
    let url = '';
    const q = new URLSearchParams();
    ['school_id', 'circuit_id', 'district_id', 'region_id'].forEach(k => {
      if (filterParams && filterParams[k]) q.append(k, filterParams[k]);
    });
    if (view === VIEW.FACILITATORS) {
      url = `/api/school-report/main/facilitators?${q}`;
    } else if (view === VIEW.ATTENDANCE) {
      url = `/api/school-report/main/facilitators/attendance?${q}`;
    } else if (view === VIEW.LESSONS) {
      url = `/api/school-report/main/facilitators/strands-covered?${q}`;
    }
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    // Set default columns for each view
    if (view === VIEW.FACILITATORS) setSelectedColumns(FACILITATOR_COLUMNS.map(col => col.key));
    else if (view === VIEW.ATTENDANCE) setSelectedColumns(ATTENDANCE_COLUMNS.map(col => col.key));
    else if (view === VIEW.LESSONS) setSelectedColumns(LESSON_COLUMNS.map(col => col.key));
    fetchData(view);
  };

  // Column selector logic
  const handleColumnMenu = (e) => setAnchorEl(e.currentTarget);
  const handleColumnClose = () => setAnchorEl(null);
  const handleColumnToggle = (key) => {
    setSelectedColumns(cols =>
      cols.includes(key) ? cols.filter(c => c !== key) : [...cols, key]
    );
  };

  // Export to CSV
  const handleExport = () => {
    if (!data.length) return;
    let columns;
    if (activeView === VIEW.FACILITATORS) columns = FACILITATOR_COLUMNS.filter(col => selectedColumns.includes(col.key));
    else if (activeView === VIEW.ATTENDANCE) columns = ATTENDANCE_COLUMNS.filter(col => selectedColumns.includes(col.key));
    else columns = LESSON_COLUMNS.filter(col => selectedColumns.includes(col.key));
    const csvRows = [columns.map(col => col.label).join(',')];
    data.forEach(row => {
      csvRows.push(columns.map(col => JSON.stringify(row[col.key] ?? '')).join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeView}-export.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Dialog handlers
  const handleEdit = (row) => setEditDialog({ open: true, row });
  const handleDelete = (row) => setDeleteDialog({ open: true, row });
  const handleTransfer = (row) => setTransferDialog({ open: true, row, reason: '' });
  // Backend integration for delete
  const confirmDelete = async () => {
    try {
      const res = await fetch(`/api/school-report/main/facilitators?id=${deleteDialog.row.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setData(data.filter(d => d.id !== deleteDialog.row.id));
      setDeleteDialog({ open: false, row: null });
    } catch (err) {
      setError(err.message);
    }
  };
  // Backend integration for transfer
  const confirmTransfer = async () => {
    try {
      const res = await fetch(`/api/school-report/main/facilitators/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: transferDialog.row.id, reason: transferDialog.reason })
      });
      if (!res.ok) throw new Error('Failed to transfer');
      fetchData(activeView);
      setTransferDialog({ open: false, row: null, reason: '' });
    } catch (err) {
      setError(err.message);
    }
  };
  // Simple edit (stub, just closes dialog)
  const confirmEdit = () => setEditDialog({ open: false, row: null });

  // Render table based on view
  const renderTable = () => {
    if (loading) return <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!data.length) return <Alert severity="info">No data available.</Alert>;
    if (activeView === VIEW.FACILITATORS) {
      return (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Staff Number</TableCell>
                <TableCell>Rank</TableCell>
                <TableCell>Qualification</TableCell>
                <TableCell>School</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(row => (
                <TableRow key={row.id}>
                  <TableCell>{row.first_name} {row.last_name}</TableCell>
                  <TableCell>{row.staff_number}</TableCell>
                  <TableCell>{row.rank}</TableCell>
                  <TableCell>{row.qualification}</TableCell>
                  <TableCell>{row.school_name}</TableCell>
                  <TableCell>
                    <Tooltip title="Edit"><IconButton onClick={() => handleEdit(row)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Transfer"><IconButton onClick={() => handleTransfer(row)}><SwapHorizIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton color="error" onClick={() => handleDelete(row)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    } else if (activeView === VIEW.ATTENDANCE) {
      return (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Staff Number</TableCell>
                <TableCell>School</TableCell>
                <TableCell>Present Days</TableCell>
                <TableCell>Absent Days</TableCell>
                <TableCell>Late Days</TableCell>
                <TableCell>Attendance %</TableCell>
                <TableCell>Punctuality %</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(row => (
                <TableRow key={row.id || row.staff_number}>
                  <TableCell>{row.first_name} {row.last_name}</TableCell>
                  <TableCell>{row.staff_number}</TableCell>
                  <TableCell>{row.school_name}</TableCell>
                  <TableCell>{row.present_days}</TableCell>
                  <TableCell>{row.absent_days}</TableCell>
                  <TableCell>{row.late_days}</TableCell>
                  <TableCell>{row.attendance_rate}%</TableCell>
                  <TableCell>{row.punctuality_rate}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    } else if (activeView === VIEW.LESSONS) {
      return (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Staff Number</TableCell>
                <TableCell>School</TableCell>
                <TableCell>Subject</TableCell>
                <TableCell>Units Covered</TableCell>
                <TableCell>Lessons Planned</TableCell>
                <TableCell>Exercises Given</TableCell>
                <TableCell>Exercises Marked</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(row => (
                <TableRow key={row.id || row.staff_number}>
                  <TableCell>{row.first_name} {row.last_name}</TableCell>
                  <TableCell>{row.staff_number}</TableCell>
                  <TableCell>{row.school_name}</TableCell>
                  <TableCell>{row.subject || ''}</TableCell>
                  <TableCell>{row.units_covered}</TableCell>
                  <TableCell>{row.lessons_planned}</TableCell>
                  <TableCell>{row.exercises_given}</TableCell>
                  <TableCell>{row.exercises_marked}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }
    return null;
  };

  return (
    <Box>
      <ButtonGroup sx={{ mb: 2 }}>
        <Button variant={activeView === VIEW.FACILITATORS ? 'contained' : 'outlined'} onClick={() => handleViewChange(VIEW.FACILITATORS)}>Facilitators</Button>
        <Button variant={activeView === VIEW.ATTENDANCE ? 'contained' : 'outlined'} onClick={() => handleViewChange(VIEW.ATTENDANCE)}>Attendance</Button>
        <Button variant={activeView === VIEW.LESSONS ? 'contained' : 'outlined'} onClick={() => handleViewChange(VIEW.LESSONS)}>Lesson Data</Button>
      </ButtonGroup>
      <Box sx={{ display: 'flex', mb: 1, alignItems: 'center', gap: 2 }}>
        <Button onClick={handleColumnMenu} startIcon={<MoreVertIcon />}>Columns</Button>
        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={handleColumnClose}>
          {(activeView === VIEW.FACILITATORS ? FACILITATOR_COLUMNS : activeView === VIEW.ATTENDANCE ? ATTENDANCE_COLUMNS : LESSON_COLUMNS).map(col => (
            <MenuItem key={col.key}>
              <FormControlLabel
                control={<Checkbox checked={selectedColumns.includes(col.key)} onChange={() => handleColumnToggle(col.key)} />}
                label={col.label}
              />
            </MenuItem>
          ))}
        </Menu>
        <Button onClick={handleExport} startIcon={<DownloadIcon />}>Export CSV</Button>
      </Box>
      {renderTable()}
      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, row: null })}>
        <DialogTitle>Edit Teacher</DialogTitle>
        <DialogContent>
          {editDialog.row && (
            <Box component="form" sx={{ mt: 1 }}>
              <TextField margin="dense" label="First Name" fullWidth value={editDialog.row.first_name || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, first_name: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Last Name" fullWidth value={editDialog.row.last_name || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, last_name: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Other Names" fullWidth value={editDialog.row.other_names || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, other_names: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Email" fullWidth value={editDialog.row.email || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, email: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Phone Number" fullWidth value={editDialog.row.phone_number || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, phone_number: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Staff Number" fullWidth value={editDialog.row.staff_number || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, staff_number: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Rank" fullWidth value={editDialog.row.rank || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, rank: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Qualification" fullWidth value={editDialog.row.qualification || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, qualification: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Academic Qualification" fullWidth value={editDialog.row.academic_qualification || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, academic_qualification: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Professional Qualification" fullWidth value={editDialog.row.professional_qualification || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, professional_qualification: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Avatar URL" fullWidth value={editDialog.row.avatar || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, avatar: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Category" fullWidth value={editDialog.row.category || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, category: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Year Posted to School" fullWidth value={editDialog.row.year_posted_to_school || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, year_posted_to_school: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="School ID" fullWidth value={editDialog.row.current_school_id || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, current_school_id: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Date Started as Headteacher" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editDialog.row.date_started_headteacher || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, date_started_headteacher: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Date Started as Teacher" type="date" fullWidth InputLabelProps={{ shrink: true }} value={editDialog.row.date_started_teacher || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, date_started_teacher: e.target.value } }))} sx={{ mb: 2 }} />
              <TextField margin="dense" label="Gender" select fullWidth SelectProps={{ native: true }} value={editDialog.row.gender || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, gender: e.target.value } }))} sx={{ mb: 2 }} >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </TextField>
              <TextField margin="dense" label="Status" select fullWidth SelectProps={{ native: true }} value={editDialog.row.status || ''} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, status: e.target.value } }))} sx={{ mb: 2 }} >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="retired">Retired</option>
              </TextField>
              <FormControlLabel control={<Checkbox checked={!!editDialog.row.is_headteacher} onChange={e => setEditDialog(ed => ({ ...ed, row: { ...ed.row, is_headteacher: e.target.checked ? 1 : 0 } }))} />} label="Is Headteacher" sx={{ mb: 2 }} />
            </Box>
          )}
          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, row: null })}>Cancel</Button>
          <Button variant="contained" onClick={async () => {
            if (!editDialog.row) return;
            setLoading(true);
            setError(null);
            try {
              const res = await fetch(`/api/school-report/main/facilitators`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editDialog.row)
              });
              if (!res.ok) throw new Error('Failed to update teacher');
              // Update data in UI
              const updated = await res.json();
              setData(prev => prev.map(t => t.id === updated.id ? updated : t));
              setEditDialog({ open: false, row: null });
            } catch (err) {
              setError(err.message);
            }
            setLoading(false);
          }}>Save</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, row: null })}>
        <DialogTitle>Delete Teacher</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this teacher?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, row: null })}>Cancel</Button>
          <Button color="error" onClick={confirmDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
      {/* Transfer Dialog */}
      <Dialog open={transferDialog.open} onClose={() => setTransferDialog({ open: false, row: null, reason: '' })}>
        <DialogTitle>Transfer Teacher</DialogTitle>
        <DialogContent>
          <Typography>Enter reason for transfer:</Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Reason"
            type="text"
            fullWidth
            value={transferDialog.reason}
            onChange={e => setTransferDialog({ ...transferDialog, reason: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransferDialog({ open: false, row: null, reason: '' })}>Cancel</Button>
          <Button onClick={confirmTransfer}>Transfer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
