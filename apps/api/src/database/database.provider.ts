import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '@bakery/db/schema';
import { DRIZZLE } from './drizzle.token';

export const POOL = Symbol('PG_POOL');

export const PoolProvider = {
  provide: POOL,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Pool => {
    const pool = new Pool({
      connectionString: config.getOrThrow<string>('DATABASE_URL'),
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

    const logger = new Logger('DatabasePool');
    pool.on('error', (err) => {
      logger.error('Unexpected database pool error', err.stack);
    });

    return pool;
  },
};

export const DatabaseProvider = {
  provide: DRIZZLE,
  inject: [POOL],
  useFactory: (pool: Pool): NodePgDatabase<typeof schema> => {
    return drizzle(pool, { schema });
  },
};
