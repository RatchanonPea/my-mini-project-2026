import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Branch, ShopOwner, ShopProfile } from './api';
import { AuthService } from './auth';
import { ShopService } from './shop';
import { formatThaiId } from '../common/thai-id';


export type PaperSize = 'a4' | 'a4-landscape';

export interface PrintDocument {
  /** also the default file name when the user saves the print as a PDF */
  title: string;
  subtitle?: string;
  /** small "label: value" lines under the title (period, document no. ...) */
  meta?: [string, string][];
  /** HTML of the document body: build it with esc() for every user-entered value */
  body: string;
  /** branch printed in the letterhead; defaults to the main branch (a contract can name another) */
  branch?: Branch | null;
  paper?: PaperSize;
}

export const esc = (value: unknown): string =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** 1234.5 -> "1,234.50" */
export const money = (value: number | string | null | undefined, digits = 2): string =>
  Number(value ?? 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** "2026-10-22" / ISO string / Date -> "22/10/2026" (Bangkok time for timestamps, calendar date as-is for plain dates) */
export const dateTh = (value: string | Date | null | undefined): string => {
  if (!value) return '-';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
  return new Date(value).toLocaleDateString('en-GB', { timeZone: 'Asia/Bangkok' });
};

export const dateTimeTh = (value: string | Date | null | undefined): string =>
  value ? `${dateTh(value)} ${new Date(value).toLocaleTimeString('en-GB', { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' })}` : '-';

/**
 * Prints a document in a hidden iframe, so the app's own layout/theme/dark mode never leaks into the
 * paper copy and the user does not need to hide anything. The browser's print dialog lets them pick a
 * printer or "Save as PDF".
 */
@Injectable({ providedIn: 'root' })
export class PrintService {
  private readonly document = inject(DOCUMENT);
  private readonly auth = inject(AuthService);
  private readonly shopService = inject(ShopService);

  async print(doc: PrintDocument): Promise<void> {
    // letterhead data comes from the shop master (falls back to defaults if it cannot be loaded)
    const settings = await this.shopService.load();
    const profile = settings.profile!;
    const branch = doc.branch ?? ShopService.mainBranch(settings.branches);
    const showBranchName = settings.branches.filter((b) => b.is_active).length > 1;
    const owner = settings.owner;

    const frame = this.document.createElement('iframe');
    frame.setAttribute('aria-hidden', 'true');
    frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    this.document.body.appendChild(frame);

    const cleanup = () => setTimeout(() => frame.remove(), 500);
    try {
      await new Promise<void>((resolve) => {
        frame.onload = () => resolve();
        frame.srcdoc = this.render(doc, profile, branch, showBranchName, owner);
      });
      const win = frame.contentWindow!;
      // fonts and the logo must be ready, or the first page prints with fallback glyphs / a blank logo
      await Promise.race([
        Promise.all([
          win.document.fonts?.ready,
          ...Array.from(win.document.images).map((img) => img.decode().catch(() => undefined)),
        ]),
        new Promise((r) => setTimeout(r, 3000)),
      ]);
      win.addEventListener('afterprint', cleanup, { once: true });
      win.focus();
      win.print();
      setTimeout(cleanup, 120_000); // safety net if afterprint never fires
    } catch (error) {
      frame.remove();
      throw error;
    }
  }

  private render(doc: PrintDocument, shop: ShopProfile, branch: Branch | null, showBranchName: boolean, owner: ShopOwner | null): string {
    const assets = (path: string) => new URL(`assets/${path}`, this.document.baseURI).href;
    const user = this.auth.getCurrentUser() ?? '-';
    // line under the shop name: the legal entity for a juristic person, "By <owner>" for an individual
    const ownerName = owner?.full_name_th || owner?.full_name_en || shop.owner_name;
    const legalLine = shop.entity_type === 'juristic' ? shop.legal_name : ownerName ? `By ${ownerName}` : '';
    // an individual's number is the owner's ID card number (kept on the user); a juristic person has its own
    const taxNumber = shop.entity_type === 'juristic' ? shop.tax_id : owner?.national_id;
    const taxLabel = shop.entity_type === 'juristic' ? 'เลขประจำตัวผู้เสียภาษี' : 'เลขประจำตัวประชาชน/ผู้เสียภาษี';
    const contact = [
      branch?.phone ? `โทร ${branch.phone}` : '',
      taxNumber ? `${taxLabel} ${formatThaiId(taxNumber)}` : '',
    ].filter(Boolean).join(' · ');
    const lines = [
      showBranchName && branch ? branch.name : '',
      branch?.address ?? '',
      contact,
    ].filter(Boolean).map((l) => `<div class="addr">${esc(l)}</div>`).join('');
    const printedAt = dateTimeTh(new Date());
    const landscape = doc.paper === 'a4-landscape';
    const meta = (doc.meta ?? [])
      .map(([label, value]) => `<div><span class="k">${esc(label)}</span> ${esc(value)}</div>`)
      .join('');

    return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<title>${esc(doc.title)}</title>
<style>
  @font-face { font-family: 'Kanit'; font-weight: 400; src: url('${assets('font/kanit/Kanit-Regular.ttf')}'); }
  @font-face { font-family: 'Kanit'; font-weight: 700; src: url('${assets('font/kanit/Kanit-Bold.ttf')}'); }
  /* zero page margin: the browser then has no room to print its own header/footer (page URL, "1/2").
     The real margins are made below: side padding on body, plus repeating top/bottom spacer rows. */
  @page { size: ${landscape ? 'A4 landscape' : 'A4'}; margin: 0; }
  * { box-sizing: border-box; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; padding: 0 12mm; font-family: 'Kanit', 'Sarabun', Tahoma, sans-serif; font-size: 12px; line-height: 1.45; color: #111827; }
  /* the whole document sits in a table whose header group (shop + title) the browser repeats on every printed page */
  table.doc { width: 100%; border-collapse: collapse; }
  table.doc > thead { display: table-header-group; }
  table.doc > thead > tr > td { padding: 10mm 0 8px; }
  table.doc > tfoot { display: table-footer-group; }
  table.doc > tfoot > tr > td { height: 18mm; padding: 0; }
  table.doc > tbody > tr > td { padding: 0; }
  .hdr { display: flex; align-items: center; gap: 12px; padding-bottom: 8px; border-bottom: 2px solid #c2410c; }
  .logo { width: 52px; height: 52px; border-radius: 50%; object-fit: cover; }
  .shop { font-size: 18px; font-weight: 700; color: #7c2d12; line-height: 1.1; }
  .owner { font-size: 11px; color: #6b7280; }
  .addr { font-size: 10px; color: #4b5563; line-height: 1.35; max-width: 340px; }
  .doc-title { margin-left: auto; text-align: right; }
  .doc-title h1 { margin: 0; font-size: 20px; font-weight: 700; }
  .doc-title .sub { font-size: 11px; color: #6b7280; }
  .meta { display: flex; flex-wrap: wrap; gap: 2px 28px; margin: 10px 0 12px; font-size: 12px; }
  .meta .k { color: #6b7280; margin-right: 4px; }
  table.grid { width: 100%; border-collapse: collapse; margin: 8px 0; }
  table.grid thead { display: table-header-group; }
  table.grid th { background: #fde8d4; color: #7c2d12; font-weight: 700; text-align: center; }
  table.grid th, table.grid td { border: 1px solid #d6b79a; padding: 5px 8px; }
  table.grid tr { break-inside: avoid; }
  table.grid td.num, table.grid th.num { text-align: right; white-space: nowrap; }
  table.grid td.c { text-align: center; }
  /* totals print once, after the last row (a table-footer-group would repeat on every page) */
  table.grid tfoot { display: table-row-group; }
  table.grid tfoot td { background: #fff4e8; font-weight: 700; }
  .boxes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin: 6px 0 10px; }
  .box { border: 1px solid #d6b79a; border-radius: 8px; padding: 8px 10px; background: #fff7ed; }
  .box .l { font-size: 11px; color: #6b7280; }
  .box .v { font-size: 17px; font-weight: 700; }
  .neg { color: #b91c1c; }
  .note { margin: 10px 0; padding: 8px 10px; border: 1px dashed #9ca3af; border-radius: 6px; }
  .badge { display: inline-block; padding: 1px 10px; border-radius: 999px; border: 1px solid #9ca3af; font-size: 11px; font-weight: 700; }
  /* contracts: numbered clauses, blanks to write on, tick boxes */
  .contract { font-size: 13px; line-height: 1.75; }
  .contract p { margin: 0 0 6px; }
  .contract .clause { margin: 10px 0 0; break-inside: avoid; }
  .contract .keep { break-inside: avoid; }
  .contract .clause b.n { margin-right: 4px; }
  .contract .sub { margin: 0 0 0 18px; }
  .fill { display: inline-block; min-width: 90px; border-bottom: 1px dotted #111827; height: 1.1em; vertical-align: baseline; }
  .fill.s { min-width: 50px; } .fill.l { min-width: 230px; } .fill.xl { min-width: 330px; }
  .val { font-weight: 700; border-bottom: 1px dotted #111827; padding: 0 4px; }
  .cb { display: inline-block; width: 11px; height: 11px; border: 1px solid #111827; vertical-align: -1px; margin: 0 4px 0 2px; }
  .cb.on { background: #111827; }
  .sign.four { grid-template-columns: repeat(2, 1fr); gap: 44px 40px; margin-top: 36px; }
  .sign { display: grid; grid-template-columns: repeat(3, 1fr); gap: 28px; margin-top: 56px; text-align: center; break-inside: avoid; }
  .sign .line { border-top: 1px solid #111827; padding-top: 4px; }
  .sign .d { color: #6b7280; font-size: 11px; margin-top: 2px; }
  .foot { position: fixed; left: 12mm; right: 12mm; bottom: 7mm; display: flex; justify-content: space-between; font-size: 10px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 3px; }
</style>
</head>
<body>
  <table class="doc">
    <thead><tr><td>
      <div class="hdr">
        <img class="logo" src="${assets('images/Logo/CheckenLogo-bw.png')}" alt="">
        <div><div class="shop">${esc(shop.shop_name)}</div>${legalLine ? `<div class="owner">${esc(legalLine)}</div>` : ''}${lines}</div>
        <div class="doc-title"><h1>${esc(doc.title)}</h1>${doc.subtitle ? `<div class="sub">${esc(doc.subtitle)}</div>` : ''}</div>
      </div>
    </td></tr></thead>
    <tbody><tr><td>
      ${meta ? `<div class="meta">${meta}</div>` : ''}
      ${doc.body}
    </td></tr></tbody>
    <tfoot><tr><td></td></tr></tfoot>
  </table>
  <div class="foot"><span>${esc(shop.shop_name)}</span><span>พิมพ์เมื่อ ${esc(printedAt)} โดย ${esc(user)}</span></div>
</body>
</html>`;
  }
}
