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
import DistrictSummary from '@/components/SRC_Summaries/DistrictSummary';

// Import aggregated view components
import DistrictSanitationView from '@/components/SRC_Grounds/Sanitation/DistrictSanitationView';
import DistrictSecurityView from '@/components/SRC_Grounds/Security/DistrictSecurityView';
import DistrictSchoolStructureView from '@/components/SRC_Grounds/SchoolStructure/DistrictSchoolStructureView';
import DistrictFurnitureView from '@/components/SRC_Grounds/Furniture/DistrictFurnitureView';
import DistrictWashView from '@/components/SRC_Grounds/WASH/DistrictWashView';
import DistrictTextbooksView from '@/components/SRC_Management/Textbooks/DistrictTextbooksView';
import DistrictCommunityInvolvementView from '@/components/SRC_CommunityInvolvement/CommunityInvolvement/DistrictCommunityInvolvementView';
import DistrictPupilPerformanceView from '@/components/SRC_Management/PupilPerformance/DistrictPupilPerformanceView';
import DistrictRecordBooksView from '@/components/SRC_Management/RecordBooks/DistrictRecordBooksView';
import DistrictSupportGrantsView from '@/components/SRC_Management/SupportGrants/DistrictSupportGrantsView';

// Main
import DistrictStudentEnrollmentView from '@/components/SRC_Main/StudentEnrollment/DistrictStudentEnrollmentView';
import DistrictStudentAttendanceView from '@/components/SRC_Main/StudentAttendance/DistrictStudentAttendanceView';
import DistrictFacilitatorsView from '@/components/SRC_Main/Facilitators/DistrictFacilitatorsView';

// Placeholder for other views - these will need to be created
const PlaceholderView = ({ viewName, filterParams }) => (
    <Paper sx={{p:2, mt:2}} elevation={1}>
        <Typography variant="h6">{viewName}</Typography>
        <Typography>Data for this section at the district level is not yet available.</Typography>
        <Typography variant="caption">Filters: District ID {filterParams.district_id}, Year {filterParams.year}, Term {filterParams.term}</Typography>
    </Paper>
);

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`district-report-tabpanel-${index}`}
            aria-labelledby={`district-report-tab-${index}`}
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
        id: `district-report-tab-${index}`,
        'aria-controls': `district-report-tabpanel-${index}`,
    };
}

export default function DistrictReportContainer({ filterParams }) {
    const [currentTab, setCurrentTab] = useState(0);
    const [subTab, setSubTab] = useState(0);

    const subTabCounts = [3, 4, 5, 3]; // Community Involvement, Management, Grounds, Main
    const effectiveSubTab = Math.min(subTab, subTabCounts[currentTab] - 1);

    useEffect(() => {
        setSubTab(0); 
    }, [currentTab]);

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    if (!filterParams || !filterParams.district_id || !filterParams.year || !filterParams.term) {
        return (
            <Paper elevation={2} sx={{ p: 2, mt: 3}}>
                <Typography variant="h6" color="error">District Information Missing</Typography>
                <Typography>Please select a district, year, and term to view the report.</Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{mt: 2}}>
            <DistrictSummary districtId={filterParams.district_id} year={filterParams.year} term={filterParams.term} />
            <Paper elevation={2} sx={{ mt: 1, overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={handleTabChange} aria-label="District Report Categories" variant="fullWidth">
                        <Tab label="Community Involvement" {...a11yProps(0)} />
                        <Tab label="School Management" {...a11yProps(1)} />
                        <Tab label="School Grounds" {...a11yProps(2)} />
                        <Tab label="Main" {...a11yProps(3)} />
                    </Tabs>
                </Box>

                {/* Community Involvement Tab Panel */}
                <TabPanel value={currentTab} index={0}>
                    <Typography variant="h6" gutterBottom>District Community Involvement</Typography>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={effectiveSubTab} onChange={(e, v) => setSubTab(v)} variant="fullWidth">
                            <Tab label="Summary" />
                            <Tab label="Meetings Held" />
                            <Tab label="General Issues" />
                        </Tabs>
                    </Box>
                    <TabPanel value={effectiveSubTab} index={0}>
                        <DistrictCommunityInvolvementView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <PlaceholderView viewName="District Meetings Held" filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <PlaceholderView viewName="District General Issues" filterParams={filterParams} />
                    </TabPanel>
                </TabPanel>

                {/* School Management Tab Panel */}
                <TabPanel value={currentTab} index={1}>
                    <Typography variant="h6" gutterBottom>District School Management</Typography>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={effectiveSubTab} onChange={(e, v) => setSubTab(v)} variant="fullWidth">
                            <Tab label="Textbooks" />
                            <Tab label="Pupil Performance" />
                            <Tab label="Record Books" />
                            <Tab label="Support & Grants" />
                        </Tabs>
                    </Box>
                    <TabPanel value={effectiveSubTab} index={0}>
                        <DistrictTextbooksView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <DistrictPupilPerformanceView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <DistrictRecordBooksView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={3}>
                        <DistrictSupportGrantsView filterParams={filterParams} />
                    </TabPanel>
                </TabPanel>

                {/* School Grounds Tab Panel */}
                <TabPanel value={currentTab} index={2}>
                    <Typography variant="h6" gutterBottom>District School Grounds</Typography>
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
                        <DistrictSanitationView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <DistrictSecurityView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <DistrictSchoolStructureView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={3}>
                        <DistrictFurnitureView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={4}>
                        <DistrictWashView filterParams={filterParams} />
                    </TabPanel>
                </TabPanel>
                
                {/* Main Tab Panel */}
                <TabPanel value={currentTab} index={3}>
                    <Typography variant="h6" gutterBottom>District Main Data</Typography>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={effectiveSubTab} onChange={(e, v) => setSubTab(v)} variant="fullWidth">
                            <Tab label="Student Enrollment" />
                            <Tab label="Student Attendance" />
                            <Tab label="Facilitators" />
                        </Tabs>
                    </Box>
                    <TabPanel value={effectiveSubTab} index={0}>
                        <DistrictStudentEnrollmentView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <DistrictStudentAttendanceView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <DistrictFacilitatorsView filterParams={filterParams} />
                    </TabPanel>
                </TabPanel>
            </Paper>
        </Box>
    );
}
