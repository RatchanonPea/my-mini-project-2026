import { Component, OnInit, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MenuService, MenuItem } from '../../services/menu';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class Sidebar implements OnInit {
  @Input() collapsed = false;
  /** phones only: slides the menu in over the page */
  @Input() mobileOpen = false;
  /** a group was tapped while only icons show: its list needs the full-width menu */
  @Output() expandRequest = new EventEmitter<void>();
  private router = inject(Router);
  menuItems: MenuItem[] = [];
  currentUserRole: string | null = null;

  constructor(private menuService: MenuService, private authService: AuthService) {}

  ngOnInit(): void {
    this.currentUserRole = this.authService.getCurrentUserRole();
    this.menuItems = this.getFilteredMenuItems(this.menuService.getMenuItems());
    // arriving straight on one of a group's pages: show where you are
    this.menuItems.filter((item) => this.hasActiveChild(item)).forEach((item) => (item.expanded = true));
  }

  hasActiveChild(item: MenuItem): boolean {
    const url = this.router.url.split(/[?#]/)[0];
    return !!item.children?.some((child) => url === `/${child.path}` || url.startsWith(`/${child.path}/`));
  }

  private getFilteredMenuItems(items: MenuItem[]): MenuItem[] {
    return items
      .map(item => ({ ...item, children: item.children ? this.getFilteredMenuItems(item.children) : undefined }))
      .filter(item => this.isMenuAllowed(item));
  }

  private isMenuAllowed(item: MenuItem): boolean {
    return !item.roles || !item.roles.length || !!this.currentUserRole && item.roles.includes(this.currentUserRole);
  }

  toggleSubmenu(item: MenuItem, li?: HTMLElement): void {
    if (!item.children) return;
    if (this.collapsed) {
      this.expandRequest.emit();
      item.expanded = true;
    } else {
      item.expanded = !item.expanded;
    }

    // A menu near the bottom (e.g. "ตั้งค่า") can expand its children below the sidebar's own
    // visible/scrollable area, especially on shorter or tablet-width screens where the sidebar
    // auto-collapses to icons only — the opened submenu is easy to miss since nothing scrolls
    // there on its own. Bring it into view once Angular has rendered the expanded <ul>.
    if (item.expanded && li) {
      setTimeout(() => li.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 0);
    }
  }
}
