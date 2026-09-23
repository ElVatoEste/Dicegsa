import { BadRequestException, Body, Controller, Get, HttpCode, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { TokenPayload } from '../auth/access';
import { requireText } from '../auth/dto';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { StopCausesService } from './stop-causes.service';

@Controller('stop-causes')
@UseGuards(JwtGuard)
export class StopCausesController {
  constructor(private readonly causes: StopCausesService) {}

  /** Abierto a todo rol: el operario elige de este catálogo al registrar una parada. */
  @Get()
  list() {
    return this.causes.list();
  }

  @Post()
  @Roles('admin', 'supervisor')
  create(
    @Req() req: { account: TokenPayload },
    @Body() dto: { name: string; attributable: boolean },
  ) {
    if (typeof dto?.attributable !== 'boolean') {
      throw new BadRequestException('El campo attributable tiene que ser verdadero o falso');
    }
    return this.causes.create(req.account.sub, requireText(dto.name, 'name'), dto.attributable);
  }

  @Post(':id/deactivate')
  @HttpCode(200)
  @Roles('admin', 'supervisor')
  deactivate(@Req() req: { account: TokenPayload }, @Param('id') id: string) {
    return this.causes.setActive(req.account.sub, id, false);
  }

  @Post(':id/reactivate')
  @HttpCode(200)
  @Roles('admin', 'supervisor')
  reactivate(@Req() req: { account: TokenPayload }, @Param('id') id: string) {
    return this.causes.setActive(req.account.sub, id, true);
  }
}
