import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { TokenPayload } from '../auth/access';
import { requireText } from '../auth/dto';
import { JwtGuard } from '../auth/jwt.guard';
import { Roles } from '../auth/roles.decorator';
import { optionalText, parseOrder, requireDate, requirePositiveInt } from './dto';
import { OrdersService, type OrderPatch } from './orders.service';
import { PickListsService, type LineMark } from './pick-lists.service';

type Req = { account: TokenPayload };

const DESK = ['control_desk', 'admin'] as const;
const WATCHERS = ['control_desk', 'supervisor', 'management', 'admin'] as const;

@Controller('orders')
@UseGuards(JwtGuard)
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @Roles(...WATCHERS)
  list() {
    return this.orders.list();
  }

  @Get(':id')
  @Roles(...WATCHERS)
  detail(@Param('id') id: string) {
    return this.orders.detail(id);
  }

  @Post()
  @Roles(...DESK)
  create(@Req() req: Req, @Body() body: unknown) {
    return this.orders.create(req.account.sub, parseOrder(body));
  }

  @Patch(':id')
  @Roles(...DESK)
  update(@Req() req: Req, @Param('id') id: string, @Body() body: any) {
    const patch: OrderPatch = {};
    if (body?.dispatchZoneId !== undefined) patch.dispatchZoneId = optionalText(body.dispatchZoneId, 'dispatchZoneId');
    if (body?.inventoryZoneId !== undefined) patch.inventoryZoneId = optionalText(body.inventoryZoneId, 'inventoryZoneId');
    if (body?.dueAt !== undefined) patch.dueAt = requireDate(body.dueAt, 'dueAt');
    if (body?.notes !== undefined) patch.notes = optionalText(body.notes, 'notes');
    if (Object.keys(patch).length === 0) throw new BadRequestException('No hay nada que cambiar');
    return this.orders.update(req.account.sub, id, patch);
  }

  @Post(':id/cancel')
  @HttpCode(200)
  @Roles(...DESK)
  cancel(@Req() req: Req, @Param('id') id: string) {
    return this.orders.cancel(req.account.sub, id);
  }

  @Post(':id/release')
  @HttpCode(200)
  @Roles(...DESK)
  release(@Req() req: Req, @Param('id') id: string) {
    return this.orders.release(req.account.sub, id);
  }

  @Post('lines/:lineId/cancel')
  @HttpCode(200)
  @Roles(...DESK)
  cancelLine(@Req() req: Req, @Param('lineId') lineId: string) {
    return this.orders.cancelLine(req.account.sub, lineId);
  }
}

@Controller('pick-lists')
@UseGuards(JwtGuard)
export class PickListsController {
  constructor(private readonly pickLists: PickListsService) {}

  @Get('pickers')
  @Roles(...WATCHERS)
  pickers() {
    return this.pickLists.pickers();
  }

  @Get('mine')
  @Roles('operator')
  mine(@Req() req: Req) {
    return this.pickLists.mine(req.account.sub);
  }

  @Get('validation-queue')
  @Roles('validator', 'supervisor', 'admin')
  validationQueue() {
    return this.pickLists.validationQueue();
  }

  @Get(':id')
  @Roles(...WATCHERS, 'validator')
  detail(@Param('id') id: string) {
    return this.pickLists.detail(id);
  }

  @Post()
  @Roles(...DESK)
  create(@Req() req: Req, @Body() body: any) {
    const orderIds: unknown = body?.orderIds;
    if (!Array.isArray(orderIds) || orderIds.some((id) => typeof id !== 'string')) {
      throw new BadRequestException('El campo orderIds tiene que ser una lista de ids');
    }
    return this.pickLists.create(req.account.sub, orderIds, requireText(body.assigneeId, 'assigneeId'));
  }

  @Post(':id/reassign')
  @HttpCode(200)
  @Roles(...DESK)
  reassign(@Req() req: Req, @Param('id') id: string, @Body() body: any) {
    return this.pickLists.reassign(req.account.sub, id, requireText(body?.assigneeId, 'assigneeId'));
  }

  @Post(':id/start')
  @HttpCode(200)
  @Roles('operator')
  start(@Req() req: Req, @Param('id') id: string) {
    return this.pickLists.start(req.account.sub, id);
  }

  @Post(':id/lines/:lineId')
  @HttpCode(200)
  @Roles('operator')
  markLine(@Req() req: Req, @Param('id') id: string, @Param('lineId') lineId: string, @Body() body: any) {
    const mark = body?.status as LineMark;
    if (!['picked', 'not_found', 'pending'].includes(mark)) {
      throw new BadRequestException('El estado tiene que ser picked, not_found o pending');
    }
    return this.pickLists.markLine(req.account.sub, id, lineId, mark);
  }

  @Post(':id/stops')
  @HttpCode(200)
  @Roles('operator')
  startStop(@Req() req: Req, @Param('id') id: string, @Body() body: any) {
    return this.pickLists.startStop(
      req.account.sub,
      id,
      requireText(body?.causeId, 'causeId'),
      optionalText(body?.note, 'note'),
    );
  }

  @Post(':id/stops/end')
  @HttpCode(200)
  @Roles('operator')
  endStop(@Req() req: Req, @Param('id') id: string) {
    return this.pickLists.endStop(req.account.sub, id);
  }

  @Post(':id/deliver')
  @HttpCode(200)
  @Roles('operator')
  deliver(@Req() req: Req, @Param('id') id: string) {
    return this.pickLists.deliver(req.account.sub, id);
  }

  @Post(':id/validate')
  @HttpCode(200)
  @Roles('validator')
  validate(@Req() req: Req, @Param('id') id: string, @Body() body: any) {
    const raw: unknown[] = Array.isArray(body?.errors) ? body.errors : [];
    const errors = raw.map((e: any, i) => ({
      lineId: requireText(e?.lineId, `errors[${i}].lineId`),
      errorTypeId: requireText(e?.errorTypeId, `errors[${i}].errorTypeId`),
      units: requirePositiveInt(e?.units, `errors[${i}].units`),
      note: optionalText(e?.note, `errors[${i}].note`),
    }));
    return this.pickLists.validate(req.account.sub, id, errors);
  }
}
