import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LoadingService } from '../services/loading';
import { Component, HostListener, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter, startWith } from 'rxjs';
import { Navbar } from '../shared/navbar/navbar';
import { Sidebar } from '../shared/sidebar/sidebar';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule, MatProgressBarModule, Navbar, Sidebar]
})
export class LayoutComponent {
  protected readonly loading = inject(LoadingService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // matches the sidebar.scss breakpoint: below it the menu is an off-canvas drawer, not a collapsible rail
  private readonly phoneQuery = window.matchMedia('(max-width: 768px)');

  sidebarCollapsed = false;
  mobileMenuOpen = false;
  pageTitle = signal('ภาพรวม');

  get isPhone(): boolean {
    return this.phoneQuery.matches;
  }

  constructor() {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      takeUntilDestroyed(),
    ).subscribe(() => {
      this.pageTitle.set(this.currentBreadcrumb());
      this.mobileMenuOpen = false; // picking a menu item should reveal the page, not leave the drawer over it
    });
  }

  toggleSidebar() {
    if (this.isPhone) {
      this.mobileMenuOpen = !this.mobileMenuOpen;
    } else {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    }
  }

  @HostListener('document:keydown.escape')
  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  // mobile browsers fire resize when the address bar hides/shows: only react when leaving phone width
  @HostListener('window:resize')
  onResize(): void {
    if (!this.isPhone) this.closeMobileMenu();
  }

  private currentBreadcrumb(): string {
    let current: ActivatedRoute | null = this.route;
    while (current?.firstChild) {
      current = current.firstChild;
    }
    return current?.snapshot?.data?.['breadcrumb'] ?? 'ภาพรวม';
  }
}
