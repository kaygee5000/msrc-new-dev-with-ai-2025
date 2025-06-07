'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
} from '@mui/material';

import CircuitSummary from '@/components/SRC_Summaries/CircuitSummary';
import CommunityInvolvementDisplay from '@/components/SRC_CommunityInvolvement/CommunityInvolvementDisplay';
import MeetingsHeldDisplay from '@/components/SRC_CommunityInvolvement/MeetingsHeldDisplay';
import GeneralIssuesDisplay from '@/components/SRC_CommunityInvolvement/GeneralIssuesDisplay';
import TextbooksDisplay from '@/components/SRC_Management/TextbooksDisplay';
import PupilPerformanceDisplay from '@/components/SRC_Management/PupilPerformanceDisplay';
import RecordBooksDisplay from '@/components/SRC_Management/RecordBooksDisplay';
import SupportGrantsDisplay from '@/components/SRC_Management/SupportGrantsDisplay';
import CircuitSanitationView from '@/components/SRC_Grounds/Sanitation/CircuitSanitationView';
import SecurityDisplay from '@/components/SRC_Grounds/SecurityDisplay';
import SchoolStructureDisplay from '@/components/SRC_Grounds/SchoolStructureDisplay';
import FurnitureDisplay from '@/components/SRC_Grounds/FurnitureDisplay';
import WashDisplay from '@/components/SRC_Grounds/WashDisplay';

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
            <Paper elevation={2} sx={{ p: 2, mt: 3 }}>
                <Typography variant="h6" color="error">Circuit Information Missing</Typography>
                <Typography>Please select a circuit, year, and term to view the report.</Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{ mt: 2 }}>

            {/* Circuit Report Card Summary */}
            {filterParams.year && filterParams.term && (
                <CircuitSummary circuitId={filterParams.circuit_id} selectedPeriod={filterParams} />
            )}


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
                        <CommunityInvolvementDisplay filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <MeetingsHeldDisplay filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <GeneralIssuesDisplay filterParams={filterParams} />
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
                        <TextbooksDisplay filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <PupilPerformanceDisplay filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <RecordBooksDisplay filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={3}>
                        <SupportGrantsDisplay filterParams={filterParams} />
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
                        <SecurityDisplay filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <SchoolStructureDisplay filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={3}>
                        <FurnitureDisplay filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={4}>
                        <WashDisplay filterParams={filterParams} />
                    </TabPanel>
                </TabPanel>
            </Paper>
        </Box>
    );
}
