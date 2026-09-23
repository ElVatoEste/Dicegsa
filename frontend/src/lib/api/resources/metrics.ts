import { api, PATHS } from '../client';

export interface Factors {
  shiftHours: number;
  availableHours: number;
  linesPerHour: number;
  unitsPerHour: number;
  availability: number;
  performance: number;
  quality: number;
  ole: number;
}

export interface WorkerRow {
  id: string;
  name: string;
  accountName: string;
  activity: {
    days: number;
    lines: number;
    units: number;
    errorCount: number;
    errorUnits: number;
    excusedStopMinutes: number;
    ownStopMinutes: number;
  };
  /** Null cuando no tuvo actividad en el período. */
  metrics: Factors | null;
  stopsByCause: { cause: string; attributable: boolean; minutes: number; count: number }[];
  errorsByType: { type: string; count: number; units: number }[];
}

export interface MetricsReport {
  period: { from: string; to: string };
  settings: { workdayHours: number; standardLinesPerHour: number };
  totals: {
    activeWorkers: number;
    ordersDone: number;
    pickListsDone: number;
    lines: number;
    units: number;
    errorCount: number;
    errorUnits: number;
    excusedStopMinutes: number;
    linesPerHour: number | null;
    unitsPerHour: number | null;
    availability: number | null;
    performance: number | null;
    quality: number | null;
    ole: number | null;
  };
  workers: WorkerRow[];
}

export const metricsApi = {
  report: (token: string, from: string, to: string) =>
    api.get<MetricsReport>(`${PATHS.metrics.root}?from=${from}&to=${to}`, { token }),
};
