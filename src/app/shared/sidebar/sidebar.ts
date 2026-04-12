import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MenuService, MenuItem } from '../../services/menu';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar implements OnInit {
  @Input() collapsed = false;
  menuItems: MenuItem[] = [];

  constructor(private menuService: MenuService) {}

  ngOnInit(): void {
    this.menuItems = this.menuService.getMenuItems();
  }

  toggleSubmenu(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    }
  }
}
