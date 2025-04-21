'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination
} from '@mui/material';
import { formatDate, formatDateTime } from '@/utils/dates';

/**
 * DataTable component for displaying tabular data with pagination
 *
 * @param {Object} props - Component props
 * @param {Array} props.columns - Array of column definitions with field, headerName, and width
 * @param {Array} props.rows - Array of data objects to display
 * @param {number} props.pageSize - Number of rows per page (default: 10)
 * @param {Function} props.onRowClick - Callback function to handle row click events
 * @returns {React.Component} - DataTable component
 */
const DataTable = ({ columns = [], rows = [], pageSize = 10, onRowClick }) => {
  console.log('[DataTable] rows prop:', rows);

  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(pageSize);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Helper to generate a unique key for each row
  const getRowKey = (row, index) => {
    const key = (row.id !== undefined && row.id !== null) ? row.id : (Object.values(row).join('-') + '-' + index);
    // console.log('[DataTable] Row key:', key, '| Row:', row);
    return key;
  };

  // Format cell value based on valueFormatter if provided in column definition
  const formatCellValue = (row, column) => {
    const value = row[column.field];
    
    // If column has a valueFormatter, use it
    if (column.valueFormatter && value !== undefined && value !== null) {
      return column.valueFormatter({ value, row });
    }
    
    // Auto-format date fields with our standard format
    if (value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)))) {
      // Check if field name likely contains a date
      const fieldName = column.field.toLowerCase();
      if (fieldName.includes('date') || 
          fieldName.includes('created_at') || 
          fieldName.includes('updated_at') ||
          fieldName.includes('submitted_at') ||
          fieldName === 'timestamp' ||
          fieldName.includes('_at')) {
        
        // Use time if field likely contains time information
        if (fieldName.includes('time') || fieldName.includes('created_at')) {
          return formatDateTime(value);
        }
        return formatDate(value);
      }
    }
    
    return value;
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <TableContainer sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.field}
                  style={{ minWidth: column.width || 100 }}
                >
                  {column.headerName}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row, index) => (
                <TableRow 
                  hover 
                  key={getRowKey(row, index)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : {}}
                >
                  {columns.map((column) => (
                    <TableCell key={`${getRowKey(row, index)}-${column.field}`}>
                      {formatCellValue(row, column)}
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
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  );
};

export default DataTable;