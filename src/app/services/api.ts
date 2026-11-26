import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ProductItem {
  product_id: number;
  product_code?: string;
  product_name: string;
  category_id?: number | null;
  category_name?: string | null;
  price: number;
  is_active?: boolean | number;
  chicken_units?: number;
  created_at?: string;
  updated_at?: string;
  updated_by?: number | null;
  updated_by_name?: string | null;
}

export interface User {
  user_id: number;
  code?: string;
  username: string;
  first_name?: string;
  last_name?: string;
  first_name_th?: string;
  last_name_th?: string;
  first_name_en?: string;
  last_name_en?: string;
  full_name_th?: string;
  full_name_en?: string;
  full_name?: string;
  email?: string | null;
  phone?: string | null;
  role_id?: number;
  role_name?: string;
  status?: boolean | number | string;
  created_at?: string;
  updated_at?: string;
  updated_by?: number | null;
  updated_by_name?: string | null;
}

export interface Role {
  role_id: number;
  code?: string;
  role_name: string;
  description?: string;
  status?: string;
}

export interface UserLegal {
  user_id: number;
  national_id: string | null;
  address: string | null;
}

export interface CreateUserPayload {
  username: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  email?: string;
  phone?: string;
  role_id?: number;
  status?: number;
  national_id?: string | null;
  address?: string | null;
}

export interface UpdateUserPayload {
  user_id: number;
  code?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role_id?: number;
  status?: number;
  password_hash?: string;
  national_id?: string | null;
  address?: string | null;
}

export interface Category {
  category_id: number;
  code?: string;
  category_name: string;
  type?: string;
}

export interface ExpenseItem {
  expense_id: number;
  code?: string;  description: string;
  amount: number;
  expense_date: string;
  category_id: number;
  category_name?: string;
  updated_at?: string;
  updated_by?: number | null;
  updated_by_name?: string | null;
}

export interface SaleItem {
  item_id: number;
  code?: string;  sale_date: string;
  product_id: number;
  product_name: string;
  quantity: number;
  total_price: number;
  unit_price: number;
  updated_at?: string;
  updated_by?: number | null;
  updated_by_name?: string | null;
}

export interface SummaryTotals {
  sales_total: number;
  expense_total: number;
  sale_item_count: number;
  profit: number;
  chicken_cost: number;
  chicken_profit: number;
}

export interface TopProduct {
  product_id: number;
  product_name: string;
  sold: number;
  revenue: number;
}

export type ReportGroupBy = 'day' | 'week' | 'month' | 'year';

export interface DashboardSummary extends SummaryTotals {
  top_products: TopProduct[];
  period: { groupBy: ReportGroupBy; from: string; to: string };
}

export interface ReportPeriod {
  period: string;
  sales_total: number;
  sale_qty: number;
  chicken_sold: number;
  expense_total: number;
  chicken_received: number;
  purchase_cost: number;
  profit: number;
}

export interface ReportBreakdown {
  groupBy: ReportGroupBy;
  periods: ReportPeriod[];
}

export interface SearchParams {
  keyword?: string;
  date?: string | null;
  page: number;
  pageSize: number;
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  total_amount: number;
  total_quantity?: number;
  page: number;
  pageSize: number;
  /** purchases only: received orders not yet paid, and how many of those are past their due date */
  unpaid_count?: number;
  unpaid_amount?: number;
  overdue_count?: number;
}

export interface InventorySummary {
  item_id: number;
  code: string;
  item_name: string;
  unit: string;
  received: number;
  sold: number;
  waste: number;
  adjust: number;
  balance: number;
  low_stock_threshold: number;
  is_low: boolean;
  unit_cost: number;
  standard_cost: number;
  cost_source: 'average' | 'standard';
  stock_value: number;
  sold_cost: number;
  waste_cost: number;
  chicken_revenue: number;
  gross_profit: number;
  updated_at?: string;
  updated_by_name?: string | null;
}

export type LedgerType = 'receive' | 'sale' | 'waste' | 'adjust';

