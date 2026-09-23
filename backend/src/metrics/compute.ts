export interface WorkerActivity {
  /** Días con actividad registrada en el período. */
  days: number;
  lines: number;
  units: number;
  /** Paradas que no dependen del alistador: descuentan de su tiempo. */
  excusedStopMs: number;
  /** Paradas que dependen de él: no descuentan. */
  ownStopMs: number;
  errorCount: number;
  errorUnits: number;
}

export interface MetricSettings {
  workdayHours: number;
  standardLinesPerHour: number;
}

export interface WorkerMetrics {
  shiftHours: number;
  availableHours: number;
  /** Método vigente: todo sobre las horas brutas de la jornada. */
  linesPerHour: number;
  unitsPerHour: number;
  availability: number;
  performance: number;
  quality: number;
  ole: number;
}

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const round = (n: number, digits = 3) => Math.round(n * 10 ** digits) / 10 ** digits;

/**
 * Métricas de un colaborador en un período. Las horas de jornada salen de los días
 * con actividad por las horas configuradas, igual que la planilla vigente, así las
 * dos formas de medir se comparan sobre el mismo denominador.
 *
 * Los tres factores quedan acotados a [0, 1]: un valor fuera de rango es un error
 * del modelo, no un desempeño excepcional.
 */
export function computeWorkerMetrics(a: WorkerActivity, s: MetricSettings): WorkerMetrics | null {
  if (a.days === 0) return null;

  const shiftHours = a.days * s.workdayHours;
  const excusedHours = a.excusedStopMs / 3_600_000;
  const availableHours = Math.max(0, shiftHours - excusedHours);

  const availability = clamp(availableHours / shiftHours);
  const performance =
    availableHours > 0 ? clamp(a.lines / availableHours / s.standardLinesPerHour) : 0;
  const quality = a.units > 0 ? clamp(1 - a.errorUnits / a.units) : 1;

  return {
    shiftHours: round(shiftHours, 2),
    availableHours: round(availableHours, 2),
    linesPerHour: round(a.lines / shiftHours, 2),
    unitsPerHour: round(a.units / shiftHours, 2),
    availability: round(availability),
    performance: round(performance),
    quality: round(quality),
    ole: round(availability * performance * quality),
  };
}
