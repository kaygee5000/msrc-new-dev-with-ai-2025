export const runtime = 'nodejs';

import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';
import { Buffer } from 'buffer';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const itineraryId = searchParams.get('itineraryId');
  const schoolType = searchParams.get('schoolType');
  const surveyType = searchParams.get('surveyType');

  // Fetch outcome data using correct server origin and disable caching
  const outcomeRes = await fetch(
    `${new URL(req.url).origin}/api/rtp/export/outcome?itineraryId=${itineraryId}&schoolType=${schoolType}&surveyType=${surveyType}`,
    { cache: 'no-store' }
  );
  const { data: outcomeData } = await outcomeRes.json();

  // Create workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'msrc-app';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Outcome Indicators');
  sheet.columns = [
    { header: 'School Name', key: 'schoolName', width: 30 },
    { header: 'Question', key: 'indicator', width: 50 },
    { header: 'Response', key: 'responseValue', width: 20 }
  ];

  sheet.addRows(outcomeData);

  // Generate buffer and convert to Node Buffer
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const date = new Date().toISOString().split('T')[0];

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="rtp-outcome-${date}.xlsx"`
    }
  });
}