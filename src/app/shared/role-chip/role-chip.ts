import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

// Role badge shown in the Users list; reused so the profile page displays the role the same way.
@Component({
  selector: 'app-role-chip',
  standalone: true,
  imports: [NgClass, MatChipsModule, MatIconModule],
  template: `
    <mat-chip class="role-chip" [ngClass]="{
      'role-admin': role === 'admin',
      'role-user': role === 'user',
      'role-manager': role === 'manager'
    }">
      <mat-icon>admin_panel_settings</mat-icon>
      {{ role }}
    </mat-chip>
  `,
  styleUrl: './role-chip.scss',
})
export class RoleChip {
  @Input() role = '';
}
