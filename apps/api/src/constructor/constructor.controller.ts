import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ConstructorService } from './constructor.service';
import { CalculatePriceDto } from './dto/calculate.dto';

@ApiTags('Constructor')
@Controller('constructor')
export class ConstructorController {
  constructor(private readonly constructorService: ConstructorService) {}

  @Get('ingredients')
  @ApiOperation({
    summary:
      'Get all available ingredients, shapes, tier surcharges and config',
  })
  @ApiResponse({ status: 200, description: 'Ingredients, shapes and config' })
  getIngredients() {
    return this.constructorService.getIngredients();
  }

  @Post('calculate')
  @Throttle({ default: { ttl: 60000, limit: 300 } })
  @ApiOperation({
    summary: 'Calculate total price for a given cake configuration',
  })
  @ApiResponse({ status: 200, description: 'Calculated price and breakdown' })
  @ApiResponse({ status: 400, description: 'Invalid configuration or unavailable ingredient' })
  calculatePrice(@Body() dto: CalculatePriceDto) {
    return this.constructorService.calculatePrice(dto);
  }
}
