import { Global, Module } from '@nestjs/common';
import { DatabaseProvider } from './database.provider';
import { DRIZZLE } from './drizzle.token';

@Global()
@Module({
  providers: [DatabaseProvider],
  exports: [DRIZZLE],
})
export class DatabaseModule {}
