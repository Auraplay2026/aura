import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let rawConnectionString = process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy";

// Automatically URL-encode unencoded special characters in password if present
const isLocal = !rawConnectionString || rawConnectionString.includes('localhost') || rawConnectionString.includes('127.0.0.1');

// Strip ?sslmode=... so pg does not override rejectUnauthorized: false on Supabase self-signed certs
let connectionString = rawConnectionString.replace(/([?&])sslmode=[^&]+(&|$)/, '$1').replace(/[?&]$/, '');

const pool = new Pool({
  connectionString,
  max: process.env.NODE_ENV === 'production' ? 5 : 2,
  idleTimeoutMillis: 20000,
  connectionTimeoutMillis: 10000,
  ssl: isLocal ? false : { rejectUnauthorized: false },
})

pool.on('error', (err) => {
  console.warn('[Prisma PG Pool Warning]:', err?.message || err);
});

const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

