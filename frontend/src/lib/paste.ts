export interface PastedLine {
  productCode: string;
  productName: string;
  quantity: number;
  lot: string;
  expiresOn: string | null;
}

export interface PasteResult {
  lines: PastedLine[];
  /** Filas que no se pudieron leer, con su número (desde 1) y el motivo. */
  errors: { row: number; reason: string }[];
}

/** Acepta AAAA-MM-DD o DD/MM/AAAA, que es como lo muestra el ERP. */
function parseDay(value: string): string | null | undefined {
  const text = value.trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const m = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!m) return undefined;
  return `${m[3]}-${m[2]!.padStart(2, '0')}-${m[1]!.padStart(2, '0')}`;
}

/**
 * Lee las líneas copiadas de la pestaña de contenido del pedido en el ERP, en el
 * orden: id de producto, nombre, cantidad, lote, vence. Al copiar de una tabla
 * las columnas llegan separadas por tabulador; también se aceptan punto y coma.
 * La fila de títulos se reconoce porque su cantidad no es un número y se salta.
 */
export function parseLines(text: string): PasteResult {
  const result: PasteResult = { lines: [], errors: [] };
  const rows = text.split(/\r?\n/).filter((r) => r.trim() !== '');

  rows.forEach((row, index) => {
    const cells = row.split(/\t|;/).map((c) => c.trim());
    const [productCode = '', productName = '', rawQuantity = '', lot = '', rawDay = ''] = cells;
    const quantity = Number(rawQuantity.replace(/[.,\s](?=\d{3}\b)/g, ''));

    if (index === 0 && !Number.isFinite(quantity)) return;

    if (!productCode || !productName) {
      result.errors.push({ row: index + 1, reason: 'Falta el id o el nombre del producto' });
    } else if (!Number.isInteger(quantity) || quantity <= 0) {
      result.errors.push({ row: index + 1, reason: 'La cantidad no es un entero mayor que cero' });
    } else if (!lot) {
      result.errors.push({ row: index + 1, reason: 'Falta el lote' });
    } else {
      const expiresOn = parseDay(rawDay);
      if (expiresOn === undefined) {
        result.errors.push({ row: index + 1, reason: 'El vencimiento no es una fecha' });
      } else {
        result.lines.push({ productCode, productName, quantity, lot, expiresOn });
      }
    }
  });

  return result;
}
