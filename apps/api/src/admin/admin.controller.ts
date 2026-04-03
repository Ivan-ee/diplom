import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@ApiCookieAuth('bakery_token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ---- Orders ----

  @Get('orders')
  @ApiOperation({ summary: 'List all orders with pagination (admin)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  getAllOrders(
    @Query() pagination: PaginationDto,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllOrders({ ...pagination, status });
  }

  @Get('orders/:id')
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOperation({ summary: 'Get a single order with items and user (admin)' })
  getOrderById(@Param('id') id: string) {
    return this.adminService.getOrderById(id);
  }

  @Put('orders/:id/status')
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOperation({ summary: 'Update order status with state machine validation (admin)' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(id, dto);
  }

  // ---- Products ----

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product (admin)' })
  createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Put('products/:id')
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOperation({ summary: 'Update a product (admin)' })
  updateProduct(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.adminService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOperation({ summary: 'Delete a product (admin)' })
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  // ---- Constructor Ingredients ----

  @Put('constructor/ingredients/:id')
  @ApiParam({ name: 'id', description: 'Ingredient UUID' })
  @ApiOperation({
    summary: 'Update constructor ingredient price or availability (admin)',
  })
  updateIngredient(@Param('id') id: string, @Body() dto: UpdateIngredientDto) {
    return this.adminService.updateIngredient(id, dto);
  }
}
