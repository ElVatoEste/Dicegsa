import { describe, expect, test } from 'bun:test';
import { enumerateDays } from './metrics.service';

describe('enumerateDays', () => {
  test('incluye ambos extremos del rango', () => {
    expect(enumerateDays('2026-10-01', '2026-10-03')).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
  });

  test('un solo día cuando from y to coinciden', () => {
    expect(enumerateDays('2026-10-27', '2026-10-27')).toEqual(['2026-10-27']);
  });
});
