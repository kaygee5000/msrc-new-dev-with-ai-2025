'use client';

import React, { useState, useEffect, useCallback } from 'react';
import NProgress from 'nprogress';
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
    Paper,
    Button, // For Load Data and Try Again
    Skeleton // For loading state
    // Stack might be needed for layout if not already used implicitly
} from '@mui/material';

const DataDisplayTable = ({ data, title }) => {
    if (!data || data.length === 0) {
        return <Typography variant="body2" sx={{ mt: 1, mb: 2 }}>No data available for {title}.</Typography>;
    }

    const headers = Object.keys(data[0]).filter(key => 
        typeof data[0][key] !== 'object' || 
        key.endsWith('_data_object') || 
        (Array.isArray(data[0][key]) && data[0][key].every(item => typeof item !== 'object'))
    );

    return (
        <TableContainer component={Paper} sx={{ mb: 3 }} variant="outlined">
            <Table size="small">
                <TableHead sx={{ backgroundColor: 'grey.100' }}>
                    <TableRow>
                        {headers.map((header) => (
                            <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                                {header.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {data.map((row, rowIndex) => (
                        <TableRow key={rowIndex} hover>
                            {headers.map((header) => (
                                <TableCell key={`${rowIndex}-${header}`}>
                                    {header.endsWith('_data_object') && Array.isArray(row[header]) ? (
                                        <Box sx={{ maxHeight: '100px', overflowY: 'auto' }}>
                                            {row[header].map((item, itemIndex) => (
                                                <Typography variant="caption" display="block" key={itemIndex} sx={{ whiteSpace: 'nowrap' }}>
                                                    {Object.entries(item).map(([k,v]) => `${k.replace(/_/g, ' ')}: ${v}`).join('; ')}
                                                </Typography>
                                            ))}
                                        </Box>
                                    ) : Array.isArray(row[header]) ? (
                                        row[header].join(', ')
                                    ) : typeof row[header] === 'boolean' ? (
                                        row[header] ? 'Yes' : 'No'
                                    ) : (
                                        row[header]
                                    )}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default function GeneralIssuesDisplay({ filterParams, loadOnDemand = false }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(!loadOnDemand);
    const title = 'General Issues';

    const fetchData = useCallback(async () => {
        NProgress.start();
        setLoading(true);
        setDataLoaded(false); // Indicate attempt to load fresh data
        setError(null);
        if (!filterParams || (!filterParams.school_id && !filterParams.circuit_id && !filterParams.district_id && !filterParams.region_id)) {
            setData(null);
            setLoading(false);
            NProgress.done();
            if (!loadOnDemand) setDataLoaded(true); // Data is 'loaded' as empty if not on-demand
            return;
        }
        setLoading(true);
        setError(null);

        const query = new URLSearchParams();
        if (filterParams.school_id) query.append('school_id', filterParams.school_id);
        else if (filterParams.circuit_id) query.append('circuit_id', filterParams.circuit_id);
        else if (filterParams.district_id) query.append('district_id', filterParams.district_id);
        else if (filterParams.region_id) query.append('region_id', filterParams.region_id);
        if (filterParams.year) query.append('year', filterParams.year);
        if (filterParams.term) query.append('term', filterParams.term);
        if (filterParams.week) query.append('week', filterParams.week);

        try {
            const res = await fetch(`/api/school-report/community-involvement/general-issues?${query.toString()}`);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: `HTTP error ${res.status}` }));
                throw new Error(errorData.message || `Failed to fetch data (${res.status})`);
            }
            const resultData = await res.json();
            setData(resultData);
            setDataLoaded(true); // Data successfully loaded
        } catch (e) {
            console.error(`Error fetching ${title} data:`, e);
            setError(e.message);
            setData(null);
            // dataLoaded remains false if an error occurs
        } finally {
            setLoading(false);
            NProgress.done();
        }
    }, [filterParams, title]); // Added title to deps, though it's constant here.

    useEffect(() => {
        if (loadOnDemand) {
            // If on-demand, clear data and show button until explicitly loaded or filters change
            setData(null);
            setDataLoaded(false);
            setError(null); // Clear previous errors
        } else {
            // If not on-demand, fetch data immediately
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterParams, loadOnDemand]); // fetchData is not in deps to control calls explicitly

    // --- Conditional Rendering --- 

    if (loading) {
        return (
            <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    <Skeleton width="40%" />
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: 'grey.100' }}>
                            <TableRow>
                                {[1, 2, 3, 4].map(i => (
                                    <TableCell key={i}><Skeleton width="80%" /></TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {[1, 2, 3].map(i => (
                                <TableRow key={i}>
                                    {[1, 2, 3, 4].map(j => (
                                        <TableCell key={j}><Skeleton /></TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
        );
    }

    if (error) {
        return (
            <Alert severity="error" sx={{ m: 2, p: 2 }}> {/* Changed severity to error for consistency */}
                <Typography gutterBottom>Error loading {title} data: {error}</Typography>
                <Button variant="contained" onClick={fetchData} size="small" disabled={loading}>
                    {loading ? 'Retrying...' : 'Try Again'}
                </Button>
            </Alert>
        );
    }

    if (loadOnDemand && !dataLoaded) {
        return (
            <Box sx={{ p: 3, textAlign: 'center', mt: 4 }}>
                <Typography variant="h6" gutterBottom>Load {title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{mb:2}}>
                    Click the button to fetch the latest general issues information.
                </Typography>
                <Button variant="contained" onClick={fetchData} size="large" disabled={loading}>
                    {loading ? `Loading ${title}...` : `Load ${title}`}
                </Button>
            </Box>
        );
    }

    // Check for no data after attempting to load (or if not onDemand and initial load is empty)
    // This is different from the !data check inside DataDisplayTable, which handles the case within the table itself.
    // This top-level check allows showing a refresh button if needed.
    if (dataLoaded && (!data || data.length === 0)) {
        return (
            <Alert severity="info" sx={{ m: 2, p: 2 }}>
                No {title.toLowerCase()} data found for the selected filters.
                {loadOnDemand && 
                    <Button onClick={fetchData} sx={{ ml: 2 }} size="small" variant="outlined" disabled={loading}>
                        {loading ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                }
            </Alert>
        );
    }
    // --- End Conditional Rendering ---

    return (
        <Box sx={{ width: '100%' }}>
            {/* Title will be handled by the Tab or Accordion in the container */}
            <DataDisplayTable data={data} title={title} />
        </Box>
    );
}
