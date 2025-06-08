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
import SchoolCommunityInvolvementView from '@/components/SRC_CommunityInvolvement/CommunityInvolvement/SchoolCommunityInvolvementView';
import MeetingsHeldDisplay from '@/components/SRC_CommunityInvolvement/MeetingsHeldDisplay';
import SchoolTextbooksView from '@/components/SRC_Management/Textbooks/SchoolTextbooksView';
import SchoolPupilPerformanceView from '@/components/SRC_Management/PupilPerformance/SchoolPupilPerformanceView';
import SchoolRecordBooksView from '@/components/SRC_Management/RecordBooks/SchoolRecordBooksView';
import SchoolSupportGrantsView from '@/components/SRC_Management/SupportGrants/SchoolSupportGrantsView';

// Grounds
import SchoolSanitationView from '@/components/SRC_Grounds/Sanitation/SchoolSanitationView';
import SchoolSecurityView from '@/components/SRC_Grounds/Security/SchoolSecurityView';
import SchoolStructureView from '@/components/SRC_Grounds/SchoolStructure/SchoolStructureView';
import SchoolFurnitureView from '@/components/SRC_Grounds/Furniture/SchoolFurnitureView';
import SchoolWashView from '@/components/SRC_Grounds/WASH/SchoolWashView';

// Main
import SchoolStudentEnrollmentView from '@/components/SRC_Main/StudentEnrollment/SchoolStudentEnrollmentView';
import SchoolStudentAttendanceView from '@/components/SRC_Main/StudentAttendance/SchoolStudentAttendanceView';
import SchoolFacilitatorsView from '@/components/SRC_Main/Facilitators/SchoolFacilitatorsView';

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
    const subTabCounts = [3, 4, 5, 3];
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
                        <Tab label="Main" {...a11yProps(3)} />
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
                    <SchoolCommunityInvolvementView filterParams={filterParams} />
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
                    <SchoolTextbooksView filterParams={filterParams} />
                </TabPanel>
                <TabPanel value={effectiveSubTab} index={1}>
                    <SchoolPupilPerformanceView filterParams={filterParams} />
                </TabPanel>
                <TabPanel value={effectiveSubTab} index={2}>
                    <SchoolRecordBooksView filterParams={filterParams} />
                </TabPanel>
                <TabPanel value={effectiveSubTab} index={3}>
                    <SchoolSupportGrantsView filterParams={filterParams} />
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
                    <SchoolSecurityView filterParams={filterParams} />
                </TabPanel>
                <TabPanel value={effectiveSubTab} index={2}>
                    <SchoolStructureView filterParams={filterParams} />
                </TabPanel>
                <TabPanel value={effectiveSubTab} index={3}>
                    <SchoolFurnitureView filterParams={filterParams} />
                </TabPanel>
                <TabPanel value={effectiveSubTab} index={4}>
                    <SchoolWashView filterParams={filterParams} />
                </TabPanel>
            </TabPanel>
            
            <TabPanel value={currentTab} index={3}>
                <Typography variant="h6" gutterBottom>School Main Data</Typography>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={effectiveSubTab} onChange={(e, v) => setSubTab(v)} variant="fullWidth">
                        <Tab label="Student Enrollment" />
                        <Tab label="Student Attendance" />
                        <Tab label="Facilitators" />
                    </Tabs>
                </Box>
                <TabPanel value={effectiveSubTab} index={0}>
                    <SchoolStudentEnrollmentView filterParams={filterParams} />
                </TabPanel>
                <TabPanel value={effectiveSubTab} index={1}>
                    <SchoolStudentAttendanceView filterParams={filterParams} />
                </TabPanel>
                <TabPanel value={effectiveSubTab} index={2}>
                    <SchoolFacilitatorsView filterParams={filterParams} />
                </TabPanel>
            </TabPanel>
            </Paper>
        </Box>
    );
}
