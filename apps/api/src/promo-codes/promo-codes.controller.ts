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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PromoCodesService } from './promo-codes.service';
import { CreatePromoCodeDto } from './dto/create-promo-code.dto';
import { UpdatePromoCodeDto } from './dto/update-promo-code.dto';
import { ValidatePromoCodeDto } from './dto/validate-promo-code.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SafeUser } from '../common/types/user.type';

@ApiTags('Promo Codes')
@Controller('promo-codes')
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiCookieAuth('bakery_token')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new promo code (admin only)' })
  @ApiResponse({ status: 201, description: 'Promo code created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 409, description: 'Promo code already exists' })
  create(@Body() dto: CreatePromoCodeDto) {
    return this.promoCodesService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiCookieAuth('bakery_token')
  @ApiOperation({ summary: 'List all promo codes with pagination (admin only)' })
  @ApiResponse({ status: 200, description: 'Paginated list of promo codes' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.promoCodesService.findAll({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiCookieAuth('bakery_token')
  @ApiOperation({ summary: 'Update a promo code (admin only)' })
  @ApiResponse({ status: 200, description: 'Promo code updated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Promo code not found' })
  @ApiResponse({ status: 409, description: 'Code already exists' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePromoCodeDto,
  ) {
    return this.promoCodesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @ApiBearerAuth()
  @ApiCookieAuth('bakery_token')
  @ApiOperation({ summary: 'Deactivate a promo code (admin only)' })
  @ApiResponse({ status: 200, description: 'Promo code deactivated' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Promo code not found' })
  deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.promoCodesService.deactivate(id);
  }

  @Post('validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiCookieAuth('bakery_token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate a promo code for current cart (authenticated)' })
  @ApiResponse({ status: 200, description: 'Validation result (valid or invalid with reason)' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  validate(@Body() dto: ValidatePromoCodeDto, @CurrentUser() user: SafeUser) {
    return this.promoCodesService.validate(dto.code, dto.cartTotal, user.id);
  }
}
