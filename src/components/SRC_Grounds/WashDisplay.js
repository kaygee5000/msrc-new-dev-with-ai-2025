'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';

const DataDisplayTable = ({ data, title }) => {
  if (!data || data.length === 0) return <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>No data for {title}.</Typography>;
  const headers = Object.keys(data[0]).filter(key => typeof data[0][key] !== 'object');
  return (
    <TableContainer component={Paper} sx={{ mb: 3 }} variant="outlined">
      <Table size="small">
        <TableHead sx={{ backgroundColor: 'grey.100' }}>
          <TableRow>
            {headers.map(h => <TableCell key={h} sx={{ fontWeight: 'bold' }}>{h.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</TableCell>)}
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((row, i) => (
            <TableRow key={i} hover>
              {headers.map(h => <TableCell key={`${i}-${h}`}>{String(row[h])}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default function WashDisplay({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const title = 'WASH';

  const fetchData = useCallback(async () => {
    if (!filterParams?.school_id) { setData(null); return; }
    setLoading(true); setError(null);
    const q = new URLSearchParams();
    ['school_id','year','term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    try {
      const res = await fetch(`/api/school-report/grounds/wash?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      setData(await res.json());
    } catch(e) { console.error(`Error fetching ${title}:`, e); setError(e.message); setData(null); }
    setLoading(false);
  }, [filterParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <Box display="flex" p={2}><CircularProgress size={24} sx={{ mr: 1 }} /><Typography>Loading {title}...</Typography></Box>;
  if (error) return <Alert severity="warning" sx={{ mt:1, mb:2 }}>Error loading {title}: {error}</Alert>;

  return <Box sx={{ width:'100%' }}><DataDisplayTable data={data} title={title}/></Box>;
}
