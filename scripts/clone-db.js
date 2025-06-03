const mysql = require('mysql2/promise');
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  mysql: {
    host: 'field.msrcghana.org',
    user: 'forge',
    password: 'qv0NqfPLRLPEtMHm4snH',
    database: 'field_msrcghana_db',
    port: 3306,
    // Add SSL configuration if needed
    ssl: {
      rejectUnauthorized: false
    }
  },
  sqlite: {
    filename: path.join(__dirname, '../msrc-dev.db')
  },
  // Tables to include and row limits
  tables: {
    users: 100,
    sessions: 1000,
    verification_tokens: 100,
    accounts: 100,
    // Add other tables you need
  }
};

async function cloneDatabase() {
  // Remove existing SQLite DB if it exists
  if (fs.existsSync(config.sqlite.filename)) {
    fs.unlinkSync(config.sqlite.filename);
  }

  // Create SQLite database
  const sqlite = sqlite3(config.sqlite.filename);
  let connection;
  
  try {
    // Connect to MySQL
    connection = await mysql.createConnection({
      ...config.mysql,
      ssl: config.mysql.ssl ? config.mysql.ssl : undefined
    });
    console.log('Connected to MySQL database');
    
    // Enable foreign keys in SQLite
    sqlite.pragma('foreign_keys = ON');
    
    // Get table structures
    const [tables] = await connection.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [config.mysql.database]);
    
    // Create each table in SQLite
    for (const table of tables) {
      const tableName = table.TABLE_NAME || table.table_name;
      
      // Skip tables not in our config
      if (Object.keys(config.tables).length > 0 && !(tableName in config.tables)) {
        console.log(`Skipping table: ${tableName} (not in config)`);
        continue;
      }
      
      console.log(`Processing table: ${tableName}`);
      
      try {
        // Get table structure
        const [createTable] = await connection.query(`
          SHOW CREATE TABLE \`${tableName}\`
        `);
        
        let createStatement = createTable[0]['Create Table'];
        
        // Modify MySQL syntax to be SQLite compatible
        createStatement = createStatement
          .replace(/AUTO_INCREMENT/g, 'AUTOINCREMENT')
          .replace(/int\(\d+\)/g, 'INTEGER')
          .replace(/varchar\(\d+\)/g, 'TEXT')
          .replace(/datetime/g, 'TEXT')
          .replace(/timestamp/g, 'TEXT')
          .replace(/ENGINE=\w+/g, '')
          .replace(/DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP/g, 'DEFAULT CURRENT_TIMESTAMP')
          .replace(/CHARACTER SET \w+/g, '')
          .replace(/COLLATE \w+/g, '')
          .replace(/,\s*PRIMARY KEY \(`id`\)/g, '')
          .replace(/,\s*UNIQUE KEY `.*?` \(`.*?`\)/g, '')
          .replace(/,\s*KEY `.*?` \(`.*?`\)/g, '')
          .replace(/`/g, '"');

        // Add back primary key if it was removed
        if (!createStatement.includes('PRIMARY KEY') && createStatement.includes('"id" INTEGER')) {
          createStatement = createStatement.replace(
            /("id" INTEGER[^,]*)/,
            '$1 PRIMARY KEY AUTOINCREMENT'
          );
        }
        
        // Create the table in SQLite
        sqlite.exec(createStatement);
        console.log(`  ✓ Created table structure for ${tableName}`);
        
        try {
          // Get limited data from MySQL
          const limit = config.tables[tableName] || 100;
          const [rows] = await connection.query(`
            SELECT * FROM \`${tableName}\` 
            ORDER BY ${tableName.includes('created') ? 'created_at DESC' : 'id'} 
            LIMIT ${limit}
          `);
          
          if (rows && rows.length > 0) {
            // Get column names
            const columns = Object.keys(rows[0]);
            const placeholders = columns.map(() => '?').join(', ');
            
            // Prepare the insert statement
            const stmt = sqlite.prepare(`
              INSERT OR IGNORE INTO "${tableName}" 
              (${columns.map(c => `"${c}"`).join(', ')})
              VALUES (${placeholders})
            `);
            
            // Insert rows in a transaction
            const insert = sqlite.transaction((items) => {
              for (const item of items) {
                try {
                  stmt.run(columns.map(col => item[col]));
                } catch (err) {
                  console.error(`Error inserting row into ${tableName}:`, err.message);
                }
              }
            });
            
            insert(rows);
            console.log(`  ✓ Inserted ${rows.length} rows into ${tableName}`);
          } else {
            console.log(`  ✓ No data to insert for ${tableName}`);
          }
        } catch (error) {
          console.error(`  ✗ Error copying data for ${tableName}:`, error.message);
        }
      } catch (error) {
        console.error(`  ✗ Error creating table ${tableName}:`, error.message);
      }
    }
    
    console.log('\nDatabase clone complete!');
    console.log(`SQLite database saved to: ${path.resolve(config.sqlite.filename)}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close connections
    if (sqlite) {
      try {
        sqlite.close();
      } catch (e) {
        console.error('Error closing SQLite:', e.message);
      }
    }
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error('Error closing MySQL connection:', e.message);
      }
    }
  }
}

// Run the clone
cloneDatabase().catch(console.error);