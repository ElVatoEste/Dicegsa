export interface LoginDto {
  nombreCuenta: string;
  password: string;
}

export interface CambioPasswordDto {
  passwordActual: string;
  passwordNueva: string;
}

import { BadRequestException } from '@nestjs/common';

/**
 * Los DTO son interfaces, así que en tiempo de ejecución el cuerpo es lo que
 * mande el cliente. Se exige texto antes de tocarlo: sin esto un campo que
 * llega como objeto revienta con 500 en lugar de responder 400.
 */
export function exigirTexto(valor: unknown, campo: string): string {
  if (typeof valor !== 'string' || valor.trim() === '') {
    throw new BadRequestException(`El campo ${campo} tiene que ser texto y no puede estar vacío`);
  }
  return valor;
}
