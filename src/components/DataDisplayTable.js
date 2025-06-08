'use client';

import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Typography,
  Box
} from '@mui/material';

/**
 * A reusable component for displaying tabular data with pagination
 * @param {Object} props - Component props
 * @param {Array} props.data - Array of objects to display in the table
 * @param {string} props.title - Title for the table
 * @returns {JSX.Element} - Rendered component
 */
export default function DataDisplayTable({ data, title }) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Handle empty data case
  if (!data || data.length === 0) {
    return (
      <Paper elevation={1} sx={{ p: 2 }}>
        <Typography variant="body1">No data available for {title}.</Typography>
      </Paper>
    );
  }

  // Extract column headers from the first data item
  const columns = Object.keys(data[0]).filter(key => 
    // Filter out any keys that are IDs or should be hidden
    !key.toLowerCase().includes('_id') || 
    key === 'school_id' || 
    key === 'circuit_id' || 
    key === 'district_id' || 
    key === 'region_id'
  );

  // Format column headers for display (capitalize and replace underscores with spaces)
  const formatColumnHeader = (header) => {
    return header
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Format cell value based on its type
  const formatCellValue = (value) => {
    // Handle null or undefined
    if (value === null || value === undefined) return '-';
    
    // Handle boolean values
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    
    // Handle numbers
    if (typeof value === 'number') return value.toString();
    
    // Handle objects (including arrays and dates)
    if (typeof value === 'object') {
      try {
        // For dates
        if (value instanceof Date) return value.toLocaleDateString();
        
        // For arrays
        if (Array.isArray(value)) {
          return value.map(item => formatCellValue(item)).join(', ');
        }
        
        // Special case for objects with status and measure_item properties
        if (value.status !== undefined && value.measure_item !== undefined) {
          return `${value.status}: ${value.measure_item}`;
        }
        
        // For other objects with toString method
        if (typeof value.toString === 'function' && value.toString !== Object.prototype.toString) {
          return value.toString();
        }
        
        // For regular objects, stringify them
        return JSON.stringify(value);
      } catch (e) {
        console.error('Error formatting cell value:', e);
        return '[Object]';
      }
    }
    
    // Default: convert to string
    return String(value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ width: '100%' }}>
      {title && (
        <Typography variant="h6" gutterBottom component="div">
          {title}
        </Typography>
      )}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label={`${title} table`} size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column} sx={{ fontWeight: 'bold' }}>
                    {formatColumnHeader(column)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {data
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row, rowIndex) => (
                  <TableRow hover key={rowIndex}>
                    {columns.map((column) => (
                      <TableCell key={`${rowIndex}-${column}`}>
                        {formatCellValue(row[column])}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={data.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
}
