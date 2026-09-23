import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, lt } from 'drizzle-orm';
import type { AnyPgColumn } from 'drizzle-orm/pg-core';
import { CatalogsService } from '../catalogs/catalogs.service';
import { DB, type Db } from '../db/db.module';
import {
  accounts,
  catalogEntries,
  orderLines,
  orders,
  pickEvents,
  stopCauses,
  stops,
  validationErrors,
  workers,
} from '../db/schema';
import { computeWorkerMetrics, type MetricSettings, type WorkerActivity } from './compute';

// ponytail: huso fijo de Nicaragua (sin horario de verano); pasar a configuración si se despliega en otro país.
const UTC_OFFSET = '-06:00';

/** Día local AAAA-MM-DD de un instante, para contar días trabajados. */
function localDay(at: Date): string {
  return new Date(at.getTime() - 6 * 3_600_000).toISOString().slice(0, 10);
}

export interface Period {
  from: string;
  to: string;
}

@Injectable()
export class MetricsService {
  constructor(
    @Inject(DB) private readonly db: Db,
    private readonly catalogs: CatalogsService,
  ) {}

  /**
   * Métricas del período, por colaborador y en total. Se recalculan desde los
   * eventos cada vez: no hay cifra guardada que pueda quedar desfasada de lo que
   * efectivamente pasó en el piso.
   */
  async compute({ from, to }: Period) {
    const start = new Date(`${from}T00:00:00${UTC_OFFSET}`);
    const end = new Date(new Date(`${to}T00:00:00${UTC_OFFSET}`).getTime() + 86_400_000);
    const settings = (await this.catalogs.readSettings()) as unknown as MetricSettings;

    const people = await this.db
      .select({ id: accounts.id, accountName: accounts.accountName, fullName: workers.fullName })
      .from(accounts)
      .innerJoin(workers, eq(workers.accountId, accounts.id))
      .where(eq(accounts.role, 'operator'));

    const inPeriod = (col: AnyPgColumn) => and(gte(col, start), lt(col, end));

    const events = await this.db
      .select({ accountId: pickEvents.accountId, at: pickEvents.at })
      .from(pickEvents)
      .where(inPeriod(pickEvents.at));

    const picked = await this.db
      .select({
        accountId: pickEvents.accountId,
        lineId: pickEvents.lineId,
        quantity: orderLines.quantity,
        status: orderLines.status,
      })
      .from(pickEvents)
      .innerJoin(orderLines, eq(orderLines.id, pickEvents.lineId))
      .where(and(eq(pickEvents.type, 'line_picked'), inPeriod(pickEvents.at)));

    const stopRows = await this.db
      .select({
        accountId: stops.accountId,
        cause: stopCauses.name,
        attributable: stopCauses.attributable,
        startedAt: stops.startedAt,
        endedAt: stops.endedAt,
      })
      .from(stops)
      .innerJoin(stopCauses, eq(stopCauses.id, stops.causeId))
      .where(inPeriod(stops.startedAt));

    const errors = await this.db
      .select({ pickerId: validationErrors.pickerId, units: validationErrors.units, type: catalogEntries.name })
      .from(validationErrors)
      .innerJoin(catalogEntries, eq(catalogEntries.id, validationErrors.errorTypeId))
      .where(inPeriod(validationErrors.createdAt));

    const validated = await this.db
      .select({ pickListId: pickEvents.pickListId })
      .from(pickEvents)
      .where(and(eq(pickEvents.type, 'validated'), inPeriod(pickEvents.at)));
    const ordersDone = validated.length
      ? (
          await this.db
            .select({ id: orders.id })
            .from(orders)
            .where(inArray(orders.pickListId, validated.map((v) => v.pickListId)))
        ).length
      : 0;

    const now = Date.now();
    const rows = people.map((person) => {
      const days = new Set(events.filter((e) => e.accountId === person.id).map((e) => localDay(e.at))).size;

      // Una línea marcada, desmarcada y vuelta a marcar cuenta una sola vez; las
      // dadas de baja no se le exigen.
      const lines = new Map<string, number>();
      for (const p of picked) {
        if (p.accountId === person.id && p.lineId && p.status !== 'cancelled') lines.set(p.lineId, p.quantity);
      }

      const own = stopRows.filter((s) => s.accountId === person.id);
      const byCause = new Map<string, { cause: string; attributable: boolean; minutes: number; count: number }>();
      let excusedStopMs = 0;
      let ownStopMs = 0;
      for (const s of own) {
        const ms = (s.endedAt?.getTime() ?? now) - s.startedAt.getTime();
        if (s.attributable) ownStopMs += ms;
        else excusedStopMs += ms;
        const entry = byCause.get(s.cause) ?? { cause: s.cause, attributable: s.attributable, minutes: 0, count: 0 };
        entry.minutes += ms / 60_000;
        entry.count += 1;
        byCause.set(s.cause, entry);
      }

      const mine = errors.filter((e) => e.pickerId === person.id);
      const byType = new Map<string, { type: string; count: number; units: number }>();
      for (const e of mine) {
        const entry = byType.get(e.type) ?? { type: e.type, count: 0, units: 0 };
        entry.count += 1;
        entry.units += e.units;
        byType.set(e.type, entry);
      }

      const activity: WorkerActivity = {
        days,
        lines: lines.size,
        units: [...lines.values()].reduce((a, b) => a + b, 0),
        excusedStopMs,
        ownStopMs,
        errorCount: mine.length,
        errorUnits: mine.reduce((a, e) => a + e.units, 0),
      };

      return {
        id: person.id,
        name: person.fullName,
        accountName: person.accountName,
        activity: { ...activity, excusedStopMinutes: Math.round(excusedStopMs / 60_000), ownStopMinutes: Math.round(ownStopMs / 60_000) },
        metrics: computeWorkerMetrics(activity, settings),
        stopsByCause: [...byCause.values()].map((c) => ({ ...c, minutes: Math.round(c.minutes) })),
        errorsByType: [...byType.values()],
      };
    });

    const active = rows.filter((r) => r.metrics);
    const sum = (f: (r: (typeof rows)[number]) => number) => rows.reduce((a, r) => a + f(r), 0);
    const avg = (f: (m: NonNullable<(typeof rows)[number]['metrics']>) => number) =>
      active.length ? Math.round((active.reduce((a, r) => a + f(r.metrics!), 0) / active.length) * 1000) / 1000 : null;

    return {
      period: { from, to },
      settings: { workdayHours: settings.workdayHours, standardLinesPerHour: settings.standardLinesPerHour },
      totals: {
        activeWorkers: active.length,
        ordersDone,
        pickListsDone: validated.length,
        lines: sum((r) => r.activity.lines),
        units: sum((r) => r.activity.units),
        errorCount: sum((r) => r.activity.errorCount),
        errorUnits: sum((r) => r.activity.errorUnits),
        excusedStopMinutes: sum((r) => r.activity.excusedStopMinutes),
        linesPerHour: avg((m) => m.linesPerHour),
        unitsPerHour: avg((m) => m.unitsPerHour),
        availability: avg((m) => m.availability),
        performance: avg((m) => m.performance),
        quality: avg((m) => m.quality),
        ole: avg((m) => m.ole),
      },
      workers: rows.sort((a, b) => (b.metrics?.ole ?? -1) - (a.metrics?.ole ?? -1)),
    };
  }
}
