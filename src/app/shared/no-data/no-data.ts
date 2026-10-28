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
        <mat-spinner diameter="22" aria-hidden="true"></mat-spinner>
        กำลังโหลดข้อมูล...
      } @else {
        <mat-icon aria-hidden="true">storage</mat-icon>
        No Data
      }
    </div>
  `,
})
export class NoData {
  protected readonly loading = inject(LoadingService);
}
