import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SearchService, SearchHit } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  @ApiOperation({ summary: 'Full-text product search via Meilisearch' })
  @ApiResponse({ status: 200, description: 'List of matching products with highlighted names' })
  search(@Query() query: SearchQueryDto): Promise<SearchHit[]> {
    return this.searchService.search(query.q, query.limit);
  }
}
