'use client';

import React, { useState, useEffect } from 'react';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
} from '@mui/material';

// Import summary component
import RegionSummary from '@/components/SRC_Summaries/RegionSummary';

// Import aggregated view components
import RegionStudentEnrollmentView from '@/components/SRC_Main/StudentEnrollment/RegionStudentEnrollmentView';
import RegionStudentAttendanceView from '@/components/SRC_Main/StudentAttendance/RegionStudentAttendanceView';
import RegionFacilitatorsView from '@/components/SRC_Main/Facilitators/RegionFacilitatorsView';
import RegionSanitationView from '@/components/SRC_Grounds/Sanitation/RegionSanitationView';
import RegionSecurityView from '@/components/SRC_Grounds/Security/RegionSecurityView';
import RegionSchoolStructureView from '@/components/SRC_Grounds/SchoolStructure/RegionSchoolStructureView';
import RegionFurnitureView from '@/components/SRC_Grounds/Furniture/RegionFurnitureView';
import RegionWashView from '@/components/SRC_Grounds/WASH/RegionWashView';
import RegionTextbooksView from '@/components/SRC_Management/Textbooks/RegionTextbooksView';
import RegionCommunityInvolvementView from '@/components/SRC_CommunityInvolvement/CommunityInvolvement/RegionCommunityInvolvementView';
import RegionPupilPerformanceView from '@/components/SRC_Management/PupilPerformance/RegionPupilPerformanceView';
import RegionRecordBooksView from '@/components/SRC_Management/RecordBooks/RegionRecordBooksView';
import RegionSupportGrantsView from '@/components/SRC_Management/SupportGrants/RegionSupportGrantsView';

// Placeholder for other views - these will need to be created
const PlaceholderView = ({ viewName, filterParams }) => (
    <Paper sx={{p:2, mt:2}} elevation={1}>
        <Typography variant="h6">{viewName}</Typography>
        <Typography>Data for this section at the region level is not yet available.</Typography>
        <Typography variant="caption">Filters: Region ID {filterParams.region_id}, Year {filterParams.year}, Term {filterParams.term}</Typography>
    </Paper>
);

function TabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`region-report-tabpanel-${index}`}
            aria-labelledby={`region-report-tab-${index}`}
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
        id: `region-report-tab-${index}`,
        'aria-controls': `region-report-tabpanel-${index}`,
    };
}

