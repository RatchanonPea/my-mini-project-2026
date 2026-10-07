import { AfterViewInit, Component, ElementRef, HostListener, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme';
import { Chicken } from '../chicken/chicken';
import { ConfirmDialog, ShowToast } from '../../common/helper';
import { ApiService, InventorySummary, NotificationItem } from '../../services/api';

interface NavTarget {
  path: string;
  queryParams?: Record<string, number>;
}

// Where clicking a notification for this entity type should go, and how it's drawn in the list.
// purchase_order/stock_adjustment carry the specific record's id as a query param so the target
// page can open that exact item's detail dialog automatically, instead of landing on the bare list.
const ENTITY_LINK: Record<string, (id: number | null) => NavTarget> = {
  user: (id) => ({ path: id ? `/main-conten-mng/users/${id}` : '/main-conten-mng/users' }),
  supplier: (id) => ({ path: id ? `/main-conten-mng/suppliers/${id}` : '/main-conten-mng/suppliers' }),
  purchase_order: (id) => ({ path: '/main-conten-mng/purchases', queryParams: id ? { openPo: id } : undefined }),
  stock_adjustment: (id) => ({ path: '/main-conten-mng/inventory', queryParams: id ? { openAdjust: id } : undefined }),
  inventory_settings: () => ({ path: '/main-conten-mng/inventory' }),
  product: () => ({ path: '/main-conten-mng/products' }),
  expense: () => ({ path: '/main-conten-mng/expenses' }),
  sale: () => ({ path: '/main-conten-mng/sales' }),
};

const ENTITY_STYLE: Record<string, { icon: string; bg: string }> = {
  user: { icon: 'fa-user', bg: '#0369a1' },
  supplier: { icon: 'fa-store', bg: '#7c3aed' },
  purchase_order: { icon: 'fa-truck', bg: '#16a34a' },
  stock_adjustment: { icon: 'fa-boxes-stacked', bg: '#ea580c' },
  inventory_settings: { icon: 'fa-sliders', bg: '#64748b' },
  product: { icon: 'fa-drumstick-bite', bg: '#d97706' },
  expense: { icon: 'fa-receipt', bg: '#b91c1c' },
  sale: { icon: 'fa-cash-register', bg: '#0f766e' },
};
const DEFAULT_STYLE = { icon: 'fa-bell', bg: '#64748b' };

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, Chicken],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('alertsWrap') alertsWrap?: ElementRef<HTMLElement>;

  readonly brandTitle = 'Arre ไก่หมุน';
  readonly brandSubtitle = 'By อารี อิ่มสอาด';
  // split by grapheme (not code point) so Thai vowels / tone marks stay attached to their consonant
  readonly brandLetters = Navbar.splitGraphemes(this.brandTitle);
  readonly brandSubLetters = Navbar.splitGraphemes(this.brandSubtitle);

  private static splitGraphemes(text: string): string[] {
    const Segmenter = (Intl as unknown as { Segmenter?: new (locale: string, options: object) => { segment(input: string): Iterable<{ segment: string }> } }).Segmenter;
    return Segmenter
      ? Array.from(new Segmenter('th', { granularity: 'grapheme' }).segment(text), (part) => part.segment)
      : Array.from(text);
  }

  currentUser: string | null = null;
  currentUserRole: string | null = null;
  isDropdownOpen = false;
  isAlertsOpen = false;
  isAlertsMenuOpen = false;
  alertTab: 'all' | 'unread' = 'all';
  stockSummary: InventorySummary | null = null;
  notifications: NotificationItem[] = [];
  unreadCount = 0;
  private subscription: Subscription = new Subscription();
  private toastedLowStock = false;

  constructor(
    private authService: AuthService,
    public theme: ThemeService,
    private zone: NgZone,
    private host: ElementRef<HTMLElement>,
    private api: ApiService,
    private router: Router,
  ) {}

  private letters: HTMLElement[] = [];
  private subtitleLetters = new Set<HTMLElement>();
  private lettersUnderChicken = new Set<HTMLElement>();

  // a letter hops once each time the chicken walks onto it, not repeatedly while it lingers there
  private onChickenStep = (event: Event): void => {
    const { x, half } = (event as CustomEvent<{ x: number; half: number }>).detail;
    for (const letter of this.letters) {
      const rect = letter.getBoundingClientRect();
      const distance = Math.abs(x - (rect.left + rect.width / 2));
      // only the small "By ..." line changes colour under the white chicken; the big title just hops
      if (this.subtitleLetters.has(letter)) {
        letter.classList.toggle('contrast', distance < half + rect.width / 2);
      }
      const under = distance < rect.width / 2 + 4;
      if (!under) {
        this.lettersUnderChicken.delete(letter);
        continue;
      }
      if (this.lettersUnderChicken.has(letter)) {
        continue;
      }
      this.lettersUnderChicken.add(letter);
      letter.classList.remove('bounce');
      void letter.offsetWidth;
      letter.classList.add('bounce');
      letter.addEventListener('animationend', () => letter.classList.remove('bounce'), { once: true });
    }
  };

  ngAfterViewInit(): void {
    this.letters = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.brand-letter'));
    this.subtitleLetters = new Set(this.host.nativeElement.querySelectorAll<HTMLElement>('.brand-subtitle .brand-letter'));
    this.zone.runOutsideAngular(() => window.addEventListener('chicken-step', this.onChickenStep));
  }

  ngOnInit(): void {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        const justLoggedIn = !this.currentUser && !!user;
        this.currentUser = user;
        if (justLoggedIn) {
          this.loadStockSummary();
          this.refreshUnreadCount();
        }
      })
    );
    this.subscription.add(
      this.authService.currentUserRole$.subscribe(role => {
        this.currentUserRole = role;
      })
    );
    if (this.currentUser) {
      this.loadStockSummary();
      this.refreshUnreadCount();
    }
  }

  private loadStockSummary(): void {
    this.api.getInventorySummary().subscribe({
      next: (s) => {
        this.stockSummary = s;
        // one quiet nudge per session the moment stock is found low — the bell keeps its own
        // "ไก่ใกล้หมดสต็อก" item in the list as the persistent reminder after that.
        if (s.is_low && !this.toastedLowStock) {
          this.toastedLowStock = true;
          ShowToast(`ไก่ใกล้หมดสต็อก: คงเหลือ ${s.balance} ตัว (เตือนเมื่อเหลือ ${s.low_stock_threshold} ตัวหรือน้อยกว่า)`, 'warning');
        }
      },
      error: () => {},
    });
  }

  private get userId(): number | null {
    return this.authService.getCurrentUserId();
  }

  private refreshUnreadCount(): void {
    const uid = this.userId;
    if (!uid) return;
    this.api.getUnreadNotificationCount(uid).subscribe({
      next: (n) => (this.unreadCount = n),
      error: () => {},
    });
  }

  private loadNotifications(): void {
    const uid = this.userId;
    if (!uid) return;
    this.api.getNotifications(uid, 1, 20).subscribe({
      next: (r) => (this.notifications = r.items),
      error: () => (this.notifications = []),
    });
  }

  get filteredNotifications(): NotificationItem[] {
    return this.alertTab === 'unread' ? this.notifications.filter((n) => !n.is_read) : this.notifications;
  }

  iconFor(entity: string) {
    return ENTITY_STYLE[entity] ?? DEFAULT_STYLE;
  }

  private targetFor(item: NotificationItem): NavTarget {
    return (ENTITY_LINK[item.entity] ?? (() => ({ path: '/main-conten-mng/dashboard' })))(item.entity_id);
  }

  // Closes the notification panel when a click lands outside it — the bell button itself is
  // inside this same wrapper, so clicking it to open the panel doesn't immediately re-close it.
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    if (this.isAlertsOpen && !this.alertsWrap?.nativeElement.contains(target)) {
      this.isAlertsOpen = false;
      this.isAlertsMenuOpen = false;
    }
  }

  toggleAlerts(): void {
    this.isAlertsOpen = !this.isAlertsOpen;
    this.isAlertsMenuOpen = false;
    if (this.isAlertsOpen) {
      this.loadNotifications();
    }
  }

  toggleAlertsMenu(event: Event): void {
    event.stopPropagation();
    this.isAlertsMenuOpen = !this.isAlertsMenuOpen;
  }

  setAlertTab(tab: 'all' | 'unread'): void {
    this.alertTab = tab;
  }

  markAllRead(): void {
    const uid = this.userId;
    if (!uid) return;
    this.api.markAllNotificationsRead(uid).subscribe({
      next: () => {
        this.notifications = this.notifications.map((n) => ({ ...n, is_read: 1 }));
        this.unreadCount = 0;
        this.isAlertsMenuOpen = false;
      },
    });
  }

  openAlert(item: NotificationItem): void {
    const uid = this.userId;
    this.isAlertsOpen = false;
    if (uid && !item.is_read) {
      this.api.markNotificationRead(uid, item.log_id).subscribe({
        next: () => (this.unreadCount = Math.max(0, this.unreadCount - 1)),
      });
    }
    const target = this.targetFor(item);
    this.router.navigate([target.path], target.queryParams ? { queryParams: target.queryParams } : {});
  }

  // created_at is stored/serialized as wall-clock digits app-wide (no timezone math — the ISO
  // string's "Z" is misleading, same as everywhere else this convention is used), so the elapsed
  // time is computed against those same literal digits rather than trusting `new Date(iso)`.
  timeAgo(iso: string): string {
    const [y, mo, d, h, mi] = iso.match(/\d+/g)!.map(Number);
    const then = new Date(y, mo - 1, d, h, mi).getTime();
    const minutes = Math.max(0, Math.floor((Date.now() - then) / 60000));
    if (minutes < 1) return 'เมื่อสักครู่';
    if (minutes < 60) return `${minutes} นาที`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ชั่วโมง`;
    return `${Math.floor(hours / 24)} วัน`;
  }

  ngOnDestroy(): void {
    window.removeEventListener('chicken-step', this.onChickenStep);
    this.subscription.unsubscribe();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout(): void {
     ConfirmDialog('ยืนยันการออกจากระบบ',"คุณต้องการออกจากระบบใช่หรือไม่")
        .then(async emit => {
          if (emit) {
            this.authService.logout();
          }
        });
  }
}
