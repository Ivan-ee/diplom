import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SafeUser } from '../common/types/user.type';


@ApiTags('Orders')
@ApiBearerAuth()
@ApiCookieAuth('bakery_token')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new order (authenticated)' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Invalid order data or unavailable product' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() dto: CreateOrderDto, @CurrentUser() user: SafeUser) {
    return this.ordersService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: "List current user's orders" })
  @ApiResponse({ status: 200, description: "Current user's order history" })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findAll(@CurrentUser() user: SafeUser) {
    return this.ordersService.findByUser(user.id);
  }
}
