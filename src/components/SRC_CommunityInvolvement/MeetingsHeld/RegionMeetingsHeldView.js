import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid
} from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';

const mockData = [
  { school: 'School A', meetings: 3, notes: 'PTA, SGB, Staff' },
  { school: 'School B', meetings: 2, notes: 'SGB, Staff' }
];

export default function RegionMeetingsHeldView({ filterParams }) {
  const [view, setView] = useState('table');
  return (
    <Paper sx={{ mt: 2, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Meetings Held (Region)</Typography>
        <ToggleButtonGroup value={view} exclusive onChange={(_, v) => v && setView(v)}>
          <ToggleButton value="table"><TableRowsIcon /></ToggleButton>
          <ToggleButton value="grid"><GridViewIcon /></ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {view === 'table' ? (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>School</TableCell>
                <TableCell>Meetings</TableCell>
                <TableCell>Notes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockData.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.school}</TableCell>
                  <TableCell>{row.meetings}</TableCell>
                  <TableCell>{row.notes}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Grid container spacing={2}>
          {mockData.map((row, i) => (
            <Grid item size={{ xs: 12, sm: 6, md: 3 }} key={i}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle1">{row.school}</Typography>
                <Typography variant="body2">Meetings: {row.meetings}</Typography>
                <Typography variant="body2">{row.notes}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
}
