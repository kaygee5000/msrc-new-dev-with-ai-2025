import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT || '3306'),
  ssl: process.env.DB_SSL === 'true' ? {} : false,
};

export async function GET(request) {
  try {
    const connection = await mysql.createConnection(dbConfig);

    // First, let's check what columns exist in the wash table
    const [columns] = await connection.execute("DESCRIBE wash");
    console.log('WASH table columns:', columns);

    // Get a sample of data to understand the structure
    const [sampleData] = await connection.execute("SELECT * FROM wash LIMIT 5");
    console.log('WASH sample data:', sampleData);

    await connection.end();

    return Response.json({
      success: true,
      columns: columns,
      sampleData: sampleData
    });

  } catch (error) {
    console.error('WASH Table Analysis Error:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Failed to analyze WASH table',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

