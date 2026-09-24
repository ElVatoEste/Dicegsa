import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { MetricsService } from './metrics.service';

const DAY = /^\d{4}-\d{2}-\d{2}$/;

@Controller('metrics')
@UseGuards(JwtGuard)
@Roles('supervisor', 'management', 'admin')
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get()
  compute(@Query('from') from: string, @Query('to') to: string) {
    if (!DAY.test(from ?? '') || !DAY.test(to ?? '') || from > to) {
      throw new BadRequestException('El período tiene que ser from y to en AAAA-MM-DD, con from antes que to');
    }
    return this.metrics.compute({ from, to });
  }
}
