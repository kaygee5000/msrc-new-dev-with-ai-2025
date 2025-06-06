'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
} from '@mui/material';

// Import summary component
import CircuitSummary from '@/components/SRC_Summaries/CircuitSummary';

// Import aggregated view components (only Sanitation is ready for circuit level)
import CircuitSanitationView from '@/components/SRC_Grounds/Sanitation/CircuitSanitationView';
// Placeholder for other views - these will need to be created
const PlaceholderView = ({ viewName, filterParams }) => (
    <Paper sx={{p:2, mt:2}} elevation={1}>
        <Typography variant="h6">{viewName}</Typography>
        <Typography>Data for this section at the circuit level is not yet available.</Typography>
        <Typography variant="caption">Filters: Circuit ID {filterParams.circuit_id}, Year {filterParams.year}, Term {filterParams.term}</Typography>
    </Paper>
);

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`circuit-report-tabpanel-${index}`}
            aria-labelledby={`circuit-report-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `circuit-report-tab-${index}`,
        'aria-controls': `circuit-report-tabpanel-${index}`,
    };
}

export default function CircuitReportContainer({ filterParams }) {
    const [currentTab, setCurrentTab] = useState(0);
    const [subTab, setSubTab] = useState(0);

    // Define number of sub-tabs per main tab
    // Community Involvement: Summary, Meetings, General Issues
    // School Management: Textbooks, Pupil Performance, Record Books, Support & Grants
    // School Grounds: Sanitation, Security, School Structure, Furniture, WASH
    const subTabCounts = [3, 4, 5]; 
    const effectiveSubTab = Math.min(subTab, subTabCounts[currentTab] - 1);

    useEffect(() => {
        setSubTab(0); // Reset sub-tab when main tab changes
    }, [currentTab]);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    if (!filterParams || !filterParams.circuit_id || !filterParams.year || !filterParams.term) {
        return (
            <Paper elevation={2} sx={{ p: 2, mt: 3}}>
                <Typography variant="h6" color="error">Circuit Information Missing</Typography>
                <Typography>Please select a circuit, year, and term to view the report.</Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{mt: 2}}>
            <CircuitSummary circuitId={filterParams.circuit_id} year={filterParams.year} term={filterParams.term} />
            <Paper elevation={2} sx={{ mt: 1, overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={handleTabChange} aria-label="Circuit Report Categories" variant="fullWidth">
                        <Tab label="Community Involvement" {...a11yProps(0)} />
                        <Tab label="School Management" {...a11yProps(1)} />
                        <Tab label="School Grounds" {...a11yProps(2)} />
                    </Tabs>
                </Box>

                {/* Community Involvement Tab Panel */}
                <TabPanel value={currentTab} index={0}>
                    <Typography variant="h6" gutterBottom>Circuit Community Involvement</Typography>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={effectiveSubTab} onChange={(e, v) => setSubTab(v)} variant="fullWidth">
                            <Tab label="Summary" />
                            <Tab label="Meetings Held" />
                            <Tab label="General Issues" />
                        </Tabs>
                    </Box>
                    <TabPanel value={effectiveSubTab} index={0}>
                        <PlaceholderView viewName="Circuit Community Involvement Summary" filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <PlaceholderView viewName="Circuit Meetings Held" filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <PlaceholderView viewName="Circuit General Issues" filterParams={filterParams} />
                    </TabPanel>
                </TabPanel>

                {/* School Management Tab Panel */}
                <TabPanel value={currentTab} index={1}>
                    <Typography variant="h6" gutterBottom>Circuit School Management</Typography>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={effectiveSubTab} onChange={(e, v) => setSubTab(v)} variant="fullWidth">
                            <Tab label="Textbooks" />
                            <Tab label="Pupil Performance" />
                            <Tab label="Record Books" />
                            <Tab label="Support & Grants" />
                        </Tabs>
                    </Box>
                    <TabPanel value={effectiveSubTab} index={0}>
                        <PlaceholderView viewName="Circuit Textbooks Data" filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <PlaceholderView viewName="Circuit Pupil Performance" filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <PlaceholderView viewName="Circuit Record Books" filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={3}>
                        <PlaceholderView viewName="Circuit Support & Grants" filterParams={filterParams} />
                    </TabPanel>
                </TabPanel>

                {/* School Grounds Tab Panel */}
                <TabPanel value={currentTab} index={2}>
                    <Typography variant="h6" gutterBottom>Circuit School Grounds</Typography>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={effectiveSubTab} onChange={(e, v) => setSubTab(v)} variant="fullWidth">
                            <Tab label="Sanitation" />
                            <Tab label="Security" />
                            <Tab label="School Structure" />
                            <Tab label="Furniture" />
                            <Tab label="WASH" />
                        </Tabs>
                    </Box>
                    <TabPanel value={effectiveSubTab} index={0}>
                        <CircuitSanitationView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <PlaceholderView viewName="Circuit Security Data" filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <PlaceholderView viewName="Circuit School Structure Data" filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={3}>
                        <PlaceholderView viewName="Circuit Furniture Data" filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={4}>
                        <PlaceholderView viewName="Circuit WASH Data" filterParams={filterParams} />
                    </TabPanel>
                </TabPanel>
            </Paper>
        </Box>
    );
}
