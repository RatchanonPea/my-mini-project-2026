import type { Branch, PurchaseOrder, PurchaseStatus, SaleItem, ShopOwner, ShopProfile, Supplier, SummaryTotals } from '../services/api';
import { PrintDocument, dateTh, dateTimeTh, esc, money } from '../services/print';
import { formatThaiId } from './thai-id';
import { NetPeriod, netOf } from './profit';

const sum = <T>(rows: T[], pick: (row: T) => number): number => rows.reduce((total, row) => total + Number(pick(row) || 0), 0);

// ---------- Reports ----------

export function buildReportDoc(args: {
  groupByLabel: string;
  from: string;
  to: string;
  summary: SummaryTotals;
  periods: NetPeriod[];
  periodLabel: (period: string) => string;
}): PrintDocument {
  const { summary, periods } = args;
  const box = (label: string, value: string, negative = false) =>
    `<div class="box"><div class="l">${esc(label)}</div><div class="v${negative ? ' neg' : ''}">${value}</div></div>`;

  const rows = periods
    .map(
      (p) => `<tr>
        <td>${esc(args.periodLabel(p.period))}</td>
        <td class="num">${money(p.sales_total)}</td>
        <td class="num">${money(p.chicken_sold, 2)}</td>
        <td class="num">${money(p.purchase_cost)}</td>
        <td class="num">${money(p.chicken_received, 2)}</td>
        <td class="num">${money(p.chicken_cost)}</td>
        <td class="num">${money(p.expense_total)}</td>
        <td class="num${p.net_profit < 0 ? ' neg' : ''}">${money(p.net_profit)}</td>
      </tr>`
    )
    .join('');

  const totalProfit = sum(periods, (p) => p.net_profit);
  const net = netOf(summary.profit, summary.chicken_cost);
  const foot = `<tr>
      <td>รวมทั้งหมด</td>
      <td class="num">${money(sum(periods, (p) => p.sales_total))}</td>
      <td class="num">${money(sum(periods, (p) => p.chicken_sold), 2)}</td>
      <td class="num">${money(sum(periods, (p) => p.purchase_cost))}</td>
      <td class="num">${money(sum(periods, (p) => p.chicken_received), 2)}</td>
      <td class="num">${money(sum(periods, (p) => p.chicken_cost))}</td>
      <td class="num">${money(sum(periods, (p) => p.expense_total))}</td>
      <td class="num${totalProfit < 0 ? ' neg' : ''}">${money(totalProfit)}</td>
    </tr>`;

  return {
    title: 'รายงานสรุปผลประกอบการ',
    subtitle: `Sales & Expense Report · สรุป${args.groupByLabel}`,
    paper: 'a4-landscape',
    meta: [
      ['ช่วงวันที่', `${dateTh(args.from)} - ${dateTh(args.to)}`],
      ['รูปแบบ', args.groupByLabel],
    ],
    body: `
      <div class="boxes">
        ${box('ยอดขายรวม (บาท)', money(summary.sales_total))}
        ${box('ต้นทุนไก่ที่ขายไป (บาท)', money(summary.chicken_cost))}
        ${box('ค่าใช้จ่ายดำเนินงาน (บาท)', money(summary.expense_total))}
        ${box('กำไรหลังหักต้นทุนไก่ (บาท)', money(net), net < 0)}
      </div>
      <table class="grid">
        <thead><tr>
          <th>ช่วงเวลา</th><th>ยอดขาย (บาท)</th><th>ขายได้ (ตัว)</th><th>ซื้อไก่เข้า (บาท)</th>
          <th>รับไก่เข้า (ตัว)</th><th>ต้นทุนไก่ (บาท)</th><th>ค่าใช้จ่ายดำเนินงาน (บาท)</th><th>กำไรหลังหักต้นทุนไก่ (บาท)</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="8" class="c">ไม่มีข้อมูลในช่วงนี้</td></tr>'}</tbody>
        <tfoot>${foot}</tfoot>
      </table>`,
  };
}

// ---------- Purchase order ----------

