import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ConstructorModule } from '../constructor/constructor.module';
import { PromoCodesModule } from '../promo-codes/promo-codes.module';

@Module({
  imports: [ConstructorModule, PromoCodesModule],
  providers: [OrdersService],
  controllers: [OrdersController],
  exports: [OrdersService],
})
export class OrdersModule {}
