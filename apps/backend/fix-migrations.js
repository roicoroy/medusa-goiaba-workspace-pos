const { Client } = require('pg');

async function fix() {
  const client = new Client({
    connectionString: 'postgres://admin:password@localhost:5432/medusa_db'
  });
  await client.connect();
  
  // delete migrations created today (20260828)
  const res = await client.query("DELETE FROM mikro_orm_migrations WHERE name LIKE 'Migration20260828%' RETURNING name");
  console.log('Deleted migrations:', res.rows.map(r => r.name));
  
  // also drop tables if they partially exist to have a clean slate
  await client.query("DROP TABLE IF EXISTS pos_pos_session_order_order CASCADE;");
  await client.query("DROP TABLE IF EXISTS user_user_pos_pos_session CASCADE;");
  await client.query("DROP TABLE IF EXISTS pos_report CASCADE;");
  await client.query("DROP TABLE IF EXISTS pos_session CASCADE;");
  await client.query("DROP TABLE IF EXISTS cash_register CASCADE;");
  
  console.log('Dropped tables successfully');
  
  await client.end();
}

fix().catch(console.error);
