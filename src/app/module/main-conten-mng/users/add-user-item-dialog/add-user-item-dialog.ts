import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from "@angular/material/icon";
import { MatButton } from '@angular/material/button';

import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Inject } from '@angular/core';
import { MatOption } from "@angular/material/core";
import { MatSelectModule } from '@angular/material/select';


@Component({
  selector: 'app-add-user-item-dialog',
  standalone: true,
  imports: [MatDialogModule, CommonModule, FormsModule, MatInputModule, MatFormFieldModule, MatIcon, MatButton, MatOption, MatSelectModule ],
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
    status: 'active',

    // 🔥 audit fields
    createdBy: '',
    createdAt: new Date(),

    updatedBy: '',
    updatedAt: new Date()
  };
  isEdit = false;
  constructor(
    private dialogRef: MatDialogRef<AddUserItemDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }
  ngOnInit() {

    if (this.data) {
      this.isEdit = true;
      this.newItem = { ...this.data }; // 🔥 set ค่า
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