export interface LedgerItem {
  ledger_date: string;
  type: LedgerType;
  ref_code: string;
  ref_id: number | null;
  adjust_id: number | null;
  quantity: number;
  balance_after: number;
  note: string | null;
  event_at: string | null;
  by_name: string | null;
  unit_cost: number | null;
  total_cost: number | null;
  supplier: string | null;
  edit_note: string | null;
  approved_by_name: string | null;
}

export interface SalesOfDayLine {
  code: string;
  product_name: string;
  quantity: number;
  chicken_units: number;
  chickens_used: number;
  total_price: number;
}

export interface LedgerPage {
  items: LedgerItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type PurchaseStatus = 'ordered' | 'received' | 'cancelled';

export interface PurchaseOrder {
  po_id: number;
  code: string;
  order_date: string;
  supplier_id: number | null;
  supplier_name: string | null;
  supplier_phone?: string | null;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  status: PurchaseStatus;
  received_date: string | null;
  received_at?: string | null;
  received_by_name?: string | null;
  /** the supplier's agreement in force when the order was made */
  contract_id?: number | null;
  contract_code?: string | null;
  /** days of credit copied from the agreement; due_date = received date + credit_days (set on receive) */
  credit_days?: number | null;
  due_date?: string | null;
  paid_date?: string | null;
  is_overdue?: number | boolean;
  note: string | null;
  edit_note?: string | null;
  approved_by_name?: string | null;
  updated_at?: string;
  updated_by_name?: string | null;
}

export type CalendarEventType = 'sale' | 'expense' | 'po_order' | 'po_receive' | 'po_due' | 'po_paid' | 'stock_adjust' | 'contract_start' | 'contract_end';

export interface CalendarEvent {
  type: CalendarEventType;
  /** YYYY-MM-DD */
  date: string;
  title: string;
  subtitle: string | null;
  amount: number | null;
  /** po_id / expense_id / adjust_id / contract_id; null for the daily sales total */
  ref_id: number | null;
  supplier_id: number | null;
  /** purchase: ordered/received/cancelled, or unpaid/overdue/paid on a payment; stock_adjust: waste/adjust; contract: active/ended */
  status: string | null;
}

export type PurchasePayment = 'unpaid' | 'overdue' | 'paid';

/** A supply agreement printed for a supplier; the one with status 'active' sets the default price and credit of new orders. */
export interface SupplyContract {
  contract_id: number;
  code: string;
  supplier_id: number;
  branch_id: number | null;
  quantity: number;
  per: 'month' | 'year';
  unit_price: number | null;
  credit_days: number | null;
  status: 'active' | 'ended';
  created_at: string;
  created_by_name?: string | null;
  ended_at: string | null;
}

/** What the printed document used (kept so a reprint never changes when the shop or supplier is edited later). */
export interface SupplyContractSnapshot {
  profile: ShopProfile;
  owner: ShopOwner | null;
  branch: Branch | null;
  supplier: Supplier;
}

export interface SupplyContractDetail extends SupplyContract {
  snapshot: SupplyContractSnapshot | null;
}

export interface SupplyContractPayload {
  supplier_id: number;
  quantity: number;
  per: 'month' | 'year';
  unit_price: number | null;
  credit_days: number | null;
  branch_id: number | null;
  snapshot: SupplyContractSnapshot;
}

export interface PurchasePayload {
  order_date: string;
  supplier_id?: number | null;
  quantity: number;
  unit_cost?: number | null;
  note?: string | null;
  edit_note?: string | null;
  approved_by?: number | null;
}

export interface ApproverInfo {
  user_id: number;
  username: string;
  role_name: string;
  display_name: string;
}

export interface Supplier {
  supplier_id: number;
  code?: string;
  name: string;
  phone: string | null;
  address: string | null;
  note: string | null;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  // contract details (printed on the supply agreement)
  entity_type?: ShopEntityType;
  /** juristic: company name; individual: full name as on the ID card */
  legal_name?: string | null;
  contact_position?: string | null;
  tax_id?: string | null;
  contact_name?: string | null;
  bank_name?: string | null;
  bank_account_no?: string | null;
  bank_account_name?: string | null;
  credit_days?: number | null;
  created_at?: string;
  updated_at?: string;
  updated_by?: number | null;
  updated_by_name?: string | null;
}

export interface SupplierOrderHistory {
  po_id: number;
  code: string;
  order_date: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  status: PurchaseStatus;
  received_date: string | null;
  received_at: string | null;
}

export interface SupplierProfile {
  supplier: Supplier;
  orders: SupplierOrderHistory[];
  summary: {
    order_count: number;
    total_received: number;
    total_spent: number;
    last_order_date: string | null;
  };
}

export type SupplierPayload = Pick<Supplier, 'name'> &
  Partial<Pick<Supplier, 'phone' | 'address' | 'note' | 'is_active' | 'latitude' | 'longitude' | 'entity_type' | 'legal_name' | 'contact_position' | 'tax_id' | 'contact_name' | 'bank_name' | 'bank_account_no' | 'bank_account_name' | 'credit_days'>>;

// ---------- Shop master data ----------

export type ShopEntityType = 'individual' | 'juristic';

export interface ShopProfile {
  shop_id: number;
  shop_name: string;
  entity_type: ShopEntityType;
  legal_name: string | null;
  /** the user flagged as the shop owner / authorised signatory: contracts use their details */
  owner_user_id: number | null;
  owner_name: string | null;
  signatory_position: string | null;
  tax_id: string | null;
  is_vat: boolean;
  bank_name: string | null;
  bank_account_no: string | null;
  bank_account_name: string | null;
  contract_place: string | null;
  default_credit_days: number | null;
  late_delivery_hours: number | null;
  cancel_notice_days: number | null;
  updated_at?: string | null;
  updated_by_name?: string | null;
}

export interface Branch {
  branch_id: number;
  code?: string;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_main: boolean;
  is_active: boolean;
  updated_at?: string | null;
  updated_by_name?: string | null;
}

/** the owner user's details as the contracts use them */
export interface ShopOwner {
  user_id: number;
  full_name_th: string | null;
  full_name_en: string | null;
  phone: string | null;
  email: string | null;
  /** 13-digit ID card number (null until a manager fills it in on the user's profile) */
  national_id: string | null;
  address: string | null;
  role_id: number;
  status: boolean | number;
}

export interface ShopSettings {
  profile: ShopProfile | null;
  branches: Branch[];
  owner: ShopOwner | null;
}

export type ShopProfilePayload = Partial<Omit<ShopProfile, 'shop_id' | 'updated_at' | 'updated_by_name'>>;
export type BranchPayload = Partial<Pick<Branch, 'name' | 'address' | 'phone' | 'email' | 'is_main' | 'is_active'>>;

export interface ActivityLogItem {
  log_id: number;
  action: string;
  entity: string;
  entity_id: number | null;
  description: string | null;
  created_at: string;
  user_id: number | null;
  user_name: string | null;
}

export interface NotificationItem extends ActivityLogItem {
  is_read: boolean | number;
}

export interface PurchasePrices {
  prices: number[];
  standard_cost: number;
}

export type ExpensePayload = Omit<ExpenseItem, 'expense_id'>;

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  returnObject?: T;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly baseUrl = environment.backendApiUrl.replace(/\/$/, '');

