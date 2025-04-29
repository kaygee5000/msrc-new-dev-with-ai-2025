// Import real data from mockDatabase
import { teachers } from './mockDatabase';

// Extract unique values for each filter category
const extractUniqueValues = (array, key) => [...new Set(array.map(item => item[key]))].sort();

// Get all unique regions, districts, schools, and teachers from the real data
const allRegions = extractUniqueValues(teachers, 'region');
const allDistricts = extractUniqueValues(teachers, 'district');
const allCircuits = extractUniqueValues(teachers, 'circuit');
const allSchools = extractUniqueValues(teachers, 'school');
const allTeachers = teachers.map(t => t.name);

// Static filters that don't depend on the database
const interventionTypes = ['GALOP', 'Direct', 'Indirect'];
const academicYears = ['2024-2025', '2025-2026'];
const terms = ['Term 1', 'Term 2', 'Term 3'];

// Create itineraries from academic years and terms
const itineraries = [];
academicYears.forEach(year => {
  terms.forEach(term => {
    itineraries.push(`${term} ${year}`);
  });
});

// Base filters with all options
export const mockFilters = {
  regions: allRegions,
  districts: allDistricts,
  circuits: allCircuits,
  schools: allSchools,
  teachers: allTeachers,
  intervention_types: interventionTypes,
  academic_years: academicYears,
  terms: terms,
  itineraries: itineraries
};

// Function to get cascading filters based on current selections
export function getCascadingFilters(selectedFilters = {}) {
  // Start with all data
  let filteredTeachers = [...teachers];
  
  // Apply filters sequentially
  if (selectedFilters.regions) {
    filteredTeachers = filteredTeachers.filter(t => t.region === selectedFilters.regions);
  }
  
  if (selectedFilters.districts) {
    filteredTeachers = filteredTeachers.filter(t => t.district === selectedFilters.districts);
  }
  
  if (selectedFilters.circuits) {
    filteredTeachers = filteredTeachers.filter(t => t.circuit === selectedFilters.circuits);
  }
  
  if (selectedFilters.schools) {
    filteredTeachers = filteredTeachers.filter(t => t.school === selectedFilters.schools);
  }
  
  // Extract available options based on filtered data
  const availableDistricts = selectedFilters.regions ? 
    [...new Set(filteredTeachers.map(t => t.district))].sort() : 
    allDistricts;
    
  const availableCircuits = (selectedFilters.regions || selectedFilters.districts) ? 
    [...new Set(filteredTeachers.map(t => t.circuit))].sort() : 
    allCircuits;
    
  const availableSchools = (selectedFilters.regions || selectedFilters.districts || selectedFilters.circuits) ? 
    [...new Set(filteredTeachers.map(t => t.school))].sort() : 
    allSchools;
    
  const availableTeachers = (selectedFilters.regions || selectedFilters.districts || selectedFilters.circuits || selectedFilters.schools) ? 
    filteredTeachers.map(t => t.name) : 
    allTeachers;
  
  // Return cascading filters
  return {
    regions: allRegions, // Regions are always all available
    districts: availableDistricts,
    circuits: availableCircuits,
    schools: availableSchools,
    teachers: availableTeachers,
    intervention_types: interventionTypes, // These don't cascade
    academic_years: academicYears,
    terms: terms,
    itineraries: itineraries
  };
}
