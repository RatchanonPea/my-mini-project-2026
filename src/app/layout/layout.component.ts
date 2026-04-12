import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Navbar } from '../shared/navbar/navbar';
import { Sidebar } from '../shared/sidebar/sidebar';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss'],
  standalone: true,
  imports: [RouterModule, CommonModule, Navbar, Sidebar]
})
export class LayoutComponent implements OnInit {
  sidebarCollapsed = false;

  constructor() {}

  ngOnInit() {

  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