  constructor(private http: HttpClient) {}

  private extractData<T>(response: any): T {
    if (response?.returnObject !== undefined) {
      return response.returnObject as T;
    }
    if (response?.data !== undefined) {
      return response.data as T;
    }
    return response as T;
  }

  getProducts(): Observable<ProductItem[]> {
    return this.http.get<any>(`${this.baseUrl}/products`).pipe(
      map((response) => this.extractData<ProductItem[]>(response))
    );
  }

  getProduct(id: number): Observable<ProductItem> {
    return this.http.get<any>(`${this.baseUrl}/products/${id}`).pipe(
      map((response) => this.extractData<ProductItem>(response))
    );
  }

  private normalizeSingleItem<T>(data: T | T[]): T {
    return Array.isArray(data) ? data[0] as T : data as T;
  }

  createProduct(item: Omit<ProductItem, 'product_id'>): Observable<ProductItem> {
    return this.http.post<any>(`${this.baseUrl}/products/createProduct`, item).pipe(
      map((response) => this.extractData<ProductItem>(response))
    );
  }

  updateProduct(item: Partial<ProductItem> & { product_id: number }): Observable<ProductItem> {
    return this.http.post<any>(`${this.baseUrl}/products/updateProduct`, item).pipe(
      map((response) => this.normalizeSingleItem(this.extractData<ProductItem | ProductItem[]>(response)))
    );
  }

