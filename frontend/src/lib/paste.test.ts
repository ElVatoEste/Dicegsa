import { describe, expect, test } from 'bun:test';
import { parseLines } from './paste';

describe('líneas pegadas desde el ERP', () => {
  test('lee filas separadas por tabulador y salta los títulos', () => {
    const text = 'Id producto\tNombre\tCantidad\tLote\tVence\nA1\tJabón íntimo\t5\tL1\t31/01/2027\nA2\tJabón de cuerpo\t4\tL2\t';
    const { lines, errors } = parseLines(text);
    expect(errors).toEqual([]);
    expect(lines).toEqual([
      { productCode: 'A1', productName: 'Jabón íntimo', quantity: 5, lot: 'L1', expiresOn: '2027-01-31' },
      { productCode: 'A2', productName: 'Jabón de cuerpo', quantity: 4, lot: 'L2', expiresOn: null },
    ]);
  });

  test('acepta punto y coma y separador de miles', () => {
    const { lines } = parseLines('B1;Guantes;1.200;LX;2027-05-01');
    expect(lines[0]?.quantity).toBe(1200);
    expect(lines[0]?.expiresOn).toBe('2027-05-01');
  });

  test('marca las filas que no se pueden leer sin perder las buenas', () => {
    const { lines, errors } = parseLines('A1\tUno\t2\tL1\nA2\tDos\tcero\tL2\nA3\tTres\t1\t\nA4\tCuatro\t1\tL4\tmañana');
    expect(lines.map((l) => l.productCode)).toEqual(['A1']);
    expect(errors.map((e) => e.row)).toEqual([2, 3, 4]);
  });
});
