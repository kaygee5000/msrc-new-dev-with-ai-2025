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
import { MagnifyingGlassIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import Link from 'next/link';

export default function RTPDistrictsPage() {
  const [loading, setLoading] = useState(true);
  const [districts, setDistricts] = useState([]);
  const [regions, setRegions] = useState([]);
  const [itineraries, setItineraries] = useState([]);
  
  // Filters
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedItinerary, setSelectedItinerary] = useState('');
  const [responseStatus, setResponseStatus] = useState('all');
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
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // Fetch districts based on filters
  useEffect(() => {
    const fetchDistricts = async () => {
      setLoading(true);
      try {
        let url = '/api/rtp/districts?';
        
        // Add filters to URL
        if (selectedRegion) url += `&region_id=${selectedRegion}`;
        if (selectedItinerary) url += `&itinerary_id=${selectedItinerary}`;
        if (responseStatus !== 'all') url += `&response_status=${responseStatus}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.status === 'success') {
          // Filter by search query if provided
          let filteredDistricts = data.districts || [];
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filteredDistricts = filteredDistricts.filter(district => 
              district.district_name.toLowerCase().includes(query) ||
              district.region_name.toLowerCase().includes(query)
            );
          }
          setDistricts(filteredDistricts);
        } else {
          console.error("Error fetching districts:", data.message);
          setDistricts([]);
        }
      } catch (error) {
        console.error("Error fetching districts:", error);
        setDistricts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDistricts();
  }, [selectedRegion, selectedItinerary, responseStatus, searchQuery]);
  
  // Handle filter changes
  const handleRegionChange = (value) => {
    setSelectedRegion(value);
  };
  
  const handleItineraryChange = (value) => {
    setSelectedItinerary(value);
  };
  
  const handleResponseStatusChange = (value) => {
    setResponseStatus(value);
  };
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const resetFilters = () => {
    setSelectedRegion('');
    setResponseStatus('all');
    setSearchQuery('');
  };
  
  // Get active itinerary name for display
  const getActiveItineraryName = () => {
    if (!selectedItinerary) return 'All Itineraries';
    const found = itineraries.find(i => i.id.toString() === selectedItinerary);
    return found ? found.title : 'Selected Itinerary';
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
            RTP Districts Management
          </Typography>
          <Typography variant="paragraph" color="gray" className="mt-1">
            Manage and monitor Right to Play participation across districts
          </Typography>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
              <Option value="all">All Districts</Option>
              <Option value="responded">Responded</Option>
              <Option value="not-responded">Not Responded</Option>
            </Select>
          </div>
          
          <div>
            <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
              Search
            </Typography>
            <Input 
              label="Search districts..." 
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
        {(selectedRegion || responseStatus !== 'all' || searchQuery.trim()) && (
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
            
            {selectedItinerary && (
              <Chip
                variant="filled"
                size="sm"
                color="blue"
                value={`Itinerary: ${getActiveItineraryName()}`}
                onClose={() => setSelectedItinerary('')}
              />
            )}
            
            {responseStatus !== 'all' && (
              <Chip
                variant="filled"
                size="sm"
                color="blue"
                value={responseStatus === 'responded' ? 'Responded' : 'Not Responded'}
                onClose={() => setResponseStatus('all')}
              />
            )}
            
            {searchQuery.trim() && (
              <Chip
                variant="filled"
                size="sm"
                color="blue"
                value={`Search: ${searchQuery}`}
                onClose={() => setSearchQuery('')}
              />
            )}
          </div>
        )}
      </Card>
      
      {/* Districts Table */}
      <Card className="h-full w-full">
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <Typography variant="h5" color="blue-gray">
              Districts
            </Typography>
            
            <Typography variant="small" color="blue-gray">
              Total: {districts.length} districts
            </Typography>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner className="h-12 w-12" />
            </div>
          ) : districts.length === 0 ? (
            <div className="flex justify-center items-center h-64">
              <Typography variant="h6" color="gray">
                No districts found with the selected filters
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
                        District Name
                      </Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal leading-none opacity-70"
                      >
                        Region
                      </Typography>
                    </th>
                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal leading-none opacity-70"
                      >
                        Schools
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
                    <th className="border-b border-blue-gray-100 bg-blue-gray-50 p-4">
                      <Typography
                        variant="small"
                        color="blue-gray"
                        className="font-normal leading-none opacity-70"
                      >
                        District Output
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
                  {districts.map((district) => (
                    <tr key={district.id} className="hover:bg-blue-gray-50/30">
                      <td className="p-4">
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {district.district_name}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <Typography variant="small" color="blue-gray" className="font-normal">
                          {district.region_name}
                        </Typography>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <Typography variant="small" color="blue-gray" className="font-normal">
                            {district.total_schools} Total
                          </Typography>
                          {district.galop_schools > 0 && (
                            <Typography variant="small" color="gray" className="font-normal text-xs">
                              GALOP: {district.galop_schools}
                            </Typography>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <Typography variant="small" color="blue-gray" className="font-normal">
                              {district.school_participation_percentage}%
                            </Typography>
                          </div>
                          <Progress
                            value={district.school_participation_percentage}
                            color={getColorForPercentage(district.school_participation_percentage)}
                            size="sm"
                          />
                          <Typography variant="small" color="gray" className="font-normal text-xs">
                            {Math.max(
                              district.schools_with_output_submissions || 0,
                              district.schools_with_checklist_submissions || 0,
                              district.schools_with_partner_submissions || 0
                            )}/{district.total_schools} schools
                          </Typography>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <Typography variant="small" color="blue-gray" className="font-normal">
                            {district.total_district_output_submissions || 0} Submissions
                          </Typography>
                        </div>
                      </td>
                      {selectedItinerary && (
                        <td className="p-4">
                          <Chip
                            variant="ghost"
                            size="sm"
                            color={district.has_responded_to_itinerary ? "green" : "red"}
                            value={district.has_responded_to_itinerary ? "Responded" : "Not Responded"}
                          />
                          {selectedItinerary && district.itinerary_school_participation_percentage !== undefined && (
                            <div className="flex flex-col gap-1 mt-2">
                              <Typography variant="small" color="gray" className="font-normal text-xs">
                                School participation: {district.itinerary_school_participation_percentage}%
                              </Typography>
                              <Progress
                                value={district.itinerary_school_participation_percentage}
                                color={getColorForPercentage(district.itinerary_school_participation_percentage)}
                                size="sm"
                              />
                            </div>
                          )}
                        </td>
                      )}
                      <td className="p-4">
                        <Link href={`/dashboard/admin/rtp/districts/${district.id}`}>
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