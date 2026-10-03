// Formatação pt-BR: moeda, datas, percentuais e utilidades de mês.

const brlFormatters = {
  full: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }),
  signed: new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    signDisplay: 'always',
  }),
};

export function formatBRL(value, { signed = false } = {}) {
  const n = Number(value) || 0;
  return (signed ? brlFormatters.signed : brlFormatters.full).format(n);
}

export function formatCompactBRL(value) {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  if (abs >= 1000) return `R$ ${(n / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
  return brlFormatters.full.format(n);
}

export function formatPercent(value, { signed = true } = {}) {
  // Recebe uma razão (0.874 = 87,4%).
  const n = ((Number(value) || 0) * 100);
  const s = `${Math.abs(n).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  if (!signed) return s;
  return `${n > 0 ? '+' : n < 0 ? '−' : ''}${s}`;
}

/** '2026-10-03' -> '3 de out de 2026' */
export function formatDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${MONTHS_SHORT[m - 1]} ${y}`;
}

export function formatDateShort(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
}

export const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const MONTHS_LONG = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

/** '2026-10' -> 'Outubro 2026' (capitalizado) */
export function monthLabel(key, { short = false, year = true } = {}) {
  const [y, m] = key.split('-').map(Number);
  const name = short ? MONTHS_SHORT[m - 1] : MONTHS_LONG[m - 1];
  const cap = name.charAt(0).toUpperCase() + name.slice(1);
  return year ? `${cap} ${y}` : cap;
}

/** Converte 'R$ 1.234,56' | '1234,56' | '1.234.56' -> number */
export function parseAmount(input) {
  if (typeof input === 'number') return input;
  if (!input) return NaN;
  let s = String(input).replace(/[^\d.,-]/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
}

export function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

export function cx(...parts) {
  return parts.filter(Boolean).join(' ');
}

export function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Diferença em dias entre duas datas ISO (b - a) */
export function daysBetween(aISO, bISO) {
  const a = new Date(aISO + 'T12:00:00');
  const b = new Date(bISO + 'T12:00:00');
  return Math.round((b - a) / 86400000);
}

export function relativeDayLabel(iso) {
  const diff = daysBetween(iso, todayISO());
  if (diff === 0) return 'Hoje';
  if (diff === 1) return 'Ontem';
  if (diff === -1) return 'Amanhã';
  return formatDate(iso);
}

/** Escapa texto para inclusão segura em HTML gerado (relatórios). */
export function escapeHtmlSafe(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
