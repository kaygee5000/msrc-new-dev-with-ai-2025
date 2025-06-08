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
import RegionSummary from '@/components/SRC_Summaries/RegionSummary';

// Import aggregated view components
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

export default function RegionReportContainer({ filterParams }) {
    const [currentTab, setCurrentTab] = useState(0);
    const [subTab, setSubTab] = useState(0);

    const subTabCounts = [3, 4, 5];
    const effectiveSubTab = Math.min(subTab, subTabCounts[currentTab] - 1);

    useEffect(() => { setSubTab(0); }, [currentTab]);

    const handleTabChange = (event, newValue) => { setCurrentTab(newValue); };

    if (!filterParams || !filterParams.region_id || !filterParams.year || !filterParams.term) {
        return (
            <Paper elevation={2} sx={{ p: 2, mt: 3}}>
                <Typography variant="h6" color="error">Region Information Missing</Typography>
                <Typography>Please select a region, year, and term to view the report.</Typography>
            </Paper>
        );
    }

    return (
        <Box sx={{mt: 2}}>
            <RegionSummary regionId={filterParams.region_id} year={filterParams.year} term={filterParams.term} />
            <Paper elevation={2} sx={{ mt: 1, overflow: 'hidden' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={currentTab} onChange={handleTabChange} aria-label="Region Report Categories" variant="fullWidth">
                        <Tab label="Community Involvement" {...a11yProps(0)} />
                        <Tab label="School Management" {...a11yProps(1)} />
                        <Tab label="School Grounds" {...a11yProps(2)} />
                    </Tabs>
                </Box>

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
                        <RegionCommunityInvolvementView filterParams={filterParams} />
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
                        <RegionTextbooksView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <RegionPupilPerformanceView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <RegionRecordBooksView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={3}>
                        <RegionSupportGrantsView filterParams={filterParams} />
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
                        <RegionSanitationView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={1}>
                        <RegionSecurityView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={2}>
                        <RegionSchoolStructureView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={3}>
                        <RegionFurnitureView filterParams={filterParams} />
                    </TabPanel>
                    <TabPanel value={effectiveSubTab} index={4}>
                        <RegionWashView filterParams={filterParams} />
                    </TabPanel>
                </TabPanel>
            </Paper>
        </Box>
    );
}
