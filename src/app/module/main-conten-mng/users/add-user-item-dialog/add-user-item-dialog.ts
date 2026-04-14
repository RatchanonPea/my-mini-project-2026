import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIcon } from "@angular/material/icon";
import { MatButton } from '@angular/material/button';


@Component({
  selector: 'app-add-user-item-dialog',
  standalone: true,
  imports: [MatDialogModule, CommonModule, FormsModule, MatInputModule, MatFormFieldModule, MatIcon,MatButton],
  templateUrl: './add-user-item-dialog.html',
  styleUrl: './add-user-item-dialog.scss',
})
export class AddUserItemDialog {
  newItem = {
    id: '',
    title: '',
    description: '',
    price: 0
  };
  constructor(
    private dialogRef: MatDialogRef<AddUserItemDialog>
  ) { }
  ngOnInit() {
  }

  save() {
    this.dialogRef.close(this.newItem); // ✅ ส่งค่ากลับ + ปิด popup
  }

  cancel() {
    this.dialogRef.close(); // ❌ ปิดเฉยๆ
  }

  addItem() { }


}
