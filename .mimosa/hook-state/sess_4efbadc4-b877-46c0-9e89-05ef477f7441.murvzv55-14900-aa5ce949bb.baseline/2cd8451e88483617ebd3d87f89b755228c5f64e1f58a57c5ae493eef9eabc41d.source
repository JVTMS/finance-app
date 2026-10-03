// Exportação de relatórios: CSV (Excel pt-BR), XLS (planilha) e PDF (impressão).

function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function exportCSV(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.join(';'), ...rows.map((r) => headers.map((h) => escape(r[h])).join(';'))].join('\r\n');
  downloadBlob(filename, new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
}

export function exportXLS(filename, title, tableHTML) {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
<head><meta charset="utf-8" /><style>
  table { border-collapse: collapse; font-family: Segoe UI, Calibri, sans-serif; font-size: 12px; }
  th { background: #1a1c22; color: #fff; padding: 8px 12px; text-align: left; }
  td { border-bottom: 1px solid #e4e6ea; padding: 6px 12px; }
  .num { text-align: right; mso-number-format: "#\\.##0,00"; }
  h1 { font-family: Segoe UI, Calibri, sans-serif; font-size: 18px; }
</style></head><body><h1>${title}</h1>${tableHTML}</body></html>`;
  downloadBlob(filename, new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel' }));
}

/** Gera PDF via diálogo de impressão dentro de um iframe oculto (sem pop-up bloqueado). */
export function printHTML(title, bodyHTML) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><title>${title}</title>
<style>
  @page { margin: 18mm 14mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; color: #17181c; margin: 0; padding: 24px; }
  h1 { font-size: 22px; margin: 0 0 2px; letter-spacing: 0.5px; }
  .sub { color: #6b7078; font-size: 12px; margin-bottom: 22px; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 22px; }
  .kpi { border: 1px solid #e4e6ea; border-radius: 10px; padding: 10px 12px; }
  .kpi .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #6b7078; }
  .kpi .value { font-size: 16px; font-weight: 700; margin-top: 3px; }
  .pos { color: #0a7d4f; } .neg { color: #b3261e; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 22px; }
  th { text-align: left; border-bottom: 2px solid #17181c; padding: 6px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #555; }
  td { border-bottom: 1px solid #e8eaee; padding: 6px 8px; }
  td.r, th.r { text-align: right; }
  footer { margin-top: 26px; color: #9aa0a8; font-size: 10px; }
</style></head><body>${bodyHTML}</body></html>`);
  doc.close();
  const win = iframe.contentWindow;
  win.focus();
  setTimeout(() => {
    win.print();
    setTimeout(() => iframe.remove(), 4000);
  }, 250);
}
