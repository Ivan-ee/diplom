import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@bakery/db/schema';
import { DRIZZLE } from './drizzle.token';

export const DatabaseProvider = {
  provide: DRIZZLE,
  inject: [ConfigService],
  useFactory: (config: ConfigService): NodePgDatabase<typeof schema> => {
    const connectionString = config.getOrThrow<string>('DATABASE_URL');

    const pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    return drizzle(pool, { schema });
  },
};