const PO_STATUS: Record<PurchaseStatus, string> = { ordered: 'สั่งแล้ว', received: 'รับแล้ว', cancelled: 'ยกเลิก' };

export function buildPurchaseOrderDoc(po: PurchaseOrder): PrintDocument {
  const total = po.total_cost ?? Number(po.quantity) * Number(po.unit_cost);
  const meta: [string, string][] = [
    ['เลขที่', po.code],
    ['วันที่สั่ง', dateTh(po.order_date)],
    ['สถานะ', PO_STATUS[po.status] ?? po.status],
  ];
  if (po.status === 'received') {
    meta.push(['วันที่รับ', po.received_at ? dateTimeTh(po.received_at) : dateTh(po.received_date)]);
    if (po.received_by_name) meta.push(['ผู้รับของ', po.received_by_name]);
    if (po.paid_date) meta.push(['จ่ายเงินแล้ว', dateTh(po.paid_date)]);
    else if (po.due_date) meta.push(['ครบกำหนดจ่าย', dateTh(po.due_date)]);
  }
  if (po.contract_code) meta.push(['ข้อตกลง', po.contract_code]);

  return {
    title: 'ใบสั่งซื้อไก่',
    subtitle: 'Purchase Order',
    meta,
    body: `
      <table class="grid" style="margin-top:0">
        <tbody>
          <tr><td style="width:18%"><strong>ผู้ขาย</strong></td><td>${esc(po.supplier_name || '-')}</td>
              <td style="width:14%"><strong>โทร</strong></td><td style="width:24%">${esc(po.supplier_phone || '-')}</td></tr>
        </tbody>
      </table>
      <table class="grid">
        <thead><tr><th style="width:8%">ลำดับ</th><th>รายการ</th><th style="width:16%">จำนวน (ตัว)</th><th style="width:18%">ราคา/ตัว (บาท)</th><th style="width:18%">จำนวนเงิน (บาท)</th></tr></thead>
        <tbody>
          <tr><td class="c">1</td><td>ไก่</td><td class="num">${esc(po.quantity)}</td><td class="num">${money(po.unit_cost)}</td><td class="num">${money(total)}</td></tr>
        </tbody>
        <tfoot><tr><td colspan="4" class="num">ยอดรวมทั้งสิ้น</td><td class="num">${money(total)}</td></tr></tfoot>
      </table>
      ${po.note ? `<div class="note"><strong>หมายเหตุ:</strong> ${esc(po.note)}</div>` : ''}
      <div class="sign">
        <div><div class="line">ผู้สั่งซื้อ</div><div class="d">วันที่ ____/____/________</div></div>
        <div><div class="line">ผู้ขาย</div><div class="d">วันที่ ____/____/________</div></div>
        <div><div class="line">ผู้รับของ</div><div class="d">วันที่ ____/____/________</div></div>
      </div>`,
  };
}

// ---------- Sales (the rows the history table is filtered to) ----------

export function buildSalesDoc(args: { date: string | null; keyword: string; items: SaleItem[]; truncated?: boolean }): PrintDocument {
  const { date, keyword, items } = args;
  const rows = items
    .map(
      (item, i) => `<tr>
        <td class="c">${i + 1}</td>
        <td class="c">${dateTh(item.sale_date)}</td>
        <td>${esc(item.code ?? item.item_id)}</td>
        <td>${esc(item.product_name)}</td>
        <td class="num">${esc(item.quantity)}</td>
        <td class="num">${money(item.unit_price)}</td>
        <td class="num">${money(item.total_price)}</td>
      </tr>`
    )
    .join('');

  const meta: [string, string][] = [
    ['วันที่', date ? dateTh(date) : 'ทุกวัน'],
    ['จำนวนรายการ', String(items.length)],
  ];
  if (keyword) meta.splice(1, 0, ['ค้นหา', keyword]);

  return {
    title: date ? 'สรุปยอดขายประจำวัน' : 'สรุปยอดขาย',
    meta,
    body: `
      <table class="grid">
        <thead><tr><th style="width:7%">ลำดับ</th><th style="width:13%">วันที่</th><th style="width:12%">รหัส</th><th>สินค้า</th><th style="width:10%">จำนวน</th><th style="width:15%">ราคา/หน่วย (บาท)</th><th style="width:16%">รวม (บาท)</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="7" class="c">ไม่มีรายการขาย</td></tr>'}</tbody>
        <tfoot><tr><td colspan="4" class="num">รวมทั้งหมด</td><td class="num">${esc(sum(items, (i) => i.quantity))}</td><td></td><td class="num">${money(sum(items, (i) => i.total_price))}</td></tr></tfoot>
      </table>
      ${args.truncated ? '<div class="note">แสดงเฉพาะ 5,000 รายการแรก: เลือกวันที่หรือคำค้นเพื่อจำกัดช่วงก่อนพิมพ์</div>' : ''}`,
  };
}

