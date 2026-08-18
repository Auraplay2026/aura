// Production Entrypoint Runner for Render.com and Cloud VPS
const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const port = process.env.PORT || 3000;
const host = '0.0.0.0';

console.log(`[Production Runner] Initializing server on ${host}:${port}...`);

// 1. Ensure persistent data directories and template files are initialized
try {
  console.log('[Production Runner] Step 1/3: Initializing persistent template data...');
  require('./initialize-persistent-data.js');
} catch (err) {
  console.warn('[Production Runner Warning] Persistent data init encountered an issue, continuing:', err.message);
}

// 2. Non-blocking database schema push and admin seeding
function runDatabaseSetup() {
  if (!process.env.DATABASE_URL) {
    console.log('[Production Runner] DATABASE_URL not present, skipping prisma db push.');
    return;
  }
  
  console.log('[Production Runner] Step 2/3: Checking database schema...');
  const prismaPush = spawn('npx', ['prisma', 'db', 'push', '--accept-data-loss'], {
    stdio: 'inherit',
    shell: true,
    env: process.env
  });

  prismaPush.on('close', (code) => {
    if (code === 0) {
      console.log('[Production Runner] Database schema synced successfully.');
      // Run admin seed
      try {
        require('../create_admin.js');
      } catch (e) {
        console.warn('[Production Runner] Admin seeding issue:', e.message);
      }
    } else {
      console.warn(`[Production Runner Warning] prisma db push exited with code ${code}. Web server remains active.`);
    }
  });

  prismaPush.on('error', (err) => {
    console.warn('[Production Runner Warning] Could not run prisma db push:', err.message);
  });
}

// Run DB setup in background so Next.js can bind to PORT immediately
setTimeout(runDatabaseSetup, 100);

// 3. Start background worker daemons safely
const workers = [
  { name: 'Hype Bets Generator', script: './scripts/generate_hype_bets.js' },
  { name: 'Notification Worker', script: './scripts/notification_worker.js' },
  { name: 'Sports Settlement Worker', script: './scripts/sports_settlement_worker.js' }
];

const spawnedProcesses = [];

workers.forEach(({ name, script }) => {
  const fullPath = path.resolve(process.cwd(), script);
  if (fs.existsSync(fullPath)) {
    console.log(`[Production Runner] Spawning background worker: ${name}`);
    const workerProc = spawn('node', [fullPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env
    });

    workerProc.stdout.on('data', (d) => {
      // Optional logging or prefixing
    });
    workerProc.stderr.on('data', (d) => {
      console.warn(`[${name} ERR]:`, d.toString().trim());
    });
    workerProc.on('error', (err) => {
      console.warn(`[${name} Failure]:`, err.message);
    });

    spawnedProcesses.push(workerProc);
  }
});

// 4. Start Next.js Production Server
console.log(`[Production Runner] Step 3/3: Launching Next.js on ${host}:${port}...`);
const nextStart = spawn('npx', ['next', 'start', '-H', host, '-p', String(port)], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PORT: String(port),
    HOSTNAME: host
  }
});

spawnedProcesses.push(nextStart);

// Handle graceful shutdown
const shutdown = (signal) => {
  console.log(`[Production Runner] Received ${signal}. Shutting down services...`);
  spawnedProcesses.forEach((p) => {
    try {
      p.kill('SIGTERM');
    } catch (e) {}
  });
  process.exit(0);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

nextStart.on('close', (code) => {
  console.log(`[Production Runner] Next.js server exited with code ${code}`);
  process.exit(code || 0);
});
