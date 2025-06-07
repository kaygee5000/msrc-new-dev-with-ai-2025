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

// Re-using the DataDisplayTable component structure
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

export default function MeetingsHeldDisplay({ filterParams }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const title = 'Meetings Held';

    const fetchData = useCallback(async () => {
        if (!filterParams || (!filterParams.school_id && !filterParams.circuit_id && !filterParams.district_id && !filterParams.region_id)) {
            setData(null);
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

        try {
            const res = await fetch(`/api/school-report/community-involvement/meetings-held?${query.toString()}`);
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ message: `HTTP error ${res.status}` }));
                throw new Error(errorData.message || `Failed to fetch data (${res.status})`);
            }
            const resultData = await res.json();
            setData(resultData);
        } catch (e) {
            console.error(`Error fetching ${title}:`, e);
            setError(e.message);
            setData(null);
        }
        setLoading(false);
    }, [filterParams]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <Box display="flex" alignItems="center" p={2}>
                <CircularProgress size={24} sx={{ mr: 1 }}/>
                <Typography variant="body2">Loading {title}...</Typography>
            </Box>
        );
    }

    if (error) {
        return <Alert severity="warning" sx={{ mt: 1, mb: 2 }}>Error loading {title}: {error}</Alert>;
    }

    return (
        <Box sx={{ width: '100%' }}>
            <DataDisplayTable data={data} title={title} />
        </Box>
    );
}
