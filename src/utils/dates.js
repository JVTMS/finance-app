// Utilidades de mês no formato 'YYYY-MM' sobre datas ISO 'YYYY-MM-DD'.

export function monthKey(isoDate) {
  return isoDate.slice(0, 7);
}

export function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Soma N meses a uma chave de mês. */
export function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Última data ISO de um mês. */
export function monthEndISO(key) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, m, 0);
  return `${y}-${String(m).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Lista de chaves de mês [maisAntigo..maisRecente] incluindo os limites. */
export function monthRange(fromKey, toKey, { limit = 24 } = {}) {
  const keys = [];
  let k = fromKey;
  while (k <= toKey && keys.length < limit) {
    keys.push(k);
    k = addMonths(k, 1);
  }
  return keys;
}

export function compareISO(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}
