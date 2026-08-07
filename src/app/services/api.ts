import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ProductItem {
  product_id: number;
  product_code?: string;
  product_name: string;
  category_id?: number;
  price: number;
  is_active?: boolean | number;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  user_id: number;
  code?: string;
  username: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  role_id?: number;
  role_name?: string;
  status?: boolean | number | string;
  created_at?: string;
  updated_at?: string;
  updated_by?: string;
  created_by?: string;
}

export interface Role {
  role_id: number;
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
  created_by?: string;
  updated_by?: string;
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
  updated_by?: string;
}

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
}
