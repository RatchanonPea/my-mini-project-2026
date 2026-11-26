import { Injectable, NgModule } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MAT_NATIVE_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';

/**
 * Native adapter that reads typed dates as day/month/year. The stock one hands the text to
 * Date.parse, which treats "01/07/2026" as January 7th (US order) even with a day-first locale.
 */
@Injectable()
export class DayFirstDateAdapter extends NativeDateAdapter {
  // en-GB starts the week on Monday; the calendars here have always started on Sunday
  override getFirstDayOfWeek(): number {
    return 0;
  }

  override parse(value: unknown, parseFormat?: unknown): Date | null {
    if (typeof value === 'string') {
      const text = value.trim();
      const match = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/.exec(text);
      if (match) {
        const [day, month, year] = [Number(match[1]), Number(match[2]), Number(match[3])];
        const date = new Date(year, month - 1, day);
        // new Date(2026, 1, 31) silently becomes March 3rd: reject dates that rolled over
        const real = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
        return real ? date : this.invalid();
      }
      if (!text) return null;
    }
    return super.parse(value, parseFormat);
  }
}

/** Replaces MatNativeDateModule: every date picker shows and accepts dd/MM/yyyy, matching the tables. */
@NgModule({
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    { provide: DateAdapter, useClass: DayFirstDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MAT_NATIVE_DATE_FORMATS },
  ],
})
export class AppDateModule {}
