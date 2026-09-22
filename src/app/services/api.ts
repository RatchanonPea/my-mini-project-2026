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

export interface CreateUserPayload {
  username: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  email?: string;
  phone?: string;
  role_id?: number;
  status?: number;
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

export interface DashboardSummary extends SummaryTotals {
  top_products: TopProduct[];
}

export type ReportGroupBy = 'day' | 'week' | 'month' | 'year';

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
  note: string | null;
  updated_at?: string;
  updated_by_name?: string | null;
}

export interface PurchasePayload {
  order_date: string;
  supplier_id?: number | null;
  quantity: number;
  unit_cost?: number | null;
  note?: string | null;
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

export type SupplierPayload = Pick<Supplier, 'name'> & Partial<Pick<Supplier, 'phone' | 'address' | 'note' | 'is_active' | 'latitude' | 'longitude'>>;

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

  createSaleItem(item: { sale_date: string; product_id: number; quantity: number }): Observable<SaleItem> {
    return this.http.post<any>(`${this.baseUrl}/sales/createSaleItem`, item).pipe(
      map((response) => this.extractData<SaleItem>(response))
    );
  }

  updateSaleItem(item: { item_id: number; product_id: number; quantity: number }): Observable<SaleItem> {
    return this.http.post<any>(`${this.baseUrl}/sales/updateSaleItem`, item).pipe(
      map((response) => this.extractData<SaleItem>(response))
    );
  }

  deleteSaleItem(item_id: number): Observable<{ item_id: number }> {
    return this.http.post<any>(`${this.baseUrl}/sales/deleteSaleItem`, { item_id }).pipe(
      map((response) => this.extractData<{ item_id: number }>(response))
    );
  }

  getDashboardSummary(date: string): Observable<DashboardSummary> {
    return this.http.get<any>(`${this.baseUrl}/dashboard/summary`, { params: { date } }).pipe(
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

  getInventoryLedger(p: { type?: LedgerType | ''; date?: string | null; page: number; pageSize: number }): Observable<LedgerPage> {
    let params = new HttpParams().set('page', p.page).set('pageSize', p.pageSize);
    if (p.type) {
      params = params.set('type', p.type);
    }
    if (p.date) {
      params = params.set('date', p.date);
    }
    return this.http.get<any>(`${this.baseUrl}/inventory/ledger`, { params }).pipe(
      map((response) => this.extractData<LedgerPage>(response))
    );
  }

  createStockAdjustment(item: { adjust_date: string; type: 'waste' | 'adjust'; quantity: number; note?: string | null }): Observable<unknown> {
    return this.http.post<any>(`${this.baseUrl}/inventory/createAdjustment`, item).pipe(
      map((response) => this.extractData<unknown>(response))
    );
  }

  updateInventorySettings(settings: { low_stock_threshold?: number; unit_cost?: number }): Observable<InventorySummary> {
    return this.http.post<any>(`${this.baseUrl}/inventory/updateSettings`, settings).pipe(
      map((response) => this.extractData<InventorySummary>(response))
    );
  }

  searchPurchases(p: SearchParams & { status?: PurchaseStatus | '' }): Observable<PagedResult<PurchaseOrder>> {
    let params = this.toSearchParams(p);
    if (p.status) {
      params = params.set('status', p.status);
    }
    return this.http.get<any>(`${this.baseUrl}/purchases/search`, { params }).pipe(
      map((response) => this.extractData<PagedResult<PurchaseOrder>>(response))
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
