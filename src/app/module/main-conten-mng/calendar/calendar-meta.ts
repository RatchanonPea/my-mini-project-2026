import { Router } from '@angular/router';
import { CalendarEvent, CalendarEventType } from '../../../services/api';

export interface TypeMeta {
  label: string;
  icon: string;
  /** css class: the colour family of the chip */
  tone: 'sale' | 'expense' | 'order' | 'receive' | 'due' | 'paid' | 'stock' | 'contract';
}

export const META: Record<CalendarEventType, TypeMeta> = {
  sale: { label: 'ยอดขาย', icon: 'point_of_sale', tone: 'sale' },
  expense: { label: 'รายจ่าย', icon: 'receipt_long', tone: 'expense' },
  po_order: { label: 'สั่งซื้อไก่', icon: 'local_shipping', tone: 'order' },
  po_receive: { label: 'รับไก่', icon: 'inventory', tone: 'receive' },
  po_due: { label: 'ครบกำหนดจ่าย', icon: 'event_upcoming', tone: 'due' },
  po_paid: { label: 'จ่ายผู้ขายแล้ว', icon: 'paid', tone: 'paid' },
  stock_adjust: { label: 'ปรับสต็อก', icon: 'tune', tone: 'stock' },
  contract_start: { label: 'ทำข้อตกลง', icon: 'description', tone: 'contract' },
  contract_end: { label: 'ข้อตกลงสิ้นสุด', icon: 'event_busy', tone: 'contract' },
};

export const STATUS_LABEL: Record<string, string> = {
  ordered: 'สั่งแล้ว', received: 'รับแล้ว', cancelled: 'ยกเลิก',
  unpaid: 'ยังไม่จ่าย', overdue: 'เลยกำหนด', paid: 'จ่ายแล้ว',
  waste: 'ของเสีย', adjust: 'ปรับยอด',
  active: 'ใช้อยู่', ended: 'สิ้นสุดแล้ว',
};

/** Goes to the page that holds the event's real data, landing on it where the page supports that. */
export function openCalendarEvent(router: Router, e: CalendarEvent): void {
  switch (e.type) {
    case 'po_order':
    case 'po_receive':
    case 'po_due':
    case 'po_paid':
      router.navigate(['/main-conten-mng/purchases'], { queryParams: { openPo: e.ref_id } });
      return;
    case 'sale':
      router.navigate(['/main-conten-mng/sales'], { queryParams: { date: e.date } });
      return;
    case 'expense':
      router.navigate(['/main-conten-mng/expenses'], { queryParams: { date: e.date, openExpense: e.ref_id } });
      return;
    case 'stock_adjust':
      router.navigate(['/main-conten-mng/inventory'], { queryParams: { openAdjust: e.ref_id } });
      return;
    case 'contract_start':
    case 'contract_end':
      if (e.supplier_id) router.navigate(['/main-conten-mng/suppliers', e.supplier_id]);
      return;
  }
}
