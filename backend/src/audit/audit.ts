import type { Db, Tx } from '../db/db.module';
import { auditLog } from '../db/schema';

/**
 * Deja constancia de una acción. Se llama dentro de la misma transacción que el
 * cambio: una acción aplicada sin su rastro no se puede atribuir a nadie.
 */
export function audit(
  tx: Db | Tx,
  actorId: string,
  action: string,
  entity: string,
  entityId: string,
  details?: Record<string, unknown>,
) {
  return tx.insert(auditLog).values({ actorId, action, entity, entityId, details: details ?? null });
}
