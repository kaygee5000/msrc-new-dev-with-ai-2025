/**
 * Utility functions for data export operations
 */

/**
 * Creates a standardized filename for exports with date and filters
 * @param {string} prefix - The prefix for the filename (e.g., 'rtp-output')
 * @param {Object} options - Export options like itinerary, filters, etc.
 * @returns {string} Formatted filename with .csv extension
 */
export function createExportFilename(prefix, options = {}) {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let filename = `${prefix}-${date}`;
  
  // Add itinerary if available
  if (options.itinerary) {
    filename += `-${options.itinerary}`;
  }
  
  // Add school type if it's not 'all'
  if (options.schoolType && options.schoolType !== 'all') {
    filename += `-${options.schoolType}`;
  }
  
  // Add .csv extension
  filename += '.csv';
  
  return filename;
}

/**
 * Converts JSON data to CSV format
 * @param {Array} data - Array of objects to convert to CSV
 * @param {Array} headers - Array of header objects with keys and display names
 * @returns {string} CSV formatted string
 */
export function convertToCSV(data, headers) {
  if (!data || !data.length) {
    return '';
  }
  
  // Create header row
  const headerRow = headers.map(h => h.display).join(',');
  
  // Convert each data row
  const rows = data.map(item => {
    return headers.map(header => {
      // Get the value for this cell
      const value = item[header.key];
      
      // Handle different data types
      if (value === null || value === undefined) {
        return '';
      } else if (typeof value === 'string') {
        // Escape quotes and wrap in quotes if it contains commas or quotes
        const escaped = value.replace(/"/g, '""');
        return (value.includes(',') || value.includes('"')) 
          ? `"${escaped}"` 
          : escaped;
      } else {
        return value;
      }
    }).join(',');
  });
  
  // Combine header and rows
  return [headerRow, ...rows].join('\n');
}

/**
 * Downloads a CSV string as a file
 * @param {string} csv - CSV formatted string
 * @param {string} filename - The filename to download as
 */
export function downloadCSV(csv, filename) {
  // Create a blob with the CSV data
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  
  // Create a download URL
  const url = URL.createObjectURL(blob);
  
  // Create a temporary link and trigger the download
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  
  // Clean up
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Fetches data from an API endpoint and exports it as CSV
 * @param {string} apiUrl - The API URL to fetch data from
 * @param {Array} headers - Array of header objects with keys and display names
 * @param {string} filename - The filename to download as
 * @param {Function} dataExtractor - Optional function to extract the data from the API response
 * @returns {Object} Result object with success status and error message if applicable
 */
export async function fetchAndExportCSV(apiUrl, headers, filename, dataExtractor = response => response) {
  try {
    // Fetch data from API
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    // Parse the JSON response
    const jsonResponse = await response.json();
    
    // Extract the data array using the provided extractor function
    const data = dataExtractor(jsonResponse);
    
    // Check if we have valid data
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { 
        success: false, 
        error: 'No data available for export' 
      };
    }
    
    // Convert to CSV
    const csv = convertToCSV(data, headers);
    
    // Download the CSV file
    downloadCSV(csv, filename);
    
    return { success: true };
  } catch (error) {
    console.error('Error in fetchAndExportCSV:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to export data' 
    };
  }
}

/**
 * Exports data that's already available in memory as CSV
 * @param {Array} data - Array of objects to export as CSV
 * @param {Array} headers - Array of header objects with keys and display names
 * @param {string} filename - The filename to download as
 * @returns {Object} Result object with success status and error message if applicable
 */
export function exportDataAsCSV(data, headers, filename) {
  try {
    // Check if we have valid data
    if (!data || !Array.isArray(data) || data.length === 0) {
      return { 
        success: false, 
        error: 'No data available for export' 
      };
    }
    
    // Convert to CSV
    const csv = convertToCSV(data, headers);
    
    // Download the CSV file
    downloadCSV(csv, filename);
    
    return { success: true };
  } catch (error) {
    console.error('Error in exportDataAsCSV:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to export data' 
    };
  }
}