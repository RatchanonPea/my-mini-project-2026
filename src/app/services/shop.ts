import { Injectable, inject } from '@angular/core';
import { Observable, catchError, firstValueFrom, map, of, shareReplay, tap } from 'rxjs';
import { ApiService, Branch, ShopProfile, ShopSettings } from './api';

/** Used while the master data is unavailable (not saved yet, or the API is down): printing must still work. */
export const DEFAULT_SHOP: ShopProfile = {
  shop_id: 1,
  shop_name: 'Arre ไก่หมุน',
  entity_type: 'individual',
  legal_name: null,
  owner_user_id: null,
  owner_name: 'อารี อิ่มสอาด',
  signatory_position: null,
  tax_id: null,
  is_vat: false,
  bank_name: null,
  bank_account_no: null,
  bank_account_name: null,
  contract_place: null,
  default_credit_days: null,
  late_delivery_hours: null,
  cancel_notice_days: null,
};

/** The shop's master data (profile + branches), loaded once and shared by every printed document. */
@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly api = inject(ApiService);
  private cached$?: Observable<ShopSettings>;

  /** Cached after the first successful load; call refresh() after the settings page saves. */
  load(): Promise<ShopSettings> {
    this.cached$ ??= this.api.getShop().pipe(
      map((settings) => ({ profile: settings.profile ?? DEFAULT_SHOP, branches: settings.branches ?? [], owner: settings.owner ?? null })),
      catchError(() => {
        this.cached$ = undefined; // retry next time
        return of<ShopSettings>({ profile: DEFAULT_SHOP, branches: [], owner: null });
      }),
      shareReplay(1),
    );
    return firstValueFrom(this.cached$);
  }

  refresh(): Promise<ShopSettings> {
    this.cached$ = undefined;
    return this.load();
  }

  /** The branch whose address is printed by default: the main one, else the first active one. */
  static mainBranch(branches: Branch[]): Branch | null {
    return branches.find((b) => b.is_main && b.is_active) ?? branches.find((b) => b.is_active) ?? null;
  }
}
