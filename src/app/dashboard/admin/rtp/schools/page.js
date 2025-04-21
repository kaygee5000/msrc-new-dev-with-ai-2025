'use client';

import { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Spinner,
  Select,
  Option,
  Input,
  Chip,
  Progress
} from "@material-tailwind/react";
import { MagnifyingGlassIcon, ArrowPathIcon, AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import Link from 'next/link';

export default function RTPSchoolsPage() {
  const [loading, setLoading] = useState(true);
  const [schools, setSchools] = useState([]);
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  
  // Filters
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedItinerary, setSelectedItinerary] = useState('');
  const [responseStatus, setResponseStatus] = useState('all');
  const [galopStatus, setGalopStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Load initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch regions
        const regionsResponse = await fetch('/api/regions');
        const regionsData = await regionsResponse.json();
        setRegions(regionsData.regions || []);
        
        // Fetch itineraries
        const itinerariesResponse = await fetch('/api/rtp/itineraries');
        const itinerariesData = await itinerariesResponse.json();
        setItineraries(itinerariesData.itineraries || []);
        
        // Set default itinerary if available
        if (itinerariesData.itineraries && itinerariesData.itineraries.length > 0) {
          // Find active itinerary or use the most recent one
          const activeItinerary = itinerariesData.itineraries.find(i => i.is_active) || 
                                 itinerariesData.itineraries[0];
          setSelectedItinerary(activeItinerary.id.toString());
        }
        
        // Check URL parameters for initial filter values
        const urlParams = new URLSearchParams(window.location.search);
        const districtId = urlParams.get('district_id');
        const itineraryId = urlParams.get('itinerary_id');
        
        if (districtId) {
          setSelectedDistrict(districtId);
          
          // Fetch the district to get its region
          const districtResponse = await fetch(`/api/districts/${districtId}`);
          const districtData = await districtResponse.json();
          if (districtData.district && districtData.district.region_id) {
            setSelectedRegion(districtData.district.region_id.toString());
          }
        }
        
        if (itineraryId) {
          setSelectedItinerary(itineraryId);
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Fetch districts when region changes
  useEffect(() => {
    const fetchDistricts = async () => {
      if (!selectedRegion) {
        setDistricts([]);
        return;
      }
      
      try {
        const response = await fetch(`/api/districts?region_id=${selectedRegion}`);
        const data = await response.json();
        setDistricts(data.districts || []);
      } catch (error) {
        console.error("Error fetching districts:", error);
        setDistricts([]);
      }
    };
    
    fetchDistricts();
  }, [selectedRegion]);
  
  // Fetch schools based on filters
  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(true);
      try {
        let url = '/api/rtp/schools?';
        
        // Add filters to URL
        if (selectedRegion) url += `&region_id=${selectedRegion}`;
        if (selectedDistrict) url += `&district_id=${selectedDistrict}`;
        if (selectedItinerary) url += `&itinerary_id=${selectedItinerary}`;
        if (responseStatus !== 'all') url += `&response_status=${responseStatus}`;
        if (galopStatus !== 'all') url += `&galop_status=${galopStatus}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'success') {
          // Filter by search query if provided
          let filteredSchools = data.schools || [];
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredSchools = filteredSchools.filter(school => 
              school.school_name.toLowerCase().includes(query) ||
              school.district_name.toLowerCase().includes(query) ||
              school.region_name.toLowerCase().includes(query)
            );
          }
          setSchools(filteredSchools);
        } else {
          console.error("Error fetching schools:", data.message);
          setSchools([]);
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
        setSchools([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchools();
  }, [selectedRegion, selectedDistrict, selectedItinerary, responseStatus, galopStatus, searchQuery]);
  
  // Handle filter changes
  const handleRegionChange = (value) => {
    setSelectedRegion(value);
    setSelectedDistrict(''); // Reset district when region changes
  };
  
  const handleDistrictChange = (value) => {
    setSelectedDistrict(value);
  };
  
  const handleItineraryChange = (value) => {
    setSelectedItinerary(value);
  };
  
  const handleResponseStatusChange = (value) => {
    setResponseStatus(value);
  };
  
  const handleGalopStatusChange = (value) => {
    setGalopStatus(value);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const resetFilters = () => {
    setSelectedRegion('');
    setSelectedDistrict('');
    setResponseStatus('all');
    setGalopStatus('all');
    setSearchQuery('');
  };
  
  // Helper function to get color based on percentage
  const getColorForPercentage = (percentage) => {
    if (percentage >= 75) return "green";
    if (percentage >= 50) return "blue";
    if (percentage >= 25) return "amber";
    return "red";
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Typography variant="h3" color="blue-gray">
            RTP Schools Management
          </Typography>
          <Typography variant="paragraph" color="gray" className="mt-1">
            Manage and monitor Right to Play participation across schools
          </Typography>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
          <div>
            <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
              Region
            </Typography>
            <Select
              label="Select Region"
              value={selectedRegion}
              onChange={handleRegionChange}
            >
              <Option value="">All Regions</Option>
              {regions.map(region => (
                <Option key={region.id} value={region.id.toString()}>
                  {region.name}
                </Option>
              ))}
            </Select>
          </div>
          
          <div>
            <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
              District
            </Typography>
            <Select
              label="Select District"
              value={selectedDistrict}
              onChange={handleDistrictChange}
              disabled={!selectedRegion}
            >
              <Option value="">All Districts</Option>
              {districts.map(district => (
                <Option key={district.id} value={district.id.toString()}>
                  {district.name}
                </Option>
              ))}
            </Select>
          </div>
          
          <div>
            <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
              Itinerary
            </Typography>
            <Select
              label="Select Itinerary"
              value={selectedItinerary}
              onChange={handleItineraryChange}
            >
              <Option value="">All Itineraries</Option>
              {itineraries.map(itinerary => (
                <Option key={itinerary.id} value={itinerary.id.toString()}>
                  {itinerary.title}
                </Option>
              ))}
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mt-4">
          <div>
            <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
              GALOP Status
            </Typography>
            <Select
              label="GALOP Status"
              value={galopStatus}
              onChange={handleGalopStatusChange}
            >
              <Option value="all">All Schools</Option>
              <Option value="galop">GALOP Schools</Option>
              <Option value="non-galop">Non-GALOP Schools</Option>
            </Select>
          </div>
          
          <div>
            <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
              Response Status
            </Typography>
            <Select
              label="Response Status"
              value={responseStatus}
              onChange={handleResponseStatusChange}
              disabled={!selectedItinerary}
            >
              <Option value="all">All Schools</Option>
              <Option value="responded">Responded</Option>
              <Option value="not-responded">Not Responded</Option>
            </Select>
          </div>
          
          <div>
            <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
              Search
            </Typography>
            <Input 
              label="Search schools..." 
              icon={<MagnifyingGlassIcon className="h-5 w-5" />} 
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button 
            variant="outlined" 
            size="sm" 
            className="flex items-center gap-2"
            onClick={resetFilters}
          >
            <ArrowPathIcon strokeWidth={2} className="h-4 w-4" /> Reset Filters
          </Button>
        </div>
        
        {/* Active filters display */}
        {(selectedRegion || selectedDistrict || responseStatus !== 'all' || galopStatus !== 'all' || searchQuery.trim()) && (
          <div className="flex flex-wrap gap-2 mt-4">
            <Typography variant="small" color="blue-gray" className="mr-2 font-medium mt-1">
              Active Filters:
            </Typography>
            
            {selectedRegion && (
              <Chip
                variant="filled"
                size="sm"
                color="blue"
                value={`Region: ${regions.find(r => r.id.toString() === selectedRegion)?.name || 'Selected'}`}
                onClose={() => setSelectedRegion('')}
              />
            )}
            
            {selectedDistrict && (
              <Chip
                variant="filled"
                size="sm"
                color="blue"
                value={`District: ${districts.find(d => d.id.toString() === selectedDistrict)?.name || 'Selected'}`}
                onClose={() => setSelectedDistrict('')}
              />
            )}
            
            {selectedItinerary && (
              <Chip
                variant="filled"
                size="sm"
                color="blue"
                value={`Itinerary: ${itineraries.find(i => i.id.toString() === selectedItinerary)?.title || 'Selected'}`}
                onClose={() => setSelectedItinerary('')}
              />
            )}
            
            {galopStatus !== 'all' && (
              <Chip
                variant="filled"
                size="sm"
                color="green"
                value={galopStatus === 'galop' ? 'GALOP Schools' : 'Non-GALOP Schools'}
                onClose={() => setGalopStatus('all')}
              />
            )}
            
            {responseStatus !== 'all' && (
              <Chip
                variant="filled"
                size="sm"
                color="purple"
                value={responseStatus === 'responded' ? 'Responded' : 'Not Responded'}
                onClose={() => setResponseStatus('all')}
              />
            )}
            
            {searchQuery.trim() && (
              <Chip
                variant="filled"
                size="sm"
                color="amber"
                value={`Search: ${searchQuery}`}
                onClose={() => setSearchQuery('')}
              />
            )}
          </div>
        )}
      </Card>
      
      {/* Schools Table */}
      <Card className="h-full w-full">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h5" color="blue-gray">
              Schools
            </Typography>
            
            <Typography variant="small" color="blue-gray">
              Total: {schools.length} schools
            </Typography>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner className="h-12 w-12" />
            </div>
          ) : schools.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <Typography variant="h6" color="gray">
                No schools found with the selected filters
              </Typography>
            </div>
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
                        District
                      </Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal leading-none opacity-70"
                      >
                        Type
                      </Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal leading-none opacity-70"
                      >
                        Participation
                      </Typography>
                    </th>
                    {selectedItinerary && (
                      <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                        <Typography
                          variant="small"
                          color="blue-gray"
                          className="font-normal leading-none opacity-70"
                        >
                          Itinerary Status
                        </Typography>
                      </th>
                    )}
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
                  {schools.map((school) => (
                    <tr key={school.id} className="hover:bg-blue-gray-50/30">
                      <td className="p-4">
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {school.school_name}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {school.district_name}
                        </Typography>
                        <Typography variant="small" color="gray" className="font-normal text-xs">
                          {school.region_name}
                        </Typography>
                      </td>
                      <td className="p-4">
                        {school.is_galop ? (
                          <Chip
                            variant="ghost"
                            size="sm"
                            color="green"
                            value="GALOP"
                          />
                        ) : (
                          <Chip
                            variant="ghost"
                            size="sm"
                            color="blue-gray"
                            value="Non-GALOP"
                          />
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <Typography variant="small" color="blue-gray" className="font-normal">
                              {school.participation_percentage}%
                            </Typography>
                          </div>
                          <Progress
                            value={school.participation_percentage}
                            color={getColorForPercentage(school.participation_percentage)}
                            size="sm"
                          />
                          <div className="flex gap-1 flex-wrap">
                            {school.output_submissions > 0 && (
                              <Chip
                                size="sm"
                                variant="ghost"
                                color="blue"
                                value={`Output: ${school.output_submissions}`}
                                className="text-xs"
                              />
                            )}
                            {school.checklist_submissions > 0 && (
                              <Chip
                                size="sm"
                                variant="ghost"
                                color="green"
                                value={`Checklist: ${school.checklist_submissions}`}
                                className="text-xs"
                              />
                            )}
                            {school.partners_submissions > 0 && (
                              <Chip
                                size="sm"
                                variant="ghost"
                                color="purple"
                                value={`Partners: ${school.partners_submissions}`}
                                className="text-xs"
                              />
                            )}
                          </div>
                        </div>
                      </td>
                      {selectedItinerary && (
                        <td className="p-4">
                          <Chip
                            variant="ghost"
                            size="sm"
                            color={school.has_responded_to_itinerary ? "green" : "red"}
                            value={school.has_responded_to_itinerary ? "Responded" : "Not Responded"}
                          />
                          {school.has_responded_to_itinerary && (
                            <div className="flex gap-1 flex-wrap mt-2">
                              {school.itinerary_output_submissions > 0 && (
                                <Chip
                                  size="sm"
                                  variant="ghost"
                                  color="blue"
                                  value="Output"
                                  className="text-xs"
                                />
                              )}
                              {school.itinerary_checklist_submissions > 0 && (
                                <Chip
                                  size="sm"
                                  variant="ghost"
                                  color="green"
                                  value="Checklist"
                                  className="text-xs"
                                />
                              )}
                              {school.itinerary_partners_submissions > 0 && (
                                <Chip
                                  size="sm"
                                  variant="ghost"
                                  color="purple"
                                  value="Partners"
                                  className="text-xs"
                                />
                              )}
                            </div>
                          )}
                        </td>
                      )}
                      <td className="p-4">
                        <Link href={`/dashboard/admin/rtp/schools/${school.id}`}>
                          <Button size="sm" variant="outlined">View Details</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}