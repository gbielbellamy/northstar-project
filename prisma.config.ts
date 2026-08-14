import 'dotenv/config'

import { defineConfig, env } from 'prisma/config'

// Prisma 7 keeps the connection string out of the schema file. Migrations read
// it from here; the client gets it through an adapter at runtime.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
})