  deleteProduct(product_id: number): Observable<ProductItem> {
    return this.http.post<any>(`${this.baseUrl}/products/updateProduct`, { product_id, is_active: 0 }).pipe(
      map((response) => this.normalizeSingleItem(this.extractData<ProductItem | ProductItem[]>(response)))
    );
  }

  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.baseUrl}/users`);
  }

  /** ID card number + address of a user: managers / admins only (not part of the user list) */
  getUserLegal(id: number): Observable<UserLegal> {
    return this.http.get<ApiResponse<UserLegal>>(`${this.baseUrl}/users/${id}/legal`).pipe(map((response) => response.data as UserLegal));
  }

  getRoles(status: 'active' | 'inactive' | 'all'): Observable<Role[]> {
    return this.http.get<any>(`${this.baseUrl}/roles`, {
      params: { status },
    }).pipe(
      map((response) => {
        if (Array.isArray(response)) {
          return response as Role[];
        }
        if (Array.isArray(response?.returnObject)) {
          return response.returnObject as Role[];
        }
        return (response?.data ?? []) as Role[];
      })
    );
  }

  createUser(user: CreateUserPayload): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/users/createUser`, user);
  }

  updateUser(user: UpdateUserPayload): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.baseUrl}/users/updateUser`, user);
  }

  getCategories(type?: string): Observable<Category[]> {
    return this.http.get<any>(`${this.baseUrl}/categories`, { params: type ? { type } : {} }).pipe(
      map((response) => this.extractData<Category[]>(response))
    );
  }

  getExpenses(): Observable<ExpenseItem[]> {
    return this.http.get<any>(`${this.baseUrl}/expenses`).pipe(
      map((response) => this.extractData<ExpenseItem[]>(response))
    );
  }

  createExpense(item: ExpensePayload): Observable<ExpenseItem> {
    return this.http.post<any>(`${this.baseUrl}/expenses/createExpense`, item).pipe(
      map((response) => this.extractData<ExpenseItem>(response))
    );
  }

  updateExpense(item: Partial<ExpensePayload> & { expense_id: number }): Observable<ExpenseItem> {
    return this.http.post<any>(`${this.baseUrl}/expenses/updateExpense`, item).pipe(
      map((response) => this.extractData<ExpenseItem>(response))
    );
  }

  getSales(date: string): Observable<SaleItem[]> {
    return this.http.get<any>(`${this.baseUrl}/sales`, { params: { date } }).pipe(
      map((response) => this.extractData<SaleItem[]>(response))
    );
  }

  createSaleItem(item: { sale_date: string; product_id: number; quantity: number; unit_price: number }): Observable<SaleItem> {
    return this.http.post<any>(`${this.baseUrl}/sales/createSaleItem`, item).pipe(
      map((response) => this.extractData<SaleItem>(response))
    );
  }

  updateSaleItem(item: { item_id: number; product_id: number; quantity: number; unit_price: number }): Observable<SaleItem> {
    return this.http.post<any>(`${this.baseUrl}/sales/updateSaleItem`, item).pipe(
      map((response) => this.extractData<SaleItem>(response))
    );
  }

  deleteSaleItem(item_id: number): Observable<{ item_id: number }> {
    return this.http.post<any>(`${this.baseUrl}/sales/deleteSaleItem`, { item_id }).pipe(
      map((response) => this.extractData<{ item_id: number }>(response))
    );
  }

  getDashboardSummary(date: string, groupBy: ReportGroupBy = 'day'): Observable<DashboardSummary> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/summary`, { params: { date, groupBy } }).pipe(
      map((response) => this.extractData<DashboardSummary>(response))
    );
  }

  getReportSummary(from: string, to: string): Observable<SummaryTotals> {
    return this.http.get<any>(`${this.baseUrl}/reports/summary`, { params: { from, to } }).pipe(
      map((response) => this.extractData<SummaryTotals>(response))
    );
  }

  getReportBreakdown(from: string, to: string, groupBy: ReportGroupBy): Observable<ReportBreakdown> {
    return this.http.get<any>(`${this.baseUrl}/reports/breakdown`, { params: { from, to, groupBy } }).pipe(
      map((response) => this.extractData<ReportBreakdown>(response))
    );
  }

  searchActivityLogs(p: SearchParams & { userId?: number }): Observable<PagedResult<ActivityLogItem>> {
    let params = this.toSearchParams(p);
    if (p.userId) {
      params = params.set('userId', p.userId);
    }
    return this.http.get<any>(`${this.baseUrl}/activity-logs/search`, { params }).pipe(
      map((response) => this.extractData<PagedResult<ActivityLogItem>>(response))
    );
  }

  // The notification bell: every action system-wide, not just this viewer's own — with per-viewer
  // read state, unlike searchActivityLogs above (that one is scoped to one user's own history).
  getNotifications(userId: number, page: number, pageSize: number): Observable<PagedResult<NotificationItem>> {
    const params = new HttpParams().set('userId', userId).set('page', page).set('pageSize', pageSize);
    return this.http.get<any>(`${this.baseUrl}/activity-logs/notifications`, { params }).pipe(
      map((response) => this.extractData<PagedResult<NotificationItem>>(response))
    );
  }

  getUnreadNotificationCount(userId: number): Observable<number> {
    return this.http.get<any>(`${this.baseUrl}/activity-logs/notifications/unread-count`, { params: { userId } }).pipe(
      map((response) => this.extractData<{ unread: number }>(response).unread)
    );
  }

  markNotificationRead(userId: number, logId: number): Observable<unknown> {
    return this.http.post<any>(`${this.baseUrl}/activity-logs/notifications/mark-read`, { userId, logId }).pipe(
      map((response) => this.extractData<unknown>(response))
    );
  }

  markAllNotificationsRead(userId: number): Observable<unknown> {
    return this.http.post<any>(`${this.baseUrl}/activity-logs/notifications/mark-all-read`, { userId }).pipe(
      map((response) => this.extractData<unknown>(response))
    );
  }

  private toSearchParams(p: SearchParams): HttpParams {
    let params = new HttpParams().set('page', p.page).set('pageSize', p.pageSize);
    if (p.keyword?.trim()) {
      params = params.set('keyword', p.keyword.trim());
    }
    if (p.date) {
      params = params.set('date', p.date);
    }
    return params;
  }

  searchExpenses(p: SearchParams): Observable<PagedResult<ExpenseItem>> {
    return this.http.get<any>(`${this.baseUrl}/expenses/search`, { params: this.toSearchParams(p) }).pipe(
      map((response) => this.extractData<PagedResult<ExpenseItem>>(response))
    );
  }

  searchSales(p: SearchParams): Observable<PagedResult<SaleItem>> {
    return this.http.get<any>(`${this.baseUrl}/sales/search`, { params: this.toSearchParams(p) }).pipe(
      map((response) => this.extractData<PagedResult<SaleItem>>(response))
    );
  }

  getInventorySummary(): Observable<InventorySummary> {
    return this.http.get<any>(`${this.baseUrl}/inventory/summary`).pipe(
      map((response) => this.extractData<InventorySummary>(response))
    );
  }

  getInventoryLedger(p: { type?: LedgerType | ''; date?: string | null; page: number; pageSize: number; adjustId?: number; poId?: number }): Observable<LedgerPage> {
    let params = new HttpParams().set('page', p.page).set('pageSize', p.pageSize);
    if (p.type) {
      params = params.set('type', p.type);
    }
    if (p.date) {
      params = params.set('date', p.date);
    }
    if (p.adjustId) {
      params = params.set('adjustId', p.adjustId);
    }
    if (p.poId) {
      params = params.set('poId', p.poId);
    }
    return this.http.get<any>(`${this.baseUrl}/inventory/ledger`, { params }).pipe(
      map((response) => this.extractData<LedgerPage>(response))
    );
  }

  // Used when opening a purchase order's detail directly (e.g. from a notification) without
  // going through the Purchases list/search first.
  getPurchaseOrder(poId: number): Observable<PurchaseOrder> {
    return this.http.get<any>(`${this.baseUrl}/purchases/detail/${poId}`).pipe(
      map((response) => this.extractData<PurchaseOrder>(response))
    );
  }

  createStockAdjustment(item: { adjust_date: string; type: 'waste' | 'adjust'; quantity: number; note?: string | null }): Observable<unknown> {
    return this.http.post<any>(`${this.baseUrl}/inventory/createAdjustment`, item).pipe(
      map((response) => this.extractData<unknown>(response))
    );
  }

  updateStockAdjustment(item: { adjust_id: number; adjust_date?: string; quantity?: number; edit_note?: string | null; approved_by?: number | null }): Observable<unknown> {
    return this.http.post<any>(`${this.baseUrl}/inventory/updateAdjustment`, item).pipe(
      map((response) => this.extractData<unknown>(response))
    );
  }

  // Manager/Admin approval, e.g. before correcting a wrong inventory entry — the selected
  // approver's own password is checked server-side; never trust a client-side check alone.
  verifyApprover(userId: number, password: string): Observable<ApproverInfo> {
    return this.http.post<any>(`${this.baseUrl}/users/verify-approver`, { user_id: userId, password }).pipe(
      map((response) => this.extractData<ApproverInfo>(response))
    );
  }

  updateInventorySettings(settings: { low_stock_threshold?: number; unit_cost?: number }): Observable<InventorySummary> {
    return this.http.post<any>(`${this.baseUrl}/inventory/updateSettings`, settings).pipe(
      map((response) => this.extractData<InventorySummary>(response))
    );
  }

  searchPurchases(p: SearchParams & { status?: PurchaseStatus | ''; payment?: PurchasePayment | '' }): Observable<PagedResult<PurchaseOrder>> {
    let params = this.toSearchParams(p);
    if (p.status) {
      params = params.set('status', p.status);
    }
    if (p.payment) {
      params = params.set('payment', p.payment);
    }
    return this.http.get<any>(`${this.baseUrl}/purchases/search`, { params }).pipe(
      map((response) => this.extractData<PagedResult<PurchaseOrder>>(response))
    );
  }

  /** every dated thing in [from, to] (YYYY-MM-DD, at most 100 days): sales, expenses, purchase orders and payments, stock adjustments, agreements */
  getCalendarEvents(from: string, to: string): Observable<CalendarEvent[]> {
    const params = new HttpParams().set('from', from).set('to', to);
    return this.http.get<any>(`${this.baseUrl}/calendar/events`, { params }).pipe(
      map((response) => this.extractData<CalendarEvent[]>(response))
    );
  }

  getPurchasePrices(): Observable<PurchasePrices> {
    return this.http.get<any>(`${this.baseUrl}/purchases/prices`).pipe(
      map((response) => this.extractData<PurchasePrices>(response))
    );
  }

  createPurchase(item: PurchasePayload): Observable<PurchaseOrder> {
    return this.http.post<any>(`${this.baseUrl}/purchases/createPurchase`, item).pipe(
      map((response) => this.extractData<PurchaseOrder>(response))
    );
  }

  updatePurchase(item: Partial<PurchasePayload> & { po_id: number }): Observable<PurchaseOrder> {
    return this.http.post<any>(`${this.baseUrl}/purchases/updatePurchase`, item).pipe(
      map((response) => this.extractData<PurchaseOrder>(response))
    );
  }

  receivePurchase(po_id: number, received_date?: string): Observable<PurchaseOrder> {
    return this.http.post<any>(`${this.baseUrl}/purchases/receivePurchase`, { po_id, received_date }).pipe(
      map((response) => this.extractData<PurchaseOrder>(response))
    );
  }

  /** records that the supplier was paid for a received order */
  payPurchase(po_id: number, paid_date?: string): Observable<PurchaseOrder> {
    return this.http.post<any>(`${this.baseUrl}/purchases/payPurchase`, { po_id, paid_date }).pipe(
      map((response) => this.extractData<PurchaseOrder>(response))
    );
  }

  getSupplierContracts(supplierId: number): Observable<SupplyContract[]> {
    return this.http.get<any>(`${this.baseUrl}/supply-contracts/supplier/${supplierId}`).pipe(
      map((response) => this.extractData<SupplyContract[]>(response))
    );
  }

  /** one agreement with the buyer / seller details as they were printed */
  getSupplyContract(contractId: number): Observable<SupplyContractDetail> {
    return this.http.get<any>(`${this.baseUrl}/supply-contracts/${contractId}`).pipe(
      map((response) => this.extractData<SupplyContractDetail>(response))
    );
  }

  createSupplyContract(item: SupplyContractPayload): Observable<SupplyContract> {
    return this.http.post<any>(`${this.baseUrl}/supply-contracts/createContract`, item).pipe(
      map((response) => this.extractData<SupplyContract>(response))
    );
  }

  endSupplyContract(contractId: number): Observable<SupplyContract> {
    return this.http.post<any>(`${this.baseUrl}/supply-contracts/endContract`, { contract_id: contractId }).pipe(
      map((response) => this.extractData<SupplyContract>(response))
    );
  }

  cancelPurchase(po_id: number): Observable<PurchaseOrder> {
    return this.http.post<any>(`${this.baseUrl}/purchases/cancelPurchase`, { po_id }).pipe(
      map((response) => this.extractData<PurchaseOrder>(response))
    );
  }

  getSalesOfDay(date: string): Observable<SalesOfDayLine[]> {
    return this.http.get<any>(`${this.baseUrl}/inventory/sales-of-day`, { params: { date } }).pipe(
      map((response) => this.extractData<SalesOfDayLine[]>(response))
    );
  }

  getSuppliers(activeOnly = false): Observable<Supplier[]> {
    return this.http.get<any>(`${this.baseUrl}/suppliers`, { params: activeOnly ? { active: 'true' } : {} }).pipe(
      map((response) => this.extractData<Supplier[]>(response))
    );
  }

  searchSuppliers(p: SearchParams): Observable<PagedResult<Supplier>> {
    return this.http.get<any>(`${this.baseUrl}/suppliers/search`, { params: this.toSearchParams(p) }).pipe(
      map((response) => this.extractData<PagedResult<Supplier>>(response))
    );
  }

  getSupplierProfile(supplierId: number): Observable<SupplierProfile> {
    return this.http.get<any>(`${this.baseUrl}/suppliers/profile/${supplierId}`).pipe(
      map((response) => this.extractData<SupplierProfile>(response))
    );
  }

  getShop(): Observable<ShopSettings> {
    return this.http.get<any>(`${this.baseUrl}/shop`).pipe(map((response) => this.extractData<ShopSettings>(response)));
  }

  updateShopProfile(item: ShopProfilePayload): Observable<ShopProfile> {
    return this.http.post<any>(`${this.baseUrl}/shop/updateProfile`, item).pipe(map((response) => this.extractData<ShopProfile>(response)));
  }

  createBranch(item: BranchPayload & { name: string }): Observable<Branch> {
    return this.http.post<any>(`${this.baseUrl}/shop/createBranch`, item).pipe(map((response) => this.extractData<Branch>(response)));
  }

  updateBranch(item: BranchPayload & { branch_id: number }): Observable<Branch> {
    return this.http.post<any>(`${this.baseUrl}/shop/updateBranch`, item).pipe(map((response) => this.extractData<Branch>(response)));
  }

  createSupplier(item: SupplierPayload): Observable<Supplier> {
    return this.http.post<any>(`${this.baseUrl}/suppliers/createSupplier`, item).pipe(
      map((response) => this.extractData<Supplier>(response))
    );
  }

  updateSupplier(item: Partial<SupplierPayload> & { supplier_id: number }): Observable<Supplier> {
    return this.http.post<any>(`${this.baseUrl}/suppliers/updateSupplier`, item).pipe(
      map((response) => this.extractData<Supplier>(response))
    );
  }
}