// ---------- Supplier supply agreement ----------

export interface SupplyAgreementOptions {
  quantity: number;
  per: 'month' | 'year';
  unitPrice: number | null;
  creditDays: number | null;
}

export interface AgreementShop {
  profile: ShopProfile;
  /** the user flagged as the shop owner / signatory: the buyer's name, ID card, phone and address come from them */
  owner: ShopOwner | null;
  /** branch whose address goes on the agreement (the main one unless another was picked) */
  branch: Branch | null;
}

/**
 * Standard starting-point wording for buying chickens from a supplier. Whatever the shop master and the
 * supplier record know is filled in; anything still missing is a dotted line to write on. The wording itself
 * is a template: have someone who knows contracts review it before the shop relies on it.
 */
export function buildSupplyAgreementDoc(supplier: Supplier, options: SupplyAgreementOptions, shop: AgreementShop, contractCode?: string): PrintDocument {
  const { profile, branch, owner } = shop;
  const ownerName = owner?.full_name_th || owner?.full_name_en || profile.owner_name;
  const blank = (size: '' | 's' | 'l' | 'xl' = '') => `<span class="fill ${size}"></span>`;
  const value = (text: string) => `<span class="val">${text}</span>`;
  /** the known value, or a dotted line to write on */
  const known = (text: string | number | null | undefined, size: '' | 's' | 'l' | 'xl' = '') =>
    text !== null && text !== undefined && String(text).trim() !== '' ? value(esc(text)) : blank(size);
  const cb = (on: boolean) => `<span class="cb${on ? ' on' : ''}"></span>`;
  const perLabel = options.per === 'month' ? 'เดือน' : 'ปี';
  const juristic = profile.entity_type === 'juristic';

  // buyer = the shop. A juristic person signs through its authorised signatory (the owner user); an individual signs for
  // themself, with the name, ID card number, phone and address kept on their user record.
  const buyer = juristic
    ? `<b>ผู้ซื้อ</b> คือ ${known(profile.legal_name, 'l')} (ร้าน ${esc(profile.shop_name)})
       เลขทะเบียนนิติบุคคล/เลขประจำตัวผู้เสียภาษี ${known(formatThaiId(profile.tax_id))}
       ที่ตั้ง${branch && branch.name ? ` (${esc(branch.name)})` : ''} ${known(branch?.address, 'xl')} โทร ${known(branch?.phone || owner?.phone)}
       โดย ${known(ownerName, 'l')} ตำแหน่ง ${known(profile.signatory_position)} ผู้มีอำนาจลงนาม`
    : `<b>ผู้ซื้อ</b> คือ ${known(ownerName, 'l')} เจ้าของร้าน ${esc(profile.shop_name)}
       เลขประจำตัวประชาชน ${known(formatThaiId(owner?.national_id))}
       ที่อยู่ ${known(owner?.address || branch?.address, 'xl')} โทร ${known(owner?.phone || branch?.phone)}`;

  const price = options.unitPrice !== null ? `ตัวละ ${value(money(options.unitPrice))} บาท` : `ตัวละ ${blank('s')} บาท`;
  const credit = options.creditDays ?? supplier.credit_days ?? profile.default_credit_days ?? null;
  const payment = `
    <div class="sub">${cb(credit === 0)} ชำระเป็นเงินสดหรือโอนทันทีเมื่อผู้ซื้อตรวจรับไก่แล้ว</div>
    <div class="sub">${cb(credit !== null && credit > 0)} ชำระภายใน ${credit !== null && credit > 0 ? value(String(credit)) : blank('s')} วัน นับจากวันที่ผู้ซื้อตรวจรับไก่</div>
    <div class="sub">โอนเข้าบัญชีธนาคาร ${known(supplier.bank_name, 'l')} เลขที่บัญชี ${known(supplier.bank_account_no, 'l')} ชื่อบัญชี ${known(supplier.bank_account_name || supplier.name, 'l')}</div>`;

  let clauseNo = 0;
  const clause = (title: string, body: string) =>
    `<div class="clause"><p><b class="n">ข้อ ${++clauseNo}.</b><b>${title}</b></p>${body}</div>`;

  // seller = the supplier. Same shape as the buyer: a juristic person signs through its authorised signatory.
  const sellerJuristic = supplier.entity_type === 'juristic';
  const sellerName = supplier.legal_name || supplier.name;
  const brandNote = supplier.legal_name && supplier.legal_name !== supplier.name ? ` (${esc(supplier.name)})` : '';
  const seller = sellerJuristic
    ? `<b>ผู้ขาย</b> คือ ${known(sellerName, 'l')}${brandNote}
       เลขทะเบียนนิติบุคคล/เลขประจำตัวผู้เสียภาษี ${known(formatThaiId(supplier.tax_id))}
       ที่ตั้ง ${known(supplier.address, 'xl')} โทร ${known(supplier.phone)}
       โดย ${known(supplier.contact_name, 'l')} ตำแหน่ง ${known(supplier.contact_position)} ผู้มีอำนาจลงนาม`
    : `<b>ผู้ขาย</b> คือ ${known(sellerName, 'l')}${brandNote}
       เลขประจำตัวประชาชน ${known(formatThaiId(supplier.tax_id))}
       ที่อยู่ ${known(supplier.address, 'xl')} โทร ${known(supplier.phone)}`;
  const sellerSign = sellerJuristic
    ? `(${esc(supplier.contact_name || '____________________')})<br>${esc(supplier.contact_position || 'ผู้มีอำนาจลงนาม')}<br>ผู้ขาย<div class="d">ประทับตรานิติบุคคล (ถ้ามี)</div>`
    : `(${esc(sellerName)})<br>ผู้ขาย`;

  const buyerSign = juristic
    ? `(${esc(ownerName || '____________________')})<br>${esc(profile.signatory_position || 'ผู้มีอำนาจลงนาม')}<br>ผู้ซื้อ<div class="d">ประทับตรานิติบุคคล (ถ้ามี)</div>`
    : `(${esc(ownerName || '____________________')})<br>ผู้ซื้อ`;

  return {
    title: 'ข้อตกลงซื้อขายไก่',
    subtitle: 'Supply Agreement',
    meta: [
      ...(contractCode ? ([['เลขที่ข้อตกลง', contractCode]] as [string, string][]) : []),
      ['ผู้ขายรหัส', supplier.code || String(supplier.supplier_id)],
    ],
    branch,
    body: `
      <div class="contract">
        <p>ข้อตกลงฉบับนี้ทำขึ้นที่ ${known(profile.contract_place || branch?.name, 'l')} เมื่อวันที่ ${blank('s')} เดือน ${blank()} พ.ศ. ${blank('s')} ระหว่าง</p>
        <p>${buyer} (ต่อไปนี้เรียกว่า "ผู้ซื้อ") กับ</p>
        <p>${seller} (ต่อไปนี้เรียกว่า "ผู้ขาย")</p>
        <p>ทั้งสองฝ่ายตกลงกันดังนี้</p>

        ${clause('ปริมาณ', `
          <p class="sub">ผู้ขายตกลงจัดส่งไก่ปริมาณรวม ${value(esc(money(options.quantity, 0)))} ตัว ต่อ${perLabel}
          โดยทยอยส่งตามใบสั่งซื้อของผู้ซื้อแต่ละรอบ ซึ่งใบสั่งซื้อถือเป็นส่วนหนึ่งของข้อตกลงนี้</p>`)}

        ${clause('ราคา', `
          <p class="sub">ราคาซื้อขาย ${price} ราคานี้ใช้ตลอดอายุข้อตกลง เว้นแต่ทั้งสองฝ่ายตกลงเปลี่ยนเป็นหนังสือหรือระบุไว้ในใบสั่งซื้อรอบนั้น</p>`)}

        ${clause('การส่งมอบ', `
          <p class="sub">ผู้ขายส่งไก่ ณ ${known(branch?.address || branch?.name, 'l')} ภายในเวลา ${blank('s')} น. ของวันที่กำหนดในใบสั่งซื้อ
          หากส่งล่าช้าเกิน ${known(profile.late_delivery_hours, 's')} ชั่วโมง ผู้ซื้อมีสิทธิ์ปฏิเสธรับไก่รอบนั้นได้</p>`)}

        ${clause('การตรวจรับ', `
          <p class="sub">ผู้ซื้อตรวจนับและตรวจสภาพไก่เมื่อรับมอบ ไก่ที่ตาย บาดเจ็บ หรือมีสภาพไม่เหมาะสม ผู้ซื้อมีสิทธิ์ปฏิเสธ
          ขอเปลี่ยน หรือหักจำนวนออกจากยอดชำระ จำนวนที่ผู้ซื้อตรวจรับจริงตามใบรับของ ใช้เป็นฐานคิดเงิน</p>`)}

        ${clause('ความเสี่ยงระหว่างขนส่ง', `
          <p class="sub">ความเสียหายหรือสูญหายของไก่ก่อนที่ผู้ซื้อตรวจรับเสร็จ เป็นความรับผิดชอบของผู้ขาย</p>`)}

        ${clause('การชำระเงิน', payment)}

        ${clause('ระยะเวลาและการยกเลิก', `
          <p class="sub">ข้อตกลงนี้มีผลตั้งแต่วันที่ ${blank()} ถึงวันที่ ${blank()}
          ฝ่ายใดประสงค์ยกเลิกก่อนครบกำหนดต้องแจ้งอีกฝ่ายเป็นหนังสือล่วงหน้าไม่น้อยกว่า ${known(profile.cancel_notice_days, 's')} วัน</p>`)}

        ${clause('การผิดข้อตกลง', `
          <p class="sub">หากฝ่ายใดไม่ปฏิบัติตามข้อตกลง อีกฝ่ายแจ้งเป็นหนังสือให้แก้ไขภายใน ${blank('s')} วัน
          หากไม่แก้ไข อีกฝ่ายมีสิทธิ์บอกเลิกข้อตกลงและเรียกค่าเสียหายตามความเป็นจริง</p>`)}

        <div class="keep">
        ${clause('อื่น ๆ', `
          <p class="sub">การแก้ไขเพิ่มเติมต้องทำเป็นหนังสือและลงนามทั้งสองฝ่าย ข้อพิพาทให้เจรจากันก่อน
          และใช้กฎหมายไทยบังคับ ข้อตกลงนี้ทำเป็นสองฉบับ มีข้อความตรงกัน แต่ละฝ่ายเก็บไว้ฝ่ายละหนึ่งฉบับ
          ทั้งสองฝ่ายได้อ่านและเข้าใจแล้ว จึงลงลายมือชื่อไว้เป็นหลักฐาน</p>`)}

        <div class="sign four">
          <div><div class="line">${buyerSign}</div></div>
          <div><div class="line">${sellerSign}</div></div>
          <div><div class="line">(____________________)<br>พยาน</div></div>
          <div><div class="line">(____________________)<br>พยาน</div></div>
        </div>
        </div>
      </div>`,
  };
}
