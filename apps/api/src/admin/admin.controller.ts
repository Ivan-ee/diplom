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
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { DeleteIngredientDto } from './dto/delete-ingredient.dto';
import { QueryOrdersDto } from './dto/query-orders.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddOrderItemDto } from './dto/add-order-item.dto';
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

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard statistics (admin)' })
  @ApiResponse({ status: 200, description: 'Dashboard stats' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  getStats() {
    return this.adminService.getStats();
  }

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

  @Put('orders/:id')
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOperation({ summary: 'Update order details (admin)' })
  @ApiResponse({ status: 200, description: 'Order updated' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  updateOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderDto,
  ) {
    return this.adminService.updateOrder(id, dto);
  }

  @Post('orders/:orderId/items')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiOperation({ summary: 'Add item to order (admin)' })
  @ApiResponse({ status: 201, description: 'Item added, total recalculated' })
  @ApiResponse({ status: 404, description: 'Order or product not found' })
  addOrderItem(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: AddOrderItemDto,
  ) {
    return this.adminService.addOrderItem(orderId, dto);
  }

  @Delete('orders/:orderId/items/:itemId')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'orderId', description: 'Order UUID' })
  @ApiParam({ name: 'itemId', description: 'Order item UUID' })
  @ApiOperation({ summary: 'Remove item from order (admin)' })
  @ApiResponse({ status: 200, description: 'Item removed, total recalculated' })
  @ApiResponse({ status: 404, description: 'Order or item not found' })
  deleteOrderItem(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.adminService.deleteOrderItem(orderId, itemId);
  }

  @Delete('orders/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiOperation({ summary: 'Cancel an order (admin)' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel completed/cancelled order' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  deleteOrder(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.deleteOrder(id);
  }

  @Get('categories')
  @ApiOperation({ summary: 'List all product categories (admin)' })
  @ApiResponse({ status: 200, description: 'Category list' })
  getCategories() {
    return this.adminService.getAllCategories();
  }

  @Get('products')
  @ApiOperation({ summary: 'List all products with pagination (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated product list' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden — admin role required' })
  getAllProducts(@Query() pagination: PaginationDto) {
    return this.adminService.getAllProducts(pagination);
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

  @Get('constructor/ingredients')
  @ApiOperation({ summary: 'Get all constructor ingredients including unavailable (admin)' })
  @ApiResponse({ status: 200, description: 'All ingredients grouped by type' })
  getAdminIngredients() {
    return this.adminService.getAdminIngredients();
  }

  @Post('constructor/ingredients')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new constructor ingredient (admin)' })
  @ApiResponse({ status: 201, description: 'Ingredient created' })
  @ApiResponse({ status: 400, description: 'Invalid ingredient data' })
  createIngredient(@Body() dto: CreateIngredientDto) {
    return this.adminService.createIngredient(dto);
  }

  @Delete('constructor/ingredients/:id')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Ingredient UUID' })
  @ApiOperation({ summary: 'Delete a constructor ingredient (admin)' })
  @ApiResponse({ status: 200, description: 'Ingredient deleted' })
  @ApiResponse({ status: 404, description: 'Ingredient not found' })
  deleteIngredient(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DeleteIngredientDto,
  ) {
    return this.adminService.deleteIngredient(id, dto);
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

  @Get('users')
  @ApiOperation({ summary: 'List all users with pagination (admin)' })
  @ApiQuery({ name: 'role', required: false, enum: ['user', 'admin'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  getAllUsers(@Query() query: QueryUsersDto) {
    return this.adminService.getAllUsers(query);
  }

  @Get('users/:id')
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOperation({ summary: 'Get user details (admin)' })
  @ApiResponse({ status: 200, description: 'User details with order count' })
  @ApiResponse({ status: 404, description: 'User not found' })
  getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id')
  @ApiParam({ name: 'id', description: 'User UUID' })
  @ApiOperation({ summary: 'Update user role/name/phone (admin)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  @ApiResponse({ status: 404, description: 'User not found' })
  updateUser(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }
}
