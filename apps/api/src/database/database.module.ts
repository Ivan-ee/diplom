import { Global, Inject, Logger, Module, OnModuleDestroy } from '@nestjs/common';
import { Pool } from 'pg';
import { PoolProvider, DatabaseProvider, POOL } from './database.provider';
import { DRIZZLE } from './drizzle.token';

@Global()
@Module({
  providers: [PoolProvider, DatabaseProvider],
  exports: [DRIZZLE],
})
export class DatabaseModule implements OnModuleDestroy {
  private readonly logger = new Logger(DatabaseModule.name);

  constructor(@Inject(POOL) private readonly pool: Pool) {}

  async onModuleDestroy() {
    await this.pool.end();
    this.logger.log('Database pool closed');
  }
}
