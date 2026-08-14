import { PrismaClient } from '../../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * One client per warm serverless instance.
 *
 * Each invocation runs in a container that may be reused, and a new
 * PrismaClient per request would open a new pool every time and exhaust the
 * database's connections. Caching it on globalThis survives the reuse, and
 * survives hot reload in development.
 *
 * The connection string must be the pooled one: serverless scales to many
 * concurrent instances, and Postgres will not take a direct connection from
 * each of them.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DATABASE_URL is not set');
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
