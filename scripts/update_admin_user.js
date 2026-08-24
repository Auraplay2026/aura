const { Pool } = require('pg');

const dbUrl = process.env.DATABASE_URL || "postgresql://postgres.ipzqtmbxzoooimbcowcm:Siddiqui%40009@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres";
const isLocal = !dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

const pool = new Pool({
  connectionString: dbUrl,
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, username, email, role, balance FROM "User";');
    console.log("Current Database Users:");
    res.rows.forEach(u => console.log(` - ID: ${u.id} | User: ${u.username} | Email: ${u.email} | Role: ${u.role}`));

    // Update old admin to auraplay2026
    await client.query(`
      UPDATE "User"
      SET email = 'auraplay2026@gmail.com', username = 'auraplay2026'
      WHERE email LIKE '%twintubrov%' OR email LIKE '%siddiqui%';
    `);

    const updatedRes = await client.query('SELECT id, username, email, role, balance FROM "User";');
    console.log("\nUpdated Database Users:");
    updatedRes.rows.forEach(u => console.log(` - ID: ${u.id} | User: ${u.username} | Email: ${u.email} | Role: ${u.role}`));
    console.log("\n✅ Admin user updated to auraplay2026@gmail.com successfully!");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
