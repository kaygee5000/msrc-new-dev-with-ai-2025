import ExcelJS from 'exceljs';
import { NextResponse } from 'next/server';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const itineraryId = searchParams.get('itineraryId');
  const schoolType = searchParams.get('schoolType');
  const level = searchParams.get('level');

  // reuse mock or real query logic
  // For brevity, import output route logic and regenerate exportData array
  const { data: exportData } = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/rtp/export/output?itineraryId=${itineraryId}&schoolType=${schoolType}&level=${level}`).then(r => r.json());

  // Generate workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'msrc-app';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Output Indicators');
  sheet.columns = [
    { header: 'Level', key: 'level', width: 20 },
    { header: 'School Name', key: 'schoolName', width: 30 },
    { header: 'District', key: 'district', width: 30 },
    { header: 'Region', key: 'region', width: 20 },
    { header: 'Indicator', key: 'indicator', width: 40 },
    { header: 'Value', key: 'value', width: 10 },
    { header: 'Category ID', key: 'categoryId', width: 20 },
    { header: 'Gender', key: 'gender', width: 10 },
    { header: 'Submission Date', key: 'submissionDate', width: 15 }
  ];

  sheet.addRows(exportData);

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().split('T')[0];

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="rtp-output-${date}.xlsx"`
    }
  });
}