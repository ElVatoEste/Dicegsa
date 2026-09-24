import { BadRequestException } from '@nestjs/common';
import { requireText } from '../auth/dto';

export interface LineInput {
  productCode: string;
  productName: string;
  quantity: number;
  lot: string;
  expiresOn: string | null;
}

export interface OrderInput {
  externalId: string;
  receivedAt: Date;
  clientCode: string;
  clientName: string;
  department: string;
  municipality: string;
  notes: string | null;
  dueAt: Date;
  dispatchZoneId: string | null;
  inventoryZoneId: string | null;
  lines: LineInput[];
}

export function optionalText(value: unknown, field: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new BadRequestException(`El campo ${field} tiene que ser texto`);
  return value.trim() || null;
}

export function requireDate(value: unknown, field: string): Date {
  const date = typeof value === 'string' ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw new BadRequestException(`El campo ${field} tiene que ser una fecha válida`);
  }
  return date;
}

export function requirePositiveInt(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new BadRequestException(`El campo ${field} tiene que ser un entero mayor que cero`);
  }
  return value;
}

/** Fecha de vencimiento del lote. Se guarda como día, sin hora. */
function optionalDay(value: unknown, field: string): string | null {
  const text = optionalText(value, field);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throw new BadRequestException(`El campo ${field} tiene que tener el formato AAAA-MM-DD`);
  }
  return text;
}

export function parseOrder(body: any): OrderInput {
  const rawLines: unknown[] = Array.isArray(body?.lines) ? body.lines : [];
  if (rawLines.length === 0) throw new BadRequestException('El pedido tiene que traer al menos una línea');

  return {
    externalId: requireText(body.externalId, 'externalId').trim(),
    receivedAt: requireDate(body.receivedAt, 'receivedAt'),
    clientCode: requireText(body.clientCode, 'clientCode').trim(),
    clientName: requireText(body.clientName, 'clientName').trim(),
    department: requireText(body.department, 'department').trim(),
    municipality: requireText(body.municipality, 'municipality').trim(),
    notes: optionalText(body.notes, 'notes'),
    dueAt: requireDate(body.dueAt, 'dueAt'),
    dispatchZoneId: optionalText(body.dispatchZoneId, 'dispatchZoneId'),
    inventoryZoneId: optionalText(body.inventoryZoneId, 'inventoryZoneId'),
    lines: rawLines.map((line: any, i) => ({
      productCode: requireText(line?.productCode, `lines[${i}].productCode`).trim(),
      productName: requireText(line?.productName, `lines[${i}].productName`).trim(),
      quantity: requirePositiveInt(line?.quantity, `lines[${i}].quantity`),
      lot: requireText(line?.lot, `lines[${i}].lot`).trim(),
      expiresOn: optionalDay(line?.expiresOn, `lines[${i}].expiresOn`),
    })),
  };
}
