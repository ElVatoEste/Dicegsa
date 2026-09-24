export type Urgency = 'late' | 'urgent' | 'normal';

/** Vencido, de pronta entrega según el umbral configurado, o con tiempo. */
export function urgencyOf(dueAt: string, now: number, thresholdMinutes: number): Urgency {
  const remaining = new Date(dueAt).getTime() - now;
  if (remaining < 0) return 'late';
  if (remaining <= thresholdMinutes * 60000) return 'urgent';
  return 'normal';
}
