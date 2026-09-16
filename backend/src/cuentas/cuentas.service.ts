import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq, sql } from 'drizzle-orm';
import type { RolSistema } from '../auth/acceso';
import { generarPasswordInicial, hashear, normalizarNombreCuenta } from '../auth/passwords';
import { DB, type Db, type Tx } from '../db/db.module';
import { cuentas, eventosAdmin } from '../db/schema';

const CAMPOS_PUBLICOS = {
  id: cuentas.id,
  nombreCuenta: cuentas.nombreCuenta,
  rol: cuentas.rol,
  activa: cuentas.activa,
  debeCambiarPassword: cuentas.debeCambiarPassword,
  creadaEn: cuentas.creadaEn,
  actualizadaEn: cuentas.actualizadaEn,
};

@Injectable()
export class CuentasService {
  constructor(@Inject(DB) private readonly db: Db) {}

  listar() {
    return this.db.select(CAMPOS_PUBLICOS).from(cuentas).orderBy(cuentas.nombreCuenta);
  }

  /** Devuelve la contraseña inicial en claro una sola vez: es lo que el administrador entrega en mano. */
  async crear(actorId: string, nombreCuenta: string, rol: RolSistema) {
    const nombre = normalizarNombreCuenta(nombreCuenta);
    if (!nombre) throw new BadRequestException('El nombre de cuenta no puede estar vacío');

    const passwordInicial = generarPasswordInicial();
    const hash = await hashear(passwordInicial);

    const creada = await this.db.transaction(async (tx) => {
      const [existente] = await tx
        .select({ id: cuentas.id })
        .from(cuentas)
        .where(eq(sql`lower(${cuentas.nombreCuenta})`, nombre))
        .limit(1);
      if (existente) throw new ConflictException('Ya existe una cuenta con ese nombre');

      const [cuenta] = await tx
        .insert(cuentas)
        .values({ nombreCuenta: nombre, hashPassword: hash, rol, debeCambiarPassword: true })
        .returning(CAMPOS_PUBLICOS);

      await tx.insert(eventosAdmin).values({
        actorId,
        cuentaObjetivoId: cuenta!.id,
        accion: 'alta',
        detalle: { rol },
      });
      return cuenta!;
    });

    return { cuenta: creada, passwordInicial };
  }

  /** Reinicia el ciclo de primer ingreso: la contraseña vuelve a ser de un solo uso. */
  async resetear(actorId: string, cuentaId: string) {
    const passwordInicial = generarPasswordInicial();
    const hash = await hashear(passwordInicial);

    const cuenta = await this.db.transaction(async (tx) => {
      await this.exigirExistente(tx, cuentaId);
      const [actualizada] = await tx
        .update(cuentas)
        .set({ hashPassword: hash, debeCambiarPassword: true, actualizadaEn: new Date() })
        .where(eq(cuentas.id, cuentaId))
        .returning(CAMPOS_PUBLICOS);

      await tx.insert(eventosAdmin).values({
        actorId,
        cuentaObjetivoId: cuentaId,
        accion: 'reseteo',
        detalle: null,
      });
      return actualizada!;
    });

    return { cuenta, passwordInicial };
  }

  cambiarRol(actorId: string, cuentaId: string, rol: RolSistema) {
    return this.db.transaction(async (tx) => {
      const previa = await this.exigirExistente(tx, cuentaId);
      const [cuenta] = await tx
        .update(cuentas)
        .set({ rol, actualizadaEn: new Date() })
        .where(eq(cuentas.id, cuentaId))
        .returning(CAMPOS_PUBLICOS);

      await tx.insert(eventosAdmin).values({
        actorId,
        cuentaObjetivoId: cuentaId,
        accion: 'cambio_rol',
        detalle: { de: previa.rol, a: rol },
      });
      return cuenta!;
    });
  }

  /**
   * Las cuentas se desactivan, nunca se borran: sus eventos de alisto y sus
   * cálculos de OLE tienen que seguir siendo trazables.
   */
  cambiarEstado(actorId: string, cuentaId: string, activa: boolean) {
    return this.db.transaction(async (tx) => {
      await this.exigirExistente(tx, cuentaId);
      const [cuenta] = await tx
        .update(cuentas)
        .set({ activa, actualizadaEn: new Date() })
        .where(eq(cuentas.id, cuentaId))
        .returning(CAMPOS_PUBLICOS);

      await tx.insert(eventosAdmin).values({
        actorId,
        cuentaObjetivoId: cuentaId,
        accion: activa ? 'reactivacion' : 'baja',
        detalle: null,
      });
      return cuenta!;
    });
  }

  auditoria(limite = 200) {
    return this.db
      .select()
      .from(eventosAdmin)
      .orderBy(desc(eventosAdmin.creadoEn))
      .limit(limite);
  }

  private async exigirExistente(tx: Db | Tx, cuentaId: string) {
    const [cuenta] = await tx
      .select({ id: cuentas.id, rol: cuentas.rol })
      .from(cuentas)
      .where(eq(cuentas.id, cuentaId))
      .limit(1);
    if (!cuenta) throw new NotFoundException('No existe esa cuenta');
    return cuenta;
  }
}
