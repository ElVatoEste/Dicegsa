import { BadRequestException } from '@nestjs/common';

export interface LoginDto {
  accountName: string;
  password: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/**
 * Los DTO son interfaces, así que en tiempo de ejecución el cuerpo es lo que
 * mande el cliente. Se exige texto antes de tocarlo: sin esto un campo que
 * llega como objeto revienta con 500 en lugar de responder 400.
 */
export function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new BadRequestException(`El campo ${field} tiene que ser texto y no puede estar vacío`);
  }
  return value;
}
