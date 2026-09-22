import { Component, inject, signal } from '@angular/core';
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
  imports: [RouterModule, CommonModule, Navbar, Sidebar]
})
export class LayoutComponent {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  sidebarCollapsed = false;
  pageTitle = signal('Dashboard');

  constructor() {
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      takeUntilDestroyed(),
    ).subscribe(() => this.pageTitle.set(this.currentBreadcrumb()));
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  private currentBreadcrumb(): string {
    let current: ActivatedRoute | null = this.route;
    while (current?.firstChild) {
      current = current.firstChild;
    }
    return current?.snapshot?.data?.['breadcrumb'] ?? 'Dashboard';
  }
}
