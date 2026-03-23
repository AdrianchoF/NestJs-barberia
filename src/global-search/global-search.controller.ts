import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { GlobalSearchService } from './global-search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('global-search')
@UseGuards(JwtAuthGuard)
export class GlobalSearchController {
  constructor(private readonly globalSearchService: GlobalSearchService) {}

  @Get()
  async search(@Query('q') query: string, @Req() req: any) {
    const userRole = req.user.role;
    return this.globalSearchService.search(query, userRole);
  }
}
