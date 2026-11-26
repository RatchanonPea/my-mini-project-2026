import { Directive, Component, inject } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCalendar, MatCalendarHeader, MatDatepicker } from '@angular/material/datepicker';

/** The stock calendar header plus a "วันนี้" button that picks today's date and closes the picker. */
@Component({
  selector: 'app-calendar-today-header',
  standalone: true,
  imports: [MatCalendarHeader, MatButtonModule],
  template: `
    <mat-calendar-header></mat-calendar-header>
    @if (calendar.currentView === 'month') {
      <div class="today-row">
        <button mat-stroked-button type="button" class="today-btn" (click)="selectToday($event)">วันนี้</button>
      </div>
    }
  `,
  styles: [`
    .today-row { display: flex; padding: 0 12px 10px; }
    .today-btn { --mdc-outlined-button-container-height: 30px; height: 30px; padding: 0 14px; font-size: 0.875rem; border-radius: 999px; }
  `],
})
export class CalendarTodayHeader<D> {
  protected readonly calendar = inject<MatCalendar<D>>(MatCalendar);
  private readonly adapter = inject<DateAdapter<D>>(DateAdapter);

  selectToday(event: Event): void {
    const today = this.adapter.today();
    this.calendar.activeDate = today;
    this.calendar.selectedChange.emit(today);
    // same signal a click on a day cell sends: this is what makes the datepicker close
    this.calendar._userSelection.emit({ value: today, event });
  }
}

/**
 * Add to a component's imports and every <mat-datepicker> inside it gets the "วันนี้" button
 * (only on the day grid, not when picking just a month or a year).
 */
@Directive({ selector: 'mat-datepicker', standalone: true })
export class TodayButton {
  constructor() {
    inject(MatDatepicker).calendarHeaderComponent = CalendarTodayHeader;
  }
}
