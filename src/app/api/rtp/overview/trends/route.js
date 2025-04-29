import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getConnectionConfig } from '@/utils/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const itineraryId = searchParams.get('itineraryId');
    
    if (!itineraryId) {
      return NextResponse.json(
        { success: false, error: 'Missing itineraryId parameter' },
        { status: 400 }
      );
    }

    const conn = await mysql.createConnection(getConnectionConfig());
    
    try {
      // Get itinerary date range to establish our X-axis
      const [[itinerary]] = await conn.execute(
        `SELECT from_date, until_date FROM right_to_play_itineraries WHERE id = ?`,
        [itineraryId]
      );
      
      if (!itinerary) {
        return NextResponse.json(
          { success: false, error: 'Itinerary not found' },
          { status: 404 }
        );
      }

      // Generate an array of month/year combinations within the itinerary range
      const startDate = new Date(itinerary.from_date);
      const endDate = new Date(itinerary.until_date);
      const months = [];
      const monthNames = [];
      
      // Create array of YYYY-MM strings and corresponding month names
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        months.push(`${year}-${month}`);
        
        // Month name for display (e.g., "Jan 2025")
        const monthName = new Intl.DateTimeFormat('en', { month: 'short' }).format(currentDate);
        monthNames.push(`${monthName} ${year}`);
        
        // Move to next month
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

      // 1. School Output submissions by month - from right_to_play_question_answers
      const [schoolOutputData] = await conn.execute(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') AS month,
          COUNT(DISTINCT school_id) AS count
        FROM 
          right_to_play_question_answers
        WHERE 
          itinerary_id = ?
          AND created_at BETWEEN ? AND ?
        GROUP BY 
          month
        ORDER BY 
          month
      `, [itineraryId, itinerary.from_date, itinerary.until_date]);

      // 2. District Output submissions by month - from right_to_play_district_responses
      const [districtOutputData] = await conn.execute(`
        SELECT 
          DATE_FORMAT(submitted_at, '%Y-%m') AS month,
          COUNT(DISTINCT district_id) AS count
        FROM 
          right_to_play_district_responses
        WHERE 
          itinerary_id = ?
          AND submitted_at BETWEEN ? AND ?
        GROUP BY 
          month
        ORDER BY 
          month
      `, [itineraryId, itinerary.from_date, itinerary.until_date]);

      // 3. Consolidated Checklist submissions by month - from right_to_play_consolidated_checklist_responses
      const [checklistData] = await conn.execute(`
        SELECT 
          DATE_FORMAT(submitted_at, '%Y-%m') AS month,
          COUNT(DISTINCT school_id) AS count
        FROM 
          right_to_play_consolidated_checklist_responses
        WHERE 
          itinerary_id = ?
          AND submitted_at BETWEEN ? AND ?
        GROUP BY 
          month
        ORDER BY 
          month
      `, [itineraryId, itinerary.from_date, itinerary.until_date]);

      // 4. Partners in Play submissions by month - from right_to_play_pip_responses
      const [pipData] = await conn.execute(`
        SELECT 
          DATE_FORMAT(submitted_at, '%Y-%m') AS month,
          COUNT(DISTINCT school_id) AS count
        FROM 
          right_to_play_pip_responses
        WHERE 
          itinerary_id = ?
          AND submitted_at BETWEEN ? AND ?
        GROUP BY 
          month
        ORDER BY 
          month
      `, [itineraryId, itinerary.from_date, itinerary.until_date]);

      // Convert raw data to series format for ApexCharts
      // Fill in zeros for months with no data
      const formatSeriesData = (rawData) => {
        const dataMap = {};
        
        // Initialize with zeros for all months
        months.forEach(month => {
          dataMap[month] = 0;
        });
        
        // Fill in actual counts where available
        rawData.forEach(item => {
          if (months.includes(item.month)) {
            dataMap[item.month] = item.count;
          }
        });
        
        // Convert back to array in correct order
        return months.map(month => dataMap[month]);
      };

      // Format the data for the four series
      const seriesData = {
        schoolOutput: formatSeriesData(schoolOutputData),
        districtOutput: formatSeriesData(districtOutputData),
        consolidatedChecklist: formatSeriesData(checklistData),
        partnersInPlay: formatSeriesData(pipData)
      };

      return NextResponse.json({
        success: true,
        data: {
          categories: monthNames, // X-axis labels
          series: [
            {
              name: 'School Output',
              data: seriesData.schoolOutput
            },
            {
              name: 'District Output',
              data: seriesData.districtOutput
            },
            {
              name: 'Consolidated Checklist',
              data: seriesData.consolidatedChecklist
            },
            {
              name: 'Partners in Play',
              data: seriesData.partnersInPlay
            }
          ]
        }
      });
    } finally {
      await conn.end();
    }
  } catch (error) {
    console.error('Error fetching trend data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch trend data' },
      { status: 500 }
    );
  }
}