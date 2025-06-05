'use client';

import React, { useState } from 'react';
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

// Import individual display components
import GeneralIssuesDisplay from '@/components/SRC_CommunityInvolvement/GeneralIssuesDisplay';
import CommunityInvolvementDisplay from '@/components/SRC_CommunityInvolvement/CommunityInvolvementDisplay';
import MeetingsHeldDisplay from '@/components/SRC_CommunityInvolvement/MeetingsHeldDisplay';

// Placeholder for other category components - to be created later
// Management
// import TextbooksDisplay from '@/components/SRC_Management/TextbooksDisplay';
// import PupilPerformanceDisplay from '@/components/SRC_Management/PupilPerformanceDisplay';
// import RecordBooksDisplay from '@/components/SRC_Management/RecordBooksDisplay';
// import SupportGrantsDisplay from '@/components/SRC_Management/SupportGrantsDisplay';
// Grounds
// import SanitationDisplay from '@/components/SRC_Grounds/SanitationDisplay';
// import SecurityDisplay from '@/components/SRC_Grounds/SecurityDisplay';
// import SportsRecreationalFacilitiesDisplay from '@/components/SRC_Grounds/SportsRecreationalFacilitiesDisplay';
// import SchoolStructureDisplay from '@/components/SRC_Grounds/SchoolStructureDisplay';
// import FurnitureDisplay from '@/components/SRC_Grounds/FurnitureDisplay';
// import WashDisplay from '@/components/SRC_Grounds/WashDisplay';

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

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    return (
        <Paper elevation={2} sx={{ mt: 3, overflow: 'hidden' }}>
            {/* Filter controls have been removed and are now expected from the parent page */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={currentTab} onChange={handleTabChange} aria-label="School Report Categories" variant="scrollable" scrollButtons="auto">
                    <Tab label="Community Involvement" {...a11yProps(0)} />
                    <Tab label="School Management" {...a11yProps(1)} />
                    <Tab label="School Grounds" {...a11yProps(2)} />
                </Tabs>
            </Box>

            <TabPanel value={currentTab} index={0}>
                <Typography variant="h6" gutterBottom>Community Involvement Data</Typography>
                <CommunityInvolvementDisplay filterParams={filterParams} />
                <MeetingsHeldDisplay filterParams={filterParams} />
                <GeneralIssuesDisplay filterParams={filterParams} />
            </TabPanel>

            <TabPanel value={currentTab} index={1}>
                <Typography variant="h6" gutterBottom>School Management Data</Typography>
                {/* Placeholder: Render School Management components here when created */}
                <Typography variant="body2" color="text.secondary">School Management components will be displayed here.</Typography>
                {/* <TextbooksDisplay filterParams={filterParams} /> */}
                {/* <PupilPerformanceDisplay filterParams={filterParams} /> */}
                {/* <RecordBooksDisplay filterParams={filterParams} /> */}
                {/* <SupportGrantsDisplay filterParams={filterParams} /> */}
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
                <Typography variant="h6" gutterBottom>School Grounds Data</Typography>
                {/* Placeholder: Render School Grounds components here when created */}
                <Typography variant="body2" color="text.secondary">School Grounds components will be displayed here.</Typography>
                {/* <SanitationDisplay filterParams={filterParams} /> */}
                {/* <SecurityDisplay filterParams={filterParams} /> */}
                {/* <SportsRecreationalFacilitiesDisplay filterParams={filterParams} /> */}
                {/* <SchoolStructureDisplay filterParams={filterParams} /> */}
                {/* <FurnitureDisplay filterParams={filterParams} /> */}
                {/* <WashDisplay filterParams={filterParams} /> */}
            </TabPanel>
        </Paper>
    );
}
