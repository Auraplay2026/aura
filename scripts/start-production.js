// Production Entrypoint Runner for Render.com, Cloud VPS, and Docker
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Global error handlers to prevent unhandled rejections from crashing the web server
process.on('uncaughtException', (err) => {
  console.error('[Production Master UncaughtException]:', err?.stack || err?.message || err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Production Master UnhandledRejection]:', reason);
});

// Load local environment files if present (fallback for local dev / non-container runs)
const dotenvPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '.env.local'),
  path.join(process.cwd(), '.env'),
  path.join(process.cwd(), '.env.local')
];
for (const envPath of dotenvPaths) {
  if (fs.existsSync(envPath)) {
    try {
      const envText = fs.readFileSync(envPath, 'utf8');
      envText.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const eqIdx = trimmed.indexOf('=');
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
            if (!process.env[key]) {
              process.env[key] = val;
            }
          }
        }
      });
    } catch (e) {}
  }
}

const port = parseInt(process.env.PORT || '3000', 10);
const host = process.env.HOSTNAME || '0.0.0.0';

console.log(`========================================================`);
console.log(`🚀 AURAPLAY PRODUCTION RUNNER STARTING`);
console.log(`📡 Host: ${host} | Port: ${port}`);
console.log(`📂 Working Directory: ${process.cwd()}`);
console.log(`⚙️ Node Version: ${process.version}`);
console.log(`========================================================`);

// 1. Ensure persistent data directories and template files are initialized safely
try {
  console.log('[Production Runner] Step 1/3: Initializing persistent template data...');
  require('./initialize-persistent-data.js');
} catch (err) {
  console.warn('[Production Runner Warning] Persistent data init encountered an issue, continuing:', err.message);
}

// 2. Non-blocking database schema push and admin seeding in background
function runDatabaseSetup() {
  if (!process.env.DATABASE_URL) {
    console.log('[Production Runner] DATABASE_URL not present, skipping prisma db push.');
    return;
  }

  console.log('[Production Runner] Background Task: Checking database schema...');
  
  // Locate prisma cli
  const possiblePrismaBins = [
    path.resolve(__dirname, '../node_modules/prisma/build/index.js'),
    path.resolve(process.cwd(), 'node_modules/prisma/build/index.js')
  ];
  const prismaBin = possiblePrismaBins.find((p) => fs.existsSync(p));

  const prismaCommand = prismaBin ? process.execPath : 'npx';
  const prismaArgs = prismaBin ? [prismaBin, 'db', 'push', '--accept-data-loss'] : ['prisma', 'db', 'push', '--accept-data-loss'];

  const prismaPush = spawn(prismaCommand, prismaArgs, {
    stdio: 'inherit',
    shell: !prismaBin,
    env: process.env
  });

  prismaPush.on('close', (code) => {
    if (code === 0) {
      console.log('[Production Runner] Database schema synced successfully.');
      // Enforce Supabase Row Level Security
      try {
        require('./enable-supabase-rls.js');
      } catch (e) {
        console.warn('[Production Runner] RLS enforcement note:', e.message);
      }
      // Run admin seed
      try {
        require('../create_admin.js');
      } catch (e) {
        console.warn('[Production Runner] Admin seeding issue:', e.message);
      }
    } else {
      console.warn(`[Production Runner Warning] prisma db push completed with status ${code}. Web server active.`);
    }
  });

  prismaPush.on('error', (err) => {
    console.warn('[Production Runner Warning] Could not run prisma db push:', err.message);
  });
}

// Run DB setup in background after 200ms
setTimeout(runDatabaseSetup, 200);

// 3. Start background worker daemons safely with auto-restart protection
const workers = [
  { name: 'Hype Bets Generator', script: './scripts/generate_hype_bets.js' },
  { name: 'Notification Worker', script: './scripts/notification_worker.js' },
  { name: 'Sports Settlement Worker', script: './scripts/sports_settlement_worker.js' }
];

const spawnedProcesses = [];

workers.forEach(({ name, script }) => {
  const fullPath = path.resolve(process.cwd(), script);
  if (fs.existsSync(fullPath)) {
    console.log(`[Production Runner] Launching background daemon: ${name}`);
    const workerProc = spawn(process.execPath, ['--max-old-space-size=256', fullPath], {
      stdio: ['ignore', 'pipe', 'pipe'],
      env: process.env
    });

    workerProc.stdout.on('data', () => {});
    workerProc.stderr.on('data', (d) => {
      console.warn(`[${name} Warning]:`, d.toString().trim());
    });
    workerProc.on('error', (err) => {
      console.warn(`[${name} Process Error]:`, err.message);
    });
    workerProc.on('exit', (code, signal) => {
      console.log(`[${name}] Daemon exited with code ${code}, signal ${signal}`);
    });

    spawnedProcesses.push(workerProc);
  }
});

// 4. Start Next.js Production Server directly via Node
console.log(`[Production Runner] Step 2/3: Launching Next.js on ${host}:${port}...`);

const possibleNextBins = [
  path.resolve(__dirname, '../node_modules/next/dist/bin/next'),
  path.resolve(process.cwd(), 'node_modules/next/dist/bin/next')
];
const nextBinPath = possibleNextBins.find((p) => fs.existsSync(p));

const nextCommand = nextBinPath ? process.execPath : 'npx';
const nextArgs = nextBinPath
  ? [nextBinPath, 'start', '-H', host, '-p', String(port)]
  : ['next', 'start', '-H', host, '-p', String(port)];

const nextStart = spawn(nextCommand, nextArgs, {
  stdio: 'inherit',
  shell: !nextBinPath,
  env: {
    ...process.env,
    PORT: String(port),
    HOSTNAME: host
  }
});

spawnedProcesses.push(nextStart);

// Handle graceful shutdown
const shutdown = (signal) => {
  console.log(`[Production Runner] Received ${signal}. Gracefully stopping processes...`);
  spawnedProcesses.forEach((p) => {
    try {
      p.kill('SIGTERM');
    } catch (e) {}
  });
  setTimeout(() => {
    process.exit(0);
  }, 1000);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

nextStart.on('close', (code) => {
  console.log(`[Production Runner] Next.js server exited with code ${code}`);
  process.exit(code || 0);
});

