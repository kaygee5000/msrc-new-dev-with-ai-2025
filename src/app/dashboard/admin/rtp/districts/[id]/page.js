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
  Avatar,
  Progress
} from "@material-tailwind/react";
import { 
  ArrowLeftIcon, 
  ChartBarIcon, 
  DocumentTextIcon, 
  CalendarIcon,
  UserIcon,
  SchoolIcon,
  ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";
import Link from 'next/link';

export default function DistrictDetailPage({ params }) {
  const { id } = params;
  const [loading, setLoading] = useState(true);
  const [districtDetail, setDistrictDetail] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedItinerary, setSelectedItinerary] = useState(null);
  
  useEffect(() => {
    const fetchDistrictDetail = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/rtp/districts/${id}/history`);
        const data = await response.json();
        
        if (data.status === 'success') {
          setDistrictDetail(data);
          
          // If there are submissions, select the first itinerary by default
          if (data.submissions && data.submissions.length > 0) {
            setSelectedItinerary(data.submissions[0]);
          }
        } else {
          console.error("Error fetching district detail:", data.message);
        }
      } catch (error) {
        console.error("Error fetching district detail:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDistrictDetail();
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
  
  // Helper function to get color based on percentage
  const getColorForPercentage = (percentage) => {
    if (percentage >= 75) return "green";
    if (percentage >= 50) return "blue";
    if (percentage >= 25) return "amber";
    return "red";
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Spinner className="h-12 w-12" />
      </div>
    );
  }
  
  if (!districtDetail) {
    return (
      <div className="p-4">
        <Alert color="red">Failed to load district information</Alert>
        <div className="mt-4">
          <Link href="/dashboard/admin/rtp/districts">
            <Button className="flex items-center gap-2" color="blue" size="sm">
              <ArrowLeftIcon className="h-4 w-4" /> Back to Districts
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  const { district, statistics, submissions } = districtDetail;
  
  return (
    <div className="p-4">
      <div className="mb-6">
        <Link href="/dashboard/admin/rtp/districts">
          <Button className="flex items-center gap-2" variant="text" color="blue" size="sm">
            <ArrowLeftIcon className="h-4 w-4" /> Back to Districts
          </Button>
        </Link>
      </div>
      
      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* District Info Card */}
        <Card className="flex-1 p-4">
          <div className="mb-4">
            <Typography variant="h4" color="blue-gray">
              {district.name}
            </Typography>
            <Typography variant="paragraph" color="blue-gray" className="mt-1">
              Region: {district.region_name}
            </Typography>
          </div>
          
          <List className="p-0">
            <ListItem className="py-1.5">
              <ListItemPrefix>
                <SchoolIcon className="h-5 w-5" />
              </ListItemPrefix>
              <div className="flex flex-col">
                <Typography variant="small" color="blue-gray">Total Schools:</Typography>
                <Typography variant="small" color="gray">{district.total_schools}</Typography>
              </div>
            </ListItem>
            <ListItem className="py-1.5">
              <ListItemPrefix>
                <SchoolIcon className="h-5 w-5" />
              </ListItemPrefix>
              <div className="flex flex-col">
                <Typography variant="small" color="blue-gray">GALOP Schools:</Typography>
                <Typography variant="small" color="gray">{district.galop_schools}</Typography>
              </div>
            </ListItem>
          </List>
        </Card>
        
        {/* Statistics Summary Card */}
        <Card className="flex-1 p-4">
          <Typography variant="h5" color="blue-gray" className="mb-4">
            RTP Participation Summary
          </Typography>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded">
              <Typography variant="h4" color="blue" className="text-center">
                {statistics.district_output_submissions}
              </Typography>
              <Typography variant="small" color="blue-gray" className="text-center">
                District Output Submissions
              </Typography>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <Typography variant="h4" color="green" className="text-center">
                {statistics.schools_with_output}
              </Typography>
              <Typography variant="small" color="blue-gray" className="text-center">
                Schools with Output
              </Typography>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-purple-50 p-3 rounded">
              <Typography variant="h4" color="purple" className="text-center">
                {statistics.schools_with_checklist}
              </Typography>
              <Typography variant="small" color="blue-gray" className="text-center">
                Schools with Checklists
              </Typography>
            </div>
            <div className="bg-amber-50 p-3 rounded">
              <Typography variant="h4" color="amber" className="text-center">
                {statistics.schools_with_partners}
              </Typography>
              <Typography variant="small" color="blue-gray" className="text-center">
                Schools with Partners in Play
              </Typography>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded">
            <div className="flex items-center justify-between mb-2">
              <Typography variant="h6" color="blue-gray">
                School Participation Rate
              </Typography>
              <Typography variant="h6" color="blue-gray">
                {statistics.school_participation_percentage}%
              </Typography>
            </div>
            <Progress
              value={statistics.school_participation_percentage}
              color={getColorForPercentage(statistics.school_participation_percentage)}
              className="h-2"
            />
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
            Itinerary Details
          </Tab>
          <Tab value="schools" onClick={() => handleTabChange("schools")}>
            Schools
          </Tab>
        </TabsHeader>
        
        <TabsBody animate={{ initial: { y: 250 }, mount: { y: 0 }, unmount: { y: 250 } }}>
          <TabPanel value="overview">
            {/* Itineraries Overview */}
            <div className="mb-6">
              <Typography variant="h5" color="blue-gray" className="mb-4">
                Itineraries Overview
              </Typography>
              
              {submissions.length === 0 ? (
                <Alert color="blue">
                  This district has not participated in any RTP itineraries yet.
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {submissions.map((itinerary) => {
                    const schoolCount = Object.keys(itinerary.schools).length;
                    const districtResponsesCount = itinerary.district_output.length;
                    
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
                              District Output:
                            </Typography>
                            <Typography variant="small" color="gray">
                              {districtResponsesCount} submissions
                            </Typography>
                          </div>
                          <div className="flex justify-between mb-2">
                            <Typography variant="small" color="blue-gray">
                              Schools Participating:
                            </Typography>
                            <Typography variant="small" color="gray">
                              {schoolCount} schools
                            </Typography>
                          </div>
                          <div className="flex justify-between mb-2">
                            <Typography variant="small" color="blue-gray">
                              School Participation Rate:
                            </Typography>
                            <Typography variant="small" color="gray">
                              {Math.round((schoolCount / Math.max(district.total_schools, 1)) * 100)}%
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
                            View Details
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
            {submissions.length > 0 && (
              <div className="mb-6">
                <Typography variant="h6" color="blue-gray" className="mb-2">
                  Select Itinerary
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {submissions.map((itinerary) => (
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
            
            {/* Selected Itinerary Details */}
            {selectedItinerary ? (
              <div>
                <Typography variant="h5" color="blue-gray" className="mb-4">
                  {selectedItinerary.itinerary_title} - Details
                </Typography>
                
                {/* District Output Submissions */}
                {selectedItinerary.district_output.length > 0 && (
                  <div className="mb-6">
                    <Typography variant="h6" color="blue" className="mb-2">
                      District Output Submissions ({selectedItinerary.district_output.length})
                    </Typography>
                    <Card>
                      <List>
                        {selectedItinerary.district_output.map((submission, index) => (
                          <ListItem key={index} className="hover:bg-blue-gray-50/50">
                            <ListItemPrefix>
                              <Avatar
                                variant="circular"
                                size="sm"
                                alt="district form"
                                className="p-1"
                                src="/file.svg"
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
                              <Link href={`/dashboard/admin/rtp/responses/${submission.id}?type=district-output`}>
                                <Button size="sm" variant="text">View Details</Button>
                              </Link>
                            </ListItemSuffix>
                          </ListItem>
                        ))}
                      </List>
                    </Card>
                  </div>
                )}
                
                {/* School Participation Summary for this Itinerary */}
                <div className="mb-6">
                  <Typography variant="h6" color="green" className="mb-2">
                    School Participation ({Object.keys(selectedItinerary.schools).length} schools)
                  </Typography>
                  
                  <Card>
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <Typography variant="small" color="blue-gray">
                          Participation Rate
                        </Typography>
                        <Typography variant="small" color="blue-gray">
                          {Math.round((Object.keys(selectedItinerary.schools).length / Math.max(district.total_schools, 1)) * 100)}%
                        </Typography>
                      </div>
                      <Progress
                        value={Math.round((Object.keys(selectedItinerary.schools).length / Math.max(district.total_schools, 1)) * 100)}
                        color={getColorForPercentage(Math.round((Object.keys(selectedItinerary.schools).length / Math.max(district.total_schools, 1)) * 100))}
                        className="h-2 mb-4"
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded">
                          <Typography variant="h5" color="blue" className="text-center">
                            {Object.values(selectedItinerary.schools).reduce((count, school) => 
                              count + (school.school_output.length > 0 ? 1 : 0), 0)}
                          </Typography>
                          <Typography variant="small" color="blue-gray" className="text-center">
                            Schools with Output Submissions
                          </Typography>
                        </div>
                        <div className="bg-green-50 p-3 rounded">
                          <Typography variant="h5" color="green" className="text-center">
                            {Object.values(selectedItinerary.schools).reduce((count, school) => 
                              count + (school.consolidated_checklist.length > 0 ? 1 : 0), 0)}
                          </Typography>
                          <Typography variant="small" color="blue-gray" className="text-center">
                            Schools with Checklist Submissions
                          </Typography>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <Typography variant="h5" color="purple" className="text-center">
                            {Object.values(selectedItinerary.schools).reduce((count, school) => 
                              count + (school.partners_in_play.length > 0 ? 1 : 0), 0)}
                          </Typography>
                          <Typography variant="small" color="blue-gray" className="text-center">
                            Schools with Partners in Play Submissions
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
                
                {/* No district submissions message */}
                {selectedItinerary.district_output.length === 0 && Object.keys(selectedItinerary.schools).length === 0 && (
                  <Alert color="blue">
                    No submissions found for this itinerary.
                  </Alert>
                )}
              </div>
            ) : submissions.length === 0 ? (
              <Alert color="blue">
                This district has not participated in any RTP itineraries yet.
              </Alert>
            ) : (
              <Alert color="blue">
                Select an itinerary to view details.
              </Alert>
            )}
          </TabPanel>
          
          <TabPanel value="schools">
            {/* Schools in this district */}
            <div className="mb-6">
              <Typography variant="h5" color="blue-gray" className="mb-4">
                Schools in {district.name} District
              </Typography>
              
              {selectedItinerary ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Typography variant="h6" color="blue-gray">
                      Schools Participating in {selectedItinerary.itinerary_title}
                    </Typography>
                    <Link href={`/dashboard/admin/rtp/schools?district_id=${district.id}&itinerary_id=${selectedItinerary.itinerary_id}`}>
                      <Button size="sm" variant="outlined">View All District Schools</Button>
                    </Link>
                  </div>
                  
                  {Object.keys(selectedItinerary.schools).length === 0 ? (
                    <Alert color="blue">
                      No schools in this district have submitted RTP data for this itinerary.
                    </Alert>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-max table-auto text-left">
                        <thead>
                          <tr>
                            <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-normal leading-none opacity-70"
                              >
                                School Name
                              </Typography>
                            </th>
                            <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-normal leading-none opacity-70"
                              >
                                School Output
                              </Typography>
                            </th>
                            <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-normal leading-none opacity-70"
                              >
                                Consolidated Checklist
                              </Typography>
                            </th>
                            <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-normal leading-none opacity-70"
                              >
                                Partners in Play
                              </Typography>
                            </th>
                            <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                              <Typography
                                variant="small"
                                color="blue-gray"
                                className="font-normal leading-none opacity-70"
                              >
                                Actions
                              </Typography>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedItinerary.schools.map((school) => (
                            <tr key={school.school_id} className="hover:bg-blue-gray-50/30">
                              <td className="p-4">
                                <Typography variant="small" color="blue-gray" className="font-normal">
                                  {school.school_name}
                                </Typography>
                              </td>
                              <td className="p-4">
                                {school.school_output.length > 0 ? (
                                  <Chip
                                    size="sm"
                                    variant="ghost"
                                    color="blue"
                                    value={`${school.school_output.length} Responses`}
                                  />
                                ) : (
                                  <Chip
                                    size="sm"
                                    variant="ghost"
                                    color="gray"
                                    value="None"
                                  />
                                )}
                              </td>
                              <td className="p-4">
                                {school.consolidated_checklist.length > 0 ? (
                                  <Chip
                                    size="sm"
                                    variant="ghost"
                                    color="green"
                                    value={`${school.consolidated_checklist.length} Responses`}
                                  />
                                ) : (
                                  <Chip
                                    size="sm"
                                    variant="ghost"
                                    color="gray"
                                    value="None"
                                  />
                                )}
                              </td>
                              <td className="p-4">
                                {school.partners_in_play.length > 0 ? (
                                  <Chip
                                    size="sm"
                                    variant="ghost"
                                    color="purple"
                                    value={`${school.partners_in_play.length} Responses`}
                                  />
                                ) : (
                                  <Chip
                                    size="sm"
                                    variant="ghost"
                                    color="gray"
                                    value="None"
                                  />
                                )}
                              </td>
                              <td className="p-4">
                                <Link href={`/dashboard/admin/rtp/schools/${school.school_id}`}>
                                  <Button size="sm" variant="text">View School</Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Typography variant="h6" color="blue-gray">
                      All Schools
                    </Typography>
                    <Link href={`/dashboard/admin/rtp/schools?district_id=${district.id}`}>
                      <Button size="sm" variant="outlined">View All District Schools</Button>
                    </Link>
                  </div>
                  <Alert color="blue">
                    Select an itinerary to see participating schools.
                  </Alert>
                </div>
              )}
            </div>
          </TabPanel>
        </TabsBody>
      </Tabs>
    </div>
  );
}