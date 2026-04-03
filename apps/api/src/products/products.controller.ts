import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { QueryProductsDto } from './dto/query-products.dto';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'List products with filters and pagination' })
  findAll(@Query() query: QueryProductsDto) {
    return this.productsService.findAll(query);
  }

  @Get(':slug')
  @ApiParam({ name: 'slug', description: 'Product URL slug' })
  @ApiOperation({ summary: 'Get a single product by slug' })
  findOne(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }
}
