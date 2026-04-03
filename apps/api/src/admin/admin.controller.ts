import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
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

  @Get('orders')
  @ApiOperation({ summary: 'List all orders with pagination (admin)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by order status' })
  @ApiResponse({ status: 200, description: 'Paginated order list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  getAllOrders(
    @Query() pagination: PaginationDto,
    @Query() statusQuery: QueryOrdersDto,
  ) {
    return this.adminService.getAllOrders({ ...pagination, status: statusQuery.status });
  }

  @Get('orders/:id')
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOperation({ summary: 'Get a single order with items and user (admin)' })
  @ApiResponse({ status: 200, description: 'Order detail with items and user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getOrderById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getOrderById(id);
  }

  @Put('orders/:id/status')
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOperation({ summary: 'Update order status with state machine validation (admin)' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 400, description: 'Invalid status transition' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.adminService.updateOrderStatus(id, dto);
  }

  @Post('products')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new product (admin)' })
  @ApiResponse({ status: 201, description: 'Product created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Product slug already exists' })
  createProduct(@Body() dto: CreateProductDto) {
    return this.adminService.createProduct(dto);
  }

  @Put('products/:id')
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOperation({ summary: 'Update a product (admin)' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Slug already taken by another product' })
  updateProduct(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProductDto) {
    return this.adminService.updateProduct(id, dto);
  }

  @Delete('products/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOperation({ summary: 'Delete a product (admin)' })
  @ApiResponse({ status: 200, description: 'Product deleted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  deleteProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteProduct(id);
  }

  @Put('constructor/ingredients/:id')
  @ApiParam({ name: 'id', description: 'Ingredient UUID' })
  @ApiOperation({
    summary: 'Update constructor ingredient price or availability (admin)',
  })
  @ApiResponse({ status: 200, description: 'Ingredient updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Ingredient not found' })
  updateIngredient(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateIngredientDto) {
    return this.adminService.updateIngredient(id, dto);
  }
}
