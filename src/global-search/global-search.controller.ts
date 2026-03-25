import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { GlobalSearchService } from './global-search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/entities/user.entity';

@Controller('global-search')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMINISTRADOR, Role.BARBERO, Role.CLIENTE)
export class GlobalSearchController {
  constructor(private readonly globalSearchService: GlobalSearchService) {}

  @Get()
  async search(@Query('q') query: string, @Req() req: any) {
    const userRole = req.user.role;
    return this.globalSearchService.search(query, userRole);
  }
}