export default function RegionReportContainer({ filterParams, loadOnDemand = false }) {
    const [currentTab, setCurrentTab] = useState(0);
    const [subTab, setSubTab] = useState(0);
    const [containerLoaded, setContainerLoaded] = useState(!loadOnDemand);
    const [containerLoading, setContainerLoading] = useState(false);
    const [containerError, setContainerError] = useState(null);

    const subTabCounts = [3, 3, 4, 5]; // Adjusted for 4 main tabs, sub-tabs per main tab
    const effectiveSubTab = Math.min(subTab, (subTabCounts[currentTab] || 1) - 1);

    useEffect(() => { setSubTab(0); }, [currentTab]);
    useEffect(() => {
        if (containerLoading) NProgress.start();
        else NProgress.done();
        return () => NProgress.done();
    }, [containerLoading]);

    const handleTabChange = (event, newValue) => { setCurrentTab(newValue); };

    const handleContainerLoad = async () => {
        setContainerLoading(true);
        setContainerError(null);
        try {
            // Simulate async data fetch for container-level data (can be replaced with real API call if needed)
            await new Promise(resolve => setTimeout(resolve, 800));
            setContainerLoaded(true);
        } catch (err) {
            setContainerError('Failed to load region report data.');
        } finally {
            setContainerLoading(false);
        }
    };

    if (!filterParams || !filterParams.region_id || !filterParams.year || !filterParams.term) {
        return (
            <Paper elevation={2} sx={{ p: 2, mt: 3}}>
                <Typography variant="h6" color="error">Region Information Missing</Typography>
                <Typography>Please select a region, year, and term to view the report.</Typography>
            </Paper>
        );
    }

    // On-Demand Loading UI at container level
    if (loadOnDemand && !containerLoaded) {
        return (
            <Box sx={{ textAlign: 'center', py: 5 }}>
                {containerLoading ? (
                    <Skeleton variant="rectangular" width={320} height={56} sx={{ mx: 'auto', mb: 2 }} />
                ) : containerError ? (
                    <>
                        <Alert severity="error" sx={{ mb: 2 }}>{containerError}</Alert>
                        <Button variant="contained" color="primary" onClick={handleContainerLoad} disabled={containerLoading}>
                            Retry Loading Region Report
                        </Button>
                    </>
                ) : (
                    <Button variant="contained" color="primary" onClick={handleContainerLoad}>
                        Load Region Report
                    </Button>
                )}
            </Box>
        );
    }

    // Main container loading skeleton
    if (containerLoading) {
        return (
            <Box sx={{ mt: 2 }}>
                <Skeleton variant="rectangular" height={48} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={64} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={240} />
            </Box>
        );
    }

    // Error state
    if (containerError) {
        return (
            <Box sx={{ mt: 2 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{containerError}</Alert>
                <Button variant="contained" color="primary" onClick={handleContainerLoad}>
                    Retry Loading Region Report
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{mt: 2}}>
            <RegionSummary regionId={filterParams.region_id} year={filterParams.year} term={filterParams.term} />
            <Paper elevation={2} sx={{ mt: 1, overflow: 'hidden' }}>
                {/* <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={handleTabChange} aria-label="Region Report Categories" variant="fullWidth">
                        <Tab label="Main" {...a11yProps(0)} />
                        <Tab label="Community Involvement" {...a11yProps(1)} />
                        <Tab label="School Management" {...a11yProps(2)} />
                        <Tab label="School Grounds" {...a11yProps(3)} />
                    </Tabs>
                </Box> */}

                {/* Main Tab Panel */}
                <TabPanel value={currentTab} index={0}>
                    <Typography variant="h6" gutterBottom>Region Main Data</Typography>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={effectiveSubTab} onChange={(e, v) => setSubTab(v)} variant="fullWidth">
                            <Tab label="Student Enrollment" />
                            <Tab label="Student Attendance" />
                            <Tab label="Facilitators" />
                        </Tabs>
                    </Box>
                    <TabPanel value={effectiveSubTab} index={0}>
                        <RegionStudentEnrollmentView filterParams={filterParams} loadOnDemand={true} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <RegionStudentAttendanceView filterParams={filterParams} loadOnDemand={true} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <RegionFacilitatorsView filterParams={filterParams} loadOnDemand={true} />
                    </TabPanel>
                </TabPanel>

                {/* Community Involvement Tab Panel */}
                <TabPanel value={currentTab} index={0}>
                    <Typography variant="h6" gutterBottom>Region Community Involvement</Typography>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={effectiveSubTab} onChange={(e, v) => setSubTab(v)} variant="fullWidth">
                            <Tab label="Summary" />
                            <Tab label="Meetings Held" />
                            <Tab label="General Issues" />
                        </Tabs>
                    </Box>
                    <TabPanel value={effectiveSubTab} index={0}>
                        <RegionCommunityInvolvementView filterParams={filterParams} loadOnDemand={true} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <PlaceholderView viewName="Region Meetings Held" filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <PlaceholderView viewName="Region General Issues" filterParams={filterParams} />
                    </TabPanel>
                </TabPanel>

                {/* School Management Tab Panel */}
                <TabPanel value={currentTab} index={1}>
                    <Typography variant="h6" gutterBottom>Region School Management</Typography>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={effectiveSubTab} onChange={(e, v) => setSubTab(v)} variant="fullWidth">
                            <Tab label="Textbooks" />
                            <Tab label="Pupil Performance" />
                            <Tab label="Record Books" />
                            <Tab label="Support & Grants" />
                        </Tabs>
                    </Box>
                    <TabPanel value={effectiveSubTab} index={0}>
                        <RegionTextbooksView filterParams={filterParams} loadOnDemand={true} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <RegionPupilPerformanceView filterParams={filterParams} loadOnDemand={true} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <RegionRecordBooksView filterParams={filterParams} loadOnDemand={true} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={3}>
                        <RegionSupportGrantsView filterParams={filterParams} loadOnDemand={true} />
                    </TabPanel>
                </TabPanel>

                {/* School Grounds Tab Panel */}
                <TabPanel value={currentTab} index={2}>
                    <Typography variant="h6" gutterBottom>Region School Grounds</Typography>
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
                        <RegionSanitationView filterParams={filterParams} loadOnDemand={true} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <RegionSecurityView filterParams={filterParams} loadOnDemand={true} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <RegionSchoolStructureView filterParams={filterParams} loadOnDemand={true} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={3}>
                        <RegionFurnitureView filterParams={filterParams} loadOnDemand={true} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={4}>
                        <RegionWashView filterParams={filterParams} loadOnDemand={true} />
                    </TabPanel>
                </TabPanel>
            </Paper>
        </Box>
    );
}
