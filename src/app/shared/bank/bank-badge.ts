import { Component, Input } from '@angular/core';

/** Bank logo tile (assets/images/banks/<code>.svg): white rounded tile, logo scaled to fit. */
@Component({
  selector: 'app-bank-badge',
  standalone: true,
  template: `<img class="badge" [src]="'assets/images/banks/' + code + '.svg'" alt="" [style.width.px]="size" [style.height.px]="size" />`,
  styles: [`
    :host { display: inline-flex; flex: none; }
    .badge {
      display: block; box-sizing: border-box; object-fit: contain; padding: 12%;
      background: #fff; border-radius: 22%; box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
    }
  `],
})
export class BankBadge {
  @Input({ required: true }) code!: string;
  @Input() size = 24;
}
