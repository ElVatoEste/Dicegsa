import { describe, expect, test } from 'bun:test';
import { computeWorkerMetrics, type WorkerActivity } from './compute';

const settings = { workdayHours: 8, standardLinesPerHour: 15 };
const base: WorkerActivity = {
  days: 1,
  lines: 90,
  units: 400,
  excusedStopMs: 0,
  ownStopMs: 0,
  errorCount: 0,
  errorUnits: 0,
};

describe('métricas por colaborador', () => {
  test('sin actividad en el período no hay métricas', () => {
    expect(computeWorkerMetrics({ ...base, days: 0 }, settings)).toBeNull();
  });

  test('el método vigente divide por las horas brutas', () => {
    const m = computeWorkerMetrics(base, settings)!;
    expect(m.linesPerHour).toBe(11.25);
    expect(m.unitsPerHour).toBe(50);
  });

  test('una parada que no depende del alistador sube su desempeño y baja la disponibilidad', () => {
    const sinParada = computeWorkerMetrics(base, settings)!;
    const conParada = computeWorkerMetrics({ ...base, excusedStopMs: 2 * 3_600_000 }, settings)!;
    expect(conParada.availability).toBe(0.75);
    expect(conParada.performance).toBeGreaterThan(sinParada.performance);
    // El método vigente no se entera de la parada.
    expect(conParada.linesPerHour).toBe(sinParada.linesPerHour);
  });

  test('una parada propia no descuenta', () => {
    const m = computeWorkerMetrics({ ...base, ownStopMs: 2 * 3_600_000 }, settings)!;
    expect(m.availability).toBe(1);
  });

  test('la calidad sale de las unidades con error', () => {
    const m = computeWorkerMetrics({ ...base, errorCount: 2, errorUnits: 20 }, settings)!;
    expect(m.quality).toBe(0.95);
  });

  test('los factores quedan acotados a [0, 1]', () => {
    const m = computeWorkerMetrics({ ...base, lines: 500 }, settings)!;
    expect(m.performance).toBe(1);
    const q = computeWorkerMetrics({ ...base, errorUnits: 900 }, settings)!;
    expect(q.quality).toBe(0);
  });

  test('el OLE es el producto de los tres factores', () => {
    const m = computeWorkerMetrics({ ...base, excusedStopMs: 3_600_000, errorUnits: 40 }, settings)!;
    expect(m.ole).toBeCloseTo(m.availability * m.performance * m.quality, 2);
  });
});
