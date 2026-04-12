import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCalendar, MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface WebsiteData {
  id: number;
  website: string;
  status: string;
  user: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatTabsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
  selectedDate: Date = new Date();

  stats = [
    { title: 'REQUEST WEB SITES', value: 23, color: 'primary' },
    { title: 'REQUEST MEDIA', value: 17, color: 'warn' },
    { title: 'DEVICES', value: 45, color: 'accent' },
    { title: 'DEVICE ALERTS', value: 27, color: 'info' }
  ];

  displayedColumns: string[] = ['id', 'website', 'status', 'user'];
  dataSource: WebsiteData[] = [
    { id: 452, website: 'www.apple.com', status: 'Allowed', user: 'David Green' },
    { id: 327, website: 'www.sun.com', status: 'Allowed', user: 'Sandra Smith' },
    { id: 226, website: 'www.google.com', status: 'Blocked', user: 'Chritopher Palmer' },
    { id: 178, website: 'www.yahoo.com', status: 'Blocked', user: 'Amily Lee' },
    { id: 157, website: 'www.microsoft.com', status: 'Allowed', user: 'Nick Doe' },
    { id: 157, website: 'www.apple.com', status: 'Allowed', user: 'David Green' }
  ];

  ngOnInit() {
    // Initialize component
  }

  onDateSelected(date: Date) {
    this.selectedDate = date;
  }
}

