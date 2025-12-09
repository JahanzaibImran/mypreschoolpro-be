import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
config({ path: ['.env.local', '.env'] });

async function checkDatabaseConnection() {
  try {
    const dataSource = new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
    });

    // Parse DATABASE_URL to extract connection details
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL is not set in environment variables');
      console.log('\n📝 Please set DATABASE_URL in your .env or .env.local file');
      process.exit(1);
    }

    // Parse PostgreSQL connection string
    // Format: postgresql://user:password@host:port/database
    const urlPattern = /postgres(ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/;
    const match = dbUrl.match(urlPattern);

    if (match) {
      const [, , user, password, host, port, database] = match;
      console.log('\n📊 Database Connection Information:');
      console.log('═'.repeat(50));
      console.log(`  Database Name: ${database}`);
      console.log(`  Host:          ${host}`);
      console.log(`  Port:          ${port}`);
      console.log(`  User:          ${user}`);
      console.log(`  Password:      ${'*'.repeat(password.length)}`);
      console.log('═'.repeat(50));
    } else {
      console.log('\n📊 Database Connection String:');
      console.log(`  ${dbUrl.replace(/:[^:@]+@/, ':****@')}`); // Hide password
    }

    // Try to connect and get actual database name
    console.log('\n🔌 Attempting to connect...');
    await dataSource.initialize();

    const result = await dataSource.query('SELECT current_database() as database_name, version() as version');
    console.log('\n✅ Connection Successful!');
    console.log('═'.repeat(50));
    console.log(`  Connected Database: ${result[0].database_name}`);
    console.log(`  PostgreSQL Version: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}`);
    
    // Get table count
    const tableCount = await dataSource.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`  Tables in 'public' schema: ${tableCount[0].count}`);
    
    console.log('═'.repeat(50));

    await dataSource.destroy();
  } catch (error) {
    console.error('\n❌ Connection Failed:');
    console.error(error.message);
    console.log('\n💡 Check your DATABASE_URL in .env or .env.local file');
    process.exit(1);
  }
}

checkDatabaseConnection();

