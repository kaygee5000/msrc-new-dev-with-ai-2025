'use client';

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem
    // Grid will be removed as filters are external now
} from '@mui/material';

// Import summary component
// Path will need adjustment after moving: ../EntitySummaries/SchoolSummary
import SchoolSummary from '@/components/SRC_Summaries/SchoolSummary'; 

// Import individual display components
// Paths will need adjustment after moving: ../SRC_CommunityInvolvement/ etc.
import GeneralIssuesDisplay from '@/components/SRC_CommunityInvolvement/GeneralIssuesDisplay';
import CommunityInvolvementDisplay from '@/components/SRC_CommunityInvolvement/CommunityInvolvementDisplay';
import MeetingsHeldDisplay from '@/components/SRC_CommunityInvolvement/MeetingsHeldDisplay';

// Management
import TextbooksDisplay from '@/components/SRC_Management/TextbooksDisplay';
import PupilPerformanceDisplay from '@/components/SRC_Management/PupilPerformanceDisplay';
import RecordBooksDisplay from '@/components/SRC_Management/RecordBooksDisplay';
import SupportGrantsDisplay from '@/components/SRC_Management/SupportGrantsDisplay';

// Grounds
import SchoolSanitationView from '@/components/SRC_Grounds/Sanitation/SchoolSanitationView';
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
            id={`school-report-tabpanel-${index}`}
            aria-labelledby={`school-report-tab-${index}`}
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
        id: `school-report-tab-${index}`,
        'aria-controls': `school-report-tabpanel-${index}`,
    };
}

export default function SchoolReportContainer({ filterParams }) { // Expect filterParams directly
    const [currentTab, setCurrentTab] = useState(0);
    const [subTab, setSubTab] = useState(0);
    // Define number of sub-tabs per main tab
    const subTabCounts = [3, 4, 5];
    // Clamp subTab to valid range
    const effectiveSubTab = Math.min(subTab, subTabCounts[currentTab] - 1);

    useEffect(() => {
        setSubTab(0);
    }, [currentTab]);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Box sx={{ mt: 2 }}>
            <SchoolSummary entityId={filterParams.schoolId} selectedPeriod={filterParams} />
            <Paper elevation={2} sx={{ mt: 1, overflow: 'hidden' }}>
                {/* Filter controls have been removed and are now expected from the parent page */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={handleTabChange} aria-label="School Report Categories" variant="fullWidth">
                        <Tab label="Community Involvement" {...a11yProps(0)} />
                        <Tab label="School Management" {...a11yProps(1)} />
                        <Tab label="School Grounds" {...a11yProps(2)} />
                    </Tabs>
                </Box>

            <TabPanel value={currentTab} index={0}>
                <Typography variant="h6" gutterBottom>Community Involvement Data</Typography>
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

            <TabPanel value={currentTab} index={1}>
                <Typography variant="h6" gutterBottom>School Management Data</Typography>
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
                    {filterParams && filterParams.school_id && filterParams.year && filterParams.term ? (
                        <PupilPerformanceDisplay filterParams={filterParams} />
                    ) : (
                        <Typography variant="h6" gutterBottom>No data available</Typography>
                    )}
                </TabPanel>
                <TabPanel value={effectiveSubTab} index={2}>
                    <RecordBooksDisplay filterParams={filterParams} />
                </TabPanel>
                <TabPanel value={effectiveSubTab} index={3}>
                    <SupportGrantsDisplay filterParams={filterParams} />
                </TabPanel>
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
                <Typography variant="h6" gutterBottom>School Grounds Data</Typography>
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
                    <SchoolSanitationView filterParams={filterParams} />
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
