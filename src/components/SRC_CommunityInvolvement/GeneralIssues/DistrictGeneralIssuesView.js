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
  { circuit: 'Circuit A', issue: 'Flooded classroom', status: 'Open' },
  { circuit: 'Circuit B', issue: 'Power outage', status: 'In Progress' }
];

export default function DistrictGeneralIssuesView({ filterParams }) {
  const [view, setView] = useState('table');
  return (
    <Paper sx={{ mt: 2, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">General Issues (District)</Typography>
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
                <TableCell>Circuit</TableCell>
                <TableCell>Issue</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockData.map((row, i) => (
                <TableRow key={i}>
                  <TableCell>{row.circuit}</TableCell>
                  <TableCell>{row.issue}</TableCell>
                  <TableCell>{row.status}</TableCell>
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
                <Typography variant="subtitle1">{row.circuit}</Typography>
                <Typography variant="body2">Issue: {row.issue}</Typography>
                <Typography variant="body2">Status: {row.status}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}
    </Paper>
  );
}
