import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Inject } from '@angular/core';
import { MatOptionModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { ApiService, Role } from '../../../../services/api';

@Component({
  selector: 'app-add-user-item-dialog',
  standalone: true,
  imports: [MatDialogModule, CommonModule, FormsModule, MatInputModule, MatFormFieldModule, MatIconModule, MatButtonModule, MatSelectModule, MatOptionModule, MatDatepickerModule],
  templateUrl: './add-user-item-dialog.html',
  styleUrl: './add-user-item-dialog.scss',
})
export class AddUserItemDialog {
  newItem = {
    id: '',
    code: '',

    username: '',
    password: '',

    firstName: '',
    lastName: '',

    email: '',
    phone: '',

    role: '',
    role_id: null as number | null,
    date: new Date(),

    status: 'active',

    // 🔥 audit fields
    createdBy: '',
    createdAt: new Date(),

    updatedBy: '',
    updatedAt: new Date()
  };

  roleOptions: Role[] = [];

  hidePassword = true;
  isEdit = false;
  constructor(
    private dialogRef: MatDialogRef<AddUserItemDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private apiService: ApiService,
  ) { }
  ngOnInit() {
    this.apiService.getRoles('active').subscribe({
      next: (response) => {
        console.log('Role API response:', response);
        this.roleOptions = Array.isArray(response) ? response : [];
        console.log('Role options loaded:', this.roleOptions.length, this.roleOptions);
      },
      error: (error: unknown) => {
        console.error('Error fetching roles:', error);
      },
    });

    if (this.data) {
      this.isEdit = true;
      this.newItem = { ...this.data, password: '' };
      console.log('Edit item:', this.newItem);
    }
  }

  save() {
    this.dialogRef.close(this.newItem); // ✅ ส่งค่ากลับ + ปิด popup
  }

  cancel() {
    this.dialogRef.close(); // ❌ ปิดเฉยๆ
  }

  addItem() { }


}
