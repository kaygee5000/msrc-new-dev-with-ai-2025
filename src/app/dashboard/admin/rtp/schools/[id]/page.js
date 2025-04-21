'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Spinner,
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
  Chip,
  List,
  ListItem,
  ListItemPrefix,
  ListItemSuffix,
  Alert,
  CardHeader,
  CardBody,
  CardFooter,
  Avatar
} from "@material-tailwind/react";
import { 
  ArrowLeftIcon, 
  ChartBarIcon, 
  DocumentTextIcon, 
  CalendarIcon,
  UserIcon,
  CheckCircleIcon,
  ClockIcon
} from "@heroicons/react/24/outline";
import Link from 'next/link';

export default function SchoolDetailPage({ params }) {
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [schoolDetail, setSchoolDetail] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  
  useEffect(() => {
    const fetchSchoolDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/rtp/schools/${id}/history`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setSchoolDetail(data);
          
          // If there are submissions, select the first itinerary by default
          if (data.submissions && data.submissions.by_itinerary && data.submissions.by_itinerary.length > 0) {
            setSelectedItinerary(data.submissions.by_itinerary[0]);
          }
        } else {
          console.error("Error fetching school detail:", data.message);
        }
      } catch (error) {
        console.error("Error fetching school detail:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchoolDetail();
  }, [id]);
  
  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
  };
  
  // Handle itinerary selection
  const handleItinerarySelect = (itinerary) => {
    setSelectedItinerary(itinerary);
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }
  
  if (!schoolDetail) {
    return (
      <div className="p-4">
        <Alert color="red">Failed to load school information</Alert>
        <div className="mt-4">
          <Link href="/dashboard/admin/rtp/schools">
            <Button className="flex items-center gap-2" color="blue" size="sm">
              <ArrowLeftIcon className="h-4 w-4" /> Back to Schools
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const { school, submissions } = schoolDetail;
  
  return (
    <div className="p-4">
      <div className="mb-6">
        <Link href="/dashboard/admin/rtp/schools">
          <Button className="flex items-center gap-2" variant="text" color="blue" size="sm">
            <ArrowLeftIcon className="h-4 w-4" /> Back to Schools
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* School Info Card */}
        <Card className="flex-1 p-4">
          <div className="mb-4">
            <Typography variant="h4" color="blue-gray">
              {school.name}
            </Typography>
            <div className="flex items-center mt-1">
              <Chip
                variant="ghost"
                size="sm"
                value={school.is_galop ? "GALOP School" : "Non-GALOP School"}
                color={school.is_galop ? "green" : "gray"}
                className="mr-2"
              />
              {school.emis_code && (
                <Typography variant="small" color="blue-gray">
                  EMIS: {school.emis_code}
                </Typography>
              )}
            </div>
          </div>
          
          <List className="p-0">
            <ListItem className="py-1.5">
              <ListItemPrefix>
                <ChartBarIcon className="h-5 w-5" />
              </ListItemPrefix>
              <div className="flex flex-col">
                <Typography variant="small" color="blue-gray">District:</Typography>
                <Typography variant="small" color="gray">{school.district_name}</Typography>
              </div>
            </ListItem>
            <ListItem className="py-1.5">
              <ListItemPrefix>
                <ChartBarIcon className="h-5 w-5" />
              </ListItemPrefix>
              <div className="flex flex-col">
                <Typography variant="small" color="blue-gray">Region:</Typography>
                <Typography variant="small" color="gray">{school.region_name}</Typography>
              </div>
            </ListItem>
          </List>
        </Card>
        
        {/* Submissions Summary Card */}
        <Card className="flex-1 p-4">
          <Typography variant="h5" color="blue-gray" className="mb-4">
            Submission Summary
          </Typography>
          
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded">
              <Typography variant="h4" color="blue" className="text-center">
                {submissions.school_output_count}
              </Typography>
              <Typography variant="small" color="blue-gray" className="text-center">
                School Output
              </Typography>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <Typography variant="h4" color="green" className="text-center">
                {submissions.checklist_count}
              </Typography>
              <Typography variant="small" color="blue-gray" className="text-center">
                Checklists
              </Typography>
            </div>
            <div className="bg-purple-50 p-3 rounded">
              <Typography variant="h4" color="purple" className="text-center">
                {submissions.partners_count}
              </Typography>
              <Typography variant="small" color="blue-gray" className="text-center">
                Partners in Play
              </Typography>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <Typography variant="h4" color="blue-gray" className="text-center">
              {submissions.total_count}
            </Typography>
            <Typography variant="small" color="blue-gray" className="text-center">
              Total Submissions
            </Typography>
          </div>
        </Card>
      </div>
      
      {/* Tabs for different views */}
      <Tabs value={activeTab} className="mb-6">
        <TabsHeader>
          <Tab value="overview" onClick={() => handleTabChange("overview")}>
            Overview
          </Tab>
          <Tab value="submissions" onClick={() => handleTabChange("submissions")}>
            Submissions History
          </Tab>
        </TabsHeader>
        
        <TabsBody animate={{ initial: { y: 250 }, mount: { y: 0 }, unmount: { y: 250 } }}>
          <TabPanel value="overview">
            {/* Itineraries Overview */}
            <div className="mb-6">
              <Typography variant="h5" color="blue-gray" className="mb-4">
                Itineraries Overview
              </Typography>
              
              {submissions.by_itinerary.length === 0 ? (
                <Alert color="blue">
                  This school has not participated in any RTP itineraries yet.
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {submissions.by_itinerary.map((itinerary) => {
                    const totalSubmissions = 
                      itinerary.school_output.length + 
                      itinerary.consolidated_checklist.length + 
                      itinerary.partners_in_play.length;
                    
                    return (
                      <Card key={itinerary.itinerary_id} className="hover:shadow-lg transition-shadow">
                        <CardHeader
                          color="blue"
                          variant="gradient"
                          className="p-4 m-0 mb-4"
                        >
                          <Typography variant="h6" color="white">
                            {itinerary.itinerary_title}
                          </Typography>
                        </CardHeader>
                        <CardBody className="p-4 pt-0">
                          <div className="flex justify-between mb-2">
                            <Typography variant="small" color="blue-gray">
                              School Output:
                            </Typography>
                            <Typography variant="small" color="gray">
                              {itinerary.school_output.length} submissions
                            </Typography>
                          </div>
                          <div className="flex justify-between mb-2">
                            <Typography variant="small" color="blue-gray">
                              Checklists:
                            </Typography>
                            <Typography variant="small" color="gray">
                              {itinerary.consolidated_checklist.length} submissions
                            </Typography>
                          </div>
                          <div className="flex justify-between mb-2">
                            <Typography variant="small" color="blue-gray">
                              Partners in Play:
                            </Typography>
                            <Typography variant="small" color="gray">
                              {itinerary.partners_in_play.length} submissions
                            </Typography>
                          </div>
                        </CardBody>
                        <CardFooter className="p-4 pt-0">
                          <Button 
                            fullWidth
                            size="sm"
                            onClick={() => {
                              setSelectedItinerary(itinerary);
                              setActiveTab("submissions");
                            }}
                          >
                            View {totalSubmissions} Submissions
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabPanel>
          
          <TabPanel value="submissions">
            {/* Itinerary Selector */}
            {submissions.by_itinerary.length > 0 && (
              <div className="mb-6">
                <Typography variant="h6" color="blue-gray" className="mb-2">
                  Select Itinerary
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {submissions.by_itinerary.map((itinerary) => (
                    <Chip
                      key={itinerary.itinerary_id}
                      value={itinerary.itinerary_title}
                      variant={selectedItinerary && itinerary.itinerary_id === selectedItinerary.itinerary_id ? "filled" : "outlined"}
                      color="blue"
                      className="cursor-pointer"
                      onClick={() => handleItinerarySelect(itinerary)}
                    />
                  ))}
                </div>
              </div>
            )}
            
            {/* Selected Itinerary Submissions */}
            {selectedItinerary ? (
              <div>
                <Typography variant="h5" color="blue-gray" className="mb-4">
                  {selectedItinerary.itinerary_title} - Submissions
                </Typography>
                
                {/* School Output Submissions */}
                {selectedItinerary.school_output.length > 0 && (
                  <div className="mb-6">
                    <Typography variant="h6" color="blue" className="mb-2">
                      School Output Submissions ({selectedItinerary.school_output.length})
                    </Typography>
                    <Card>
                      <List>
                        {selectedItinerary.school_output.map((submission, index) => (
                          <ListItem key={index} className="hover:bg-blue-gray-50/50">
                            <ListItemPrefix>
                              <Avatar
                                variant="circular"
                                size="sm"
                                alt="form"
                                className="p-1"
                                src="/form.svg"
                              />
                            </ListItemPrefix>
                            <div className="flex flex-col">
                              <Typography variant="small" color="blue-gray">
                                Submitted by: {submission.submitted_by_name}
                              </Typography>
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-3 w-3 text-gray-500" />
                                <Typography variant="small" color="gray">
                                  {formatDate(submission.submitted_at)}
                                </Typography>
                              </div>
                            </div>
                            <ListItemSuffix>
                              <Link href={`/dashboard/admin/rtp/responses/${submission.id}?type=school-output`}>
                                <Button size="sm" variant="text">View Details</Button>
                              </Link>
                            </ListItemSuffix>
                          </ListItem>
                        ))}
                      </List>
                    </Card>
                  </div>
                )}
                
                {/* Consolidated Checklist Submissions */}
                {selectedItinerary.consolidated_checklist.length > 0 && (
                  <div className="mb-6">
                    <Typography variant="h6" color="green" className="mb-2">
                      Consolidated Checklist Submissions ({selectedItinerary.consolidated_checklist.length})
                    </Typography>
                    <Card>
                      <List>
                        {selectedItinerary.consolidated_checklist.map((submission, index) => (
                          <ListItem key={index} className="hover:bg-blue-gray-50/50">
                            <ListItemPrefix>
                              <Avatar
                                variant="circular"
                                size="sm"
                                alt="checklist"
                                className="p-1"
                                src="/file.svg"
                              />
                            </ListItemPrefix>
                            <div className="flex flex-col">
                              <Typography variant="small" color="blue-gray">
                                Submitted by: {submission.submitted_by_name}
                              </Typography>
                              {submission.teacher_name && (
                                <Typography variant="small" color="blue-gray">
                                  Teacher: {submission.teacher_name}
                                </Typography>
                              )}
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-3 w-3 text-gray-500" />
                                <Typography variant="small" color="gray">
                                  {formatDate(submission.submitted_at)}
                                </Typography>
                              </div>
                            </div>
                            <ListItemSuffix>
                              <Link href={`/dashboard/admin/rtp/responses/${submission.id}?type=consolidated-checklist`}>
                                <Button size="sm" variant="text">View Details</Button>
                              </Link>
                            </ListItemSuffix>
                          </ListItem>
                        ))}
                      </List>
                    </Card>
                  </div>
                )}
                
                {/* Partners in Play Submissions */}
                {selectedItinerary.partners_in_play.length > 0 && (
                  <div className="mb-6">
                    <Typography variant="h6" color="purple" className="mb-2">
                      Partners in Play Submissions ({selectedItinerary.partners_in_play.length})
                    </Typography>
                    <Card>
                      <List>
                        {selectedItinerary.partners_in_play.map((submission, index) => (
                          <ListItem key={index} className="hover:bg-blue-gray-50/50">
                            <ListItemPrefix>
                              <Avatar
                                variant="circular"
                                size="sm"
                                alt="partners in play"
                                className="p-1"
                                src="/globe.svg"
                              />
                            </ListItemPrefix>
                            <div className="flex flex-col">
                              <Typography variant="small" color="blue-gray">
                                Submitted by: {submission.submitted_by_name}
                              </Typography>
                              <Typography variant="small" color="blue-gray">
                                Teacher: {submission.teacher_name}
                              </Typography>
                              {submission.subject && (
                                <Typography variant="small" color="blue-gray">
                                  Subject: {submission.subject}
                                </Typography>
                              )}
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-3 w-3 text-gray-500" />
                                <Typography variant="small" color="gray">
                                  {formatDate(submission.submitted_at)}
                                </Typography>
                              </div>
                            </div>
                            <ListItemSuffix className="flex flex-col items-end gap-2">
                              {(submission.learning_environment_score || submission.ltp_skills_score) && (
                                <div className="flex items-center gap-2">
                                  <Typography variant="small" color="gray">
                                    Score:
                                  </Typography>
                                  <Chip
                                    value={`${(submission.learning_environment_score || 0).toFixed(1)}`}
                                    variant="ghost"
                                    size="sm"
                                    color="blue"
                                    className="text-xs"
                                  />
                                </div>
                              )}
                              <Link href={`/dashboard/admin/rtp/responses/${submission.id}?type=partners-in-play`}>
                                <Button size="sm" variant="text">View Details</Button>
                              </Link>
                            </ListItemSuffix>
                          </ListItem>
                        ))}
                      </List>
                    </Card>
                  </div>
                )}
                
                {/* No submissions message */}
                {selectedItinerary.school_output.length === 0 && 
                 selectedItinerary.consolidated_checklist.length === 0 && 
                 selectedItinerary.partners_in_play.length === 0 && (
                  <Alert color="blue">
                    No submissions found for this itinerary.
                  </Alert>
                )}
              </div>
            ) : submissions.by_itinerary.length === 0 ? (
              <Alert color="blue">
                This school has not participated in any RTP itineraries yet.
              </Alert>
            ) : (
              <Alert color="blue">
                Select an itinerary to view submissions.
              </Alert>
            )}
          </TabPanel>
        </TabsBody>
      </Tabs>
    </div>
  );
}