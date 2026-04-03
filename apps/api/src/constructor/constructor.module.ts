import { Module } from '@nestjs/common';
import { ConstructorService } from './constructor.service';
import { ConstructorController } from './constructor.controller';

@Module({
  providers: [ConstructorService],
  controllers: [ConstructorController],
  exports: [ConstructorService],
})
export class ConstructorModule {}
