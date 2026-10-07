import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, catchError, of, switchMap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ApiService, InventorySummary, LedgerItem, LedgerType } from '../../../services/api';
import { DialogErrorHtmlConfirm, DialogSuccess, toLocalDatetimeInput, toYmd } from '../../../common/helper';
import { Pager } from '../../../shared/pager/pager';
import { halfStep } from '../purchases/purchases';
import { StockDetailDialog } from './stock-detail-dialog/stock-detail-dialog';
import { EditLedgerDialog } from './edit-ledger-dialog/edit-ledger-dialog';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatTableModule, MatSelectModule, MatDatepickerModule, MatNativeDateModule, MatDialogModule, Pager],
  templateUrl: './inventory.html',
  styleUrls: ['./inventory.scss'],
})
export class Inventory implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private dialog = inject(MatDialog);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reload$ = new Subject<void>();

  readonly typeLabel: Record<string, string> = { receive: 'รับเข้า', sale: 'ขายออก', waste: 'ของเสีย', adjust: 'ปรับยอด' };
  displayedColumns = ['ledger_date', 'type', 'ref_code', 'quantity', 'balance_after', 'note', 'action'];
  dataSource = new MatTableDataSource<LedgerItem>([]);
  summary: InventorySummary | null = null;

  readonly pageSize = 10;
  pageIndex = 0;
  total = 0;

  saving = false;
  savingSettings = false;

  filterForm = this.fb.group({
    type: ['' as LedgerType | ''],
    date: [null as Date | null],
  });

  adjustForm = this.fb.nonNullable.group({
    type: ['waste' as 'waste' | 'adjust', Validators.required],
    adjust_date: [toLocalDatetimeInput(new Date()), Validators.required],
    quantity: [0.5, [Validators.required, halfStep]],
    note: [''],
  });

  settingsForm = this.fb.nonNullable.group({
    low_stock_threshold: [5, [Validators.required, Validators.min(0), halfStep]],
    unit_cost: [150, [Validators.required, Validators.min(0)]],
  });

  get isWaste(): boolean {
    return this.adjustForm.controls.type.value === 'waste';
  }

  get adjustValid(): boolean {
    const q = Number(this.adjustForm.controls.quantity.value);
    return this.adjustForm.valid && (this.isWaste ? q > 0 : q !== 0);
  }

  ngOnInit(): void {
    this.loadSummary();

    this.reload$.pipe(
      switchMap(() => this.api.getInventoryLedger({
        type: this.filterForm.controls.type.value ?? '',
        date: this.filterForm.controls.date.value ? toYmd(this.filterForm.controls.date.value) : null,
        page: this.pageIndex + 1,
        pageSize: this.pageSize,
      }).pipe(catchError(() => of({ items: [], total: 0, page: 1, pageSize: this.pageSize })))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      this.dataSource.data = result.items;
      this.total = result.total;
    });

    this.reload$.next();

    // Arrived from a notification about one specific adjustment — open its detail straight away
    // instead of leaving the visitor to hunt for it in the (possibly paginated/filtered) list.
    const adjustId = Number(this.route.snapshot.queryParamMap.get('openAdjust'));
    if (adjustId) {
      this.api.getInventoryLedger({ page: 1, pageSize: 1, adjustId }).subscribe((r) => {
        if (r.items[0]) {
          this.openDetail(r.items[0]);
        }
      });
      this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    }
  }

  private loadSummary(): void {
    this.api.getInventorySummary().subscribe((s) => {
      this.summary = s;
      this.settingsForm.patchValue({ low_stock_threshold: s.low_stock_threshold, unit_cost: s.standard_cost }, { emitEvent: false });
    });
  }

  openDetail(row: LedgerItem): void {
    this.dialog.open(StockDetailDialog, { width: '520px', maxWidth: '95vw', data: { kind: 'ledger', row } });
  }

  // Sale rows are a daily aggregate of many sale-item rows (edited on the Sales page instead), so
  // only receive/waste/adjust — each backed by a single row — can be corrected from here.
  canEdit(row: LedgerItem): boolean {
    return row.type !== 'sale';
  }

  editRow(row: LedgerItem): void {
    this.dialog.open(EditLedgerDialog, { width: '560px', maxWidth: '95vw', data: { row } }).afterClosed().subscribe((changed) => {
      if (changed) {
        DialogSuccess('แก้ไขรายการเรียบร้อยแล้ว');
        this.loadSummary();
        this.reload$.next();
      }
    });
  }

  search(): void {
    this.pageIndex = 0;
    this.reload$.next();
  }

  clearFilter(): void {
    this.filterForm.reset({ type: '', date: null });
    this.search();
  }

  onPageChange(pageIndex: number): void {
    this.pageIndex = pageIndex;
    this.reload$.next();
  }

  saveAdjustment(): void {
    if (!this.adjustValid || this.saving) {
      this.adjustForm.markAllAsTouched();
      return;
    }
    const v = this.adjustForm.getRawValue();
    this.saving = true;
    this.api.createStockAdjustment({
      adjust_date: v.adjust_date,
      type: v.type,
      quantity: Number(v.quantity),
      note: v.note.trim() || null,
    }).subscribe({
      next: () => {
        this.saving = false;
        DialogSuccess(v.type === 'waste' ? 'บันทึกของเสียเรียบร้อยแล้ว' : 'ปรับยอดสต็อกเรียบร้อยแล้ว');
        this.adjustForm.reset({ type: 'waste', adjust_date: toLocalDatetimeInput(new Date()), quantity: 0.5, note: '' });
        this.loadSummary();
        this.reload$.next();
      },
      error: (err) => {
        this.saving = false;
        DialogErrorHtmlConfirm(err?.error?.message ?? 'บันทึกไม่สำเร็จ');
      },
    });
  }

  saveSettings(): void {
    if (this.settingsForm.invalid || this.savingSettings) {
      this.settingsForm.markAllAsTouched();
      return;
    }
    const v = this.settingsForm.getRawValue();
    this.savingSettings = true;
    this.api.updateInventorySettings({ low_stock_threshold: Number(v.low_stock_threshold), unit_cost: Number(v.unit_cost) }).subscribe({
      next: (s) => {
        this.savingSettings = false;
        this.summary = s;
        DialogSuccess('บันทึกการตั้งค่าเรียบร้อยแล้ว');
      },
      error: (err) => {
        this.savingSettings = false;
        DialogErrorHtmlConfirm(err?.error?.message ?? 'บันทึกไม่สำเร็จ');
      },
    });
  }
}
