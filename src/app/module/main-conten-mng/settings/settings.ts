import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <section class="settings-page">
      <div class="page-header">
        <div>
          <h3>ตั้งค่าและข้อมูลหลัก</h3>
          <p class="subtitle">จัดการเมนูร้าน, ข้อมูลพนักงาน, และค่าบริการพื้นฐาน</p>
        </div>
      </div>

      <div class="settings-grid">
        <mat-card class="settings-card">
          <mat-card-header>
            <mat-card-title>จัดการเมนูอาหาร</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>เพิ่ม แก้ไข หรือจัดกลุ่มเมนูอาหารตามหมวด เช่น อาหารจานเดียว, ส้มตำ, เครื่องดื่ม</p>
            <button mat-flat-button color="primary">
              <mat-icon>restaurant_menu</mat-icon> ดูเมนูอาหาร
            </button>
          </mat-card-content>
        </mat-card>

        <mat-card class="settings-card">
          <mat-card-header>
            <mat-card-title>จัดการพนักงาน</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>เพิ่มพนักงาน, ระดับสิทธิ์, และกำหนดบทบาทในระบบ</p>
            <button mat-flat-button color="primary">
              <mat-icon>people</mat-icon> ดูพนักงาน
            </button>
          </mat-card-content>
        </mat-card>

        <mat-card class="settings-card">
          <mat-card-header>
            <mat-card-title>ตั้งค่าร้าน</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>ตั้งค่าชื่อร้าน, VAT, เวลาเปิด-ปิด, และการแจ้งเตือน</p>
            <button mat-flat-button color="primary">
              <mat-icon>settings</mat-icon> ตั้งค่าร้าน
            </button>
          </mat-card-content>
        </mat-card>
      </div>
    </section>
  `,
  styles: [
    `.settings-page { padding: 1.5rem; }
     .page-header { margin-bottom: 1.5rem; }
     .subtitle { color: #6b7280; }
     .settings-grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
     .settings-card { padding: 1rem; min-height: 170px; display: flex; flex-direction: column; justify-content: space-between; }
     .settings-card p { margin: 0 0 1rem; color: #4b5563; }
    `
  ]
})
export class Settings {}
