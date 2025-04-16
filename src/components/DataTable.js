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
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(pageSize);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Format cell value based on valueFormatter if provided in column definition
  const formatCellValue = (row, column) => {
    const value = row[column.field];
    if (column.valueFormatter && value !== undefined && value !== null) {
      return column.valueFormatter({ value, row });
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
                  key={row.id || index}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  style={onRowClick ? { cursor: 'pointer' } : {}}
                >
                  {columns.map((column) => (
                    <TableCell key={`${row.id || index}-${column.field}`}>
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