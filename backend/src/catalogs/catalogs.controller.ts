import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { TokenPayload } from '../auth/access';
import { requireText } from '../auth/dto';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { catalogKind } from '../db/schema';
import { CatalogsService, type CatalogKind } from './catalogs.service';

function requireKind(kind: string): CatalogKind {
  if (!catalogKind.enumValues.includes(kind as CatalogKind)) {
    throw new BadRequestException('No existe ese catálogo');
  }
  return kind as CatalogKind;
}

@Controller()
@UseGuards(JwtGuard)
export class CatalogsController {
  constructor(private readonly catalogs: CatalogsService) {}

  @Get('catalogs/:kind')
  list(@Param('kind') kind: string) {
    return this.catalogs.list(requireKind(kind));
  }

  @Post('catalogs/:kind')
  @Roles('admin', 'supervisor')
  create(
    @Req() req: { account: TokenPayload },
    @Param('kind') kind: string,
    @Body() dto: { name: string },
  ) {
    return this.catalogs.create(req.account.sub, requireKind(kind), requireText(dto?.name, 'name'));
  }

  @Post('catalogs/:kind/:id/deactivate')
  @HttpCode(200)
  @Roles('admin', 'supervisor')
  deactivate(@Req() req: { account: TokenPayload }, @Param('kind') kind: string, @Param('id') id: string) {
    return this.catalogs.setActive(req.account.sub, requireKind(kind), id, false);
  }

  @Post('catalogs/:kind/:id/reactivate')
  @HttpCode(200)
  @Roles('admin', 'supervisor')
  reactivate(@Req() req: { account: TokenPayload }, @Param('kind') kind: string, @Param('id') id: string) {
    return this.catalogs.setActive(req.account.sub, requireKind(kind), id, true);
  }

  @Get('settings')
  readSettings() {
    return this.catalogs.readSettings();
  }

  @Put('settings/:key')
  @Roles('admin', 'supervisor')
  writeSetting(
    @Req() req: { account: TokenPayload },
    @Param('key') key: string,
    @Body() dto: { value: unknown },
  ) {
    if (dto?.value === undefined) throw new BadRequestException('Falta el valor');
    return this.catalogs.writeSetting(req.account.sub, key, dto.value);
  }
}
