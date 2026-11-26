import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoadingService } from '../../services/loading';

// Table placeholder: a spinner while a request is in flight, the "no data" message once it has finished.
@Component({
  selector: 'app-no-data',
  standalone: true,
  imports: [MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="no-data-message" role="status" aria-live="polite">
      @if (loading.active()) {
        <span class="no-data-badge"><mat-spinner diameter="28" aria-hidden="true"></mat-spinner></span>
        <strong>กำลังโหลดข้อมูล...</strong>
      } @else {
        <span class="no-data-badge"><mat-icon aria-hidden="true">inbox</mat-icon></span>
        <strong>ยังไม่มีข้อมูล</strong>
        <small>เมื่อมีรายการ จะแสดงตรงนี้</small>
      }
    </div>
  `,
})
export class NoData {
  protected readonly loading = inject(LoadingService);
}
