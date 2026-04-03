import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
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
  getIngredients() {
    return this.constructorService.getIngredients();
  }

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate total price for a given cake configuration',
  })
  calculatePrice(@Body() dto: CalculatePriceDto) {
    return this.constructorService.calculatePrice(dto);
  }
}
