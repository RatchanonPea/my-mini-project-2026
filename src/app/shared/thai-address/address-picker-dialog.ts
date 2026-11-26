import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { AddressRow, AddressSelection, BANGKOK } from '../../common/thai-address';

export interface AddressPickerData {
  rows: AddressRow[];
}

type Level = 'province' | 'district' | 'sub';
interface Line { name: string; zip?: string; }

const collator = new Intl.Collator('th');

/** Drill-down table: จังหวัด → อำเภอ/เขต → ตำบล/แขวง (with postal code). Double-click a row to go on; the last one closes. */
@Component({
  selector: 'app-address-picker-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, MatTableModule],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon aria-hidden="true">location_on</mat-icon>
      <span>เลือกที่อยู่</span>
    </h2>
    <mat-dialog-content>
      <nav class="crumbs" aria-label="ลำดับที่เลือก">
        <button mat-stroked-button type="button" [class.on]="level() === 'province'" (click)="goTo('province')">
          {{ province() || 'จังหวัด' }}
        </button>
        <mat-icon aria-hidden="true">chevron_right</mat-icon>
        <button mat-stroked-button type="button" [class.on]="level() === 'district'" [disabled]="!province()" (click)="goTo('district')">
          {{ district() || (bangkok() ? 'เขต' : 'อำเภอ') }}
        </button>
        <mat-icon aria-hidden="true">chevron_right</mat-icon>
        <button mat-stroked-button type="button" [class.on]="level() === 'sub'" [disabled]="!district()">
          {{ bangkok() ? 'แขวง' : 'ตำบล' }}
        </button>
      </nav>

      <mat-form-field appearance="outline" class="search">
        <mat-label>ค้นหา{{ levelLabel() }}{{ level() === 'sub' ? ' หรือรหัสไปรษณีย์' : '' }}</mat-label>
        <input matInput [value]="query()" (input)="query.set($any($event.target).value)" autocomplete="off" />
        <mat-icon matSuffix aria-hidden="true">search</mat-icon>
      </mat-form-field>
      <p class="tip">ดับเบิลคลิกที่แถวเพื่อเลือก (หรือคลิกแล้วกด “เลือก”)</p>

      <div class="scroller">
        <table mat-table [dataSource]="lines()">
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef>{{ levelLabel() }}</th>
            <td mat-cell *matCellDef="let l">{{ l.name }}</td>
          </ng-container>
          <ng-container matColumnDef="zip">
            <th mat-header-cell *matHeaderCellDef>รหัสไปรษณีย์</th>
            <td mat-cell *matCellDef="let l">{{ l.zip }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="columns(); sticky: true"></tr>
          <tr mat-row *matRowDef="let l; columns: columns()" tabindex="0" [class.picked]="l.name === current()?.name && l.zip === current()?.zip"
              (click)="current.set(l)" (dblclick)="choose(l)" (keydown.enter)="choose(l)"></tr>
        </table>
        @if (!lines().length) { <p class="none">ไม่พบรายการที่ค้นหา</p> }
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      @if (level() !== 'province') {
        <button mat-button type="button" (click)="back()"><mat-icon aria-hidden="true">arrow_back</mat-icon> ย้อนกลับ</button>
      }
      <span class="spacer"></span>
      <button mat-stroked-button type="button" mat-dialog-close>ยกเลิก</button>
      <button mat-flat-button color="primary" type="button" [disabled]="!current()" (click)="choose(current()!)">เลือก</button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content { display: flex; flex-direction: column; min-width: min(560px, 80vw); }
    .crumbs { display: flex; align-items: center; flex-wrap: wrap; gap: 2px; padding-top: 8px; margin-bottom: 12px; }
    .crumbs .on { background: var(--mat-sys-secondary-container, #e8def8); }
    .search { width: 100%; }
    .tip { margin: -8px 0 8px; font-size: 0.875rem; opacity: .7; }
    .scroller { max-height: 46vh; overflow: auto; border: 1px solid var(--mat-sys-outline-variant, #cac4d0); border-radius: 8px; }
    table { width: 100%; }
    tr.mat-mdc-row { cursor: pointer; }
    tr.mat-mdc-row:hover, tr.mat-mdc-row:focus-visible { background: var(--mat-sys-surface-container, rgba(0,0,0,.05)); outline: none; }
    tr.mat-mdc-row.picked { background: var(--mat-sys-secondary-container, #e8def8); }
    .none { padding: 16px; text-align: center; opacity: .7; }
    .spacer { flex: 1; }
    mat-dialog-actions { gap: 8px; }
    mat-dialog-content { overflow-x: hidden; }
    .scroller { overflow-x: hidden; }

    :host-context(html.dark-theme) {
      .crumbs .on { background: rgba(251, 146, 60, .22); border-color: #fb923c; color: #fdba74; }
      .crumbs button[disabled] { color: #8a7769; border-color: #4a2e20; }
      .tip, .none { opacity: 1; color: #c9b6a8; }
      .scroller { border-color: #5a3d2c; }
      tr.mat-mdc-row:hover, tr.mat-mdc-row:focus-visible { background: rgba(251, 146, 60, .14); }
      tr.mat-mdc-row.picked { background: rgba(251, 146, 60, .28); }
    }
  `],
})
export class AddressPickerDialog {
  private readonly ref = inject<MatDialogRef<AddressPickerDialog, AddressSelection>>(MatDialogRef);
  private readonly data = inject<AddressPickerData>(MAT_DIALOG_DATA);

  protected readonly level = signal<Level>('province');
  protected readonly province = signal('');
  protected readonly district = signal('');
  protected readonly query = signal('');
  protected readonly current = signal<Line | null>(null);

  protected readonly bangkok = computed(() => this.province() === BANGKOK);
  protected readonly levelLabel = computed(() => {
    const l = this.level();
    return l === 'province' ? 'จังหวัด' : l === 'district' ? (this.bangkok() ? 'เขต' : 'อำเภอ') : this.bangkok() ? 'แขวง' : 'ตำบล';
  });
  protected readonly columns = computed(() => (this.level() === 'sub' ? ['name', 'zip'] : ['name']));

  protected readonly lines = computed<Line[]>(() => {
    const level = this.level();
    const q = this.query().trim();
    const out = new Map<string, Line>();
    for (const r of this.data.rows) {
      if (level !== 'province' && r.province !== this.province()) continue;
      if (level === 'sub' && r.district !== this.district()) continue;
      const line: Line = level === 'province' ? { name: r.province } : level === 'district' ? { name: r.district } : { name: r.sub, zip: r.zip };
      if (q && !line.name.includes(q) && !(line.zip ?? '').startsWith(q)) continue;
      out.set(`${line.name}|${line.zip ?? ''}`, line);
    }
    return [...out.values()].sort((a, b) => collator.compare(a.name, b.name) || (a.zip ?? '').localeCompare(b.zip ?? ''));
  });

  protected goTo(level: Level): void {
    if (level === 'province') this.district.set('');
    this.level.set(level);
    this.query.set('');
    this.current.set(null);
  }

  protected back(): void {
    this.goTo(this.level() === 'sub' ? 'district' : 'province');
  }

  protected choose(line: Line): void {
    switch (this.level()) {
      case 'province':
        this.province.set(line.name);
        this.goTo('district');
        break;
      case 'district':
        this.district.set(line.name);
        this.goTo('sub');
        break;
      default:
        this.ref.close({ province: this.province(), district: this.district(), sub: line.name, zip: line.zip ?? '' });
    }
  }
}
