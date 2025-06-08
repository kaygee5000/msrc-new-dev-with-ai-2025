'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper
} from '@mui/material';
import DataDisplayTable from '@/components/DataDisplayTable';

export default function SchoolRecordBooksView({ filterParams }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const title = 'Record Books';

  const fetchData = useCallback(async () => {
    if (!filterParams?.school_id) { setData(null); return; }
    setLoading(true); setError(null);
    const q = new URLSearchParams();
    ['school_id','year','term'].forEach(k => filterParams[k] && q.append(k, filterParams[k]));
    try {
      const res = await fetch(`/api/school-report/management/record-books?${q}`);
      if (!res.ok) throw new Error((await res.json()).message || `Error ${res.status}`);
      setData(await res.json());
    } catch(e) { 
      console.error(`Error fetching ${title}:`, e); 
      setError(e.message); 
      setData(null); 
    }
    setLoading(false);
  }, [filterParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <Box display="flex" p={2}>
      <CircularProgress size={24} sx={{ mr: 1 }} />
      <Typography>Loading {title}...</Typography>
    </Box>
  );
  
  if (error) return (
    <Alert severity="warning" sx={{ mt:1, mb:2 }}>
      Error loading {title}: {error}
    </Alert>
  );

  if (!data || data.length === 0) return (
    <Paper elevation={0} sx={{ p: 2, mt: 1 }}>
      <Typography variant="body1">No record books data available for this school.</Typography>
    </Paper>
  );

  return (
    <Box sx={{ width:'100%' }}>
      <DataDisplayTable data={data} title={title}/>
    </Box>
  );
}
