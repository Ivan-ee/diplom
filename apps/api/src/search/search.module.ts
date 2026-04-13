import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { SearchService } from './search.service';
import { SearchController } from './search.controller';

@Module({
  imports: [ProductsModule],
  providers: [SearchService],
  controllers: [SearchController],
  exports: [SearchService],
})
export class SearchModule {}
