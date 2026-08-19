// Supabase Security Hardening: Enable Row-Level Security (RLS) on all public tables
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// 1. Load environment variables
const dotenvPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '.env.local'),
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../.env.local'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local')
];

for (const envPath of dotenvPaths) {
  if (fs.existsSync(envPath)) {
    const envText = fs.readFileSync(envPath, 'utf8');
    envText.split(/\r?\n/).forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
          if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
          if (!process.env[key]) process.env[key] = val;
        }
      }
    });
  }
}

async function enableRLS() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('[RLS Fix Error] DATABASE_URL is not set.');
    process.exit(1);
  }

  const isLocal = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('[RLS Fix] Connecting to PostgreSQL database...');
    const client = await pool.connect();
    
    console.log('[RLS Fix] Querying all tables in public schema...');
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE';
    `);

    const tables = res.rows.map(r => r.table_name);
    console.log(`[RLS Fix] Found ${tables.length} table(s) in public schema:`, tables);

    for (const table of tables) {
      console.log(`[RLS Fix] Enabling Row-Level Security on public."${table}"...`);
      await client.query(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
      
      // Revoke public anon access on PostgREST API
      await client.query(`REVOKE ALL ON public."${table}" FROM anon;`).catch(e => {
        // 'anon' role might not exist on non-Supabase local postgres
      });
      await client.query(`REVOKE ALL ON public."${table}" FROM authenticated;`).catch(e => {
        // 'authenticated' role might not exist on non-Supabase local postgres
      });
    }

    // Verify RLS status on all tables
    const verifyRes = await client.query(`
      SELECT relname AS table_name, relrowsecurity AS rls_enabled
      FROM pg_class
      JOIN pg_namespace ON pg_namespace.oid = pg_class.relnamespace
      WHERE pg_namespace.nspname = 'public' AND pg_class.relkind = 'r';
    `);

    console.log('\n[RLS Fix] Verification Summary:');
    console.table(verifyRes.rows);

    client.release();
    console.log('\n[RLS Fix] SUCCESS: Row-Level Security is now strictly enabled across all public tables.');
  } catch (err) {
    console.error('[RLS Fix Error] Failed to enable RLS:', err.message);
  } finally {
    await pool.end();
  }
}

enableRLS();
