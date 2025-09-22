const { Pool } = require('pg');

console.log('Connection config:');
console.log('- User:', process.env.PG_USER || 'postgres');
console.log('- Host:', process.env.PG_HOST || 'localhost');
console.log('- Database:', process.env.PG_DB || 'soinech_chat');
console.log('- Password:', process.env.PG_PASSWORD ? '[SET]' : '[DEFAULT: postgres]');
console.log('- Port:', Number(process.env.PG_PORT || 5432));

// Create a connection pool with the same config as your main app
const pool = new Pool({
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DB || 'soinech_chat',
  password: process.env.PG_PASSWORD || 'postgres',
  port: Number(process.env.PG_PORT || 5432)
});

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Test basic connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL successfully!');
    
    // Test database and tables
    const result = await client.query('SELECT version()');
    console.log('📊 PostgreSQL version:', result.rows[0].version);
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables found:');
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Test inserting a sample user (optional)
    const insertResult = await client.query(`
      INSERT INTO users (name, email) 
      VALUES ('Test User', 'test@example.com') 
      ON CONFLICT (email) DO NOTHING 
      RETURNING id, name, email;
    `);
    
    if (insertResult.rows.length > 0) {
      console.log('✅ Sample user created:', insertResult.rows[0]);
    } else {
      console.log('ℹ️  Sample user already exists');
    }
    
    client.release();
    console.log('🎉 Database setup is complete and working!');
    
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    console.error('Full error:', err);
  } finally {
    await pool.end();
  }
}

testConnection();