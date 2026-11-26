import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface SettingsCard {
  title: string;
  description: string;
  icon: string;
  action: string;
  link?: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatIconModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss'
})
export class Settings {
  // titles match the sidebar sub-menu labels
  readonly cards: SettingsCard[] = [
    {
      title: 'ข้อมูลสินค้า',
      description: 'เพิ่ม แก้ไข หรือจัดกลุ่มสินค้าและเมนูอาหารตามหมวด เช่น ไก่หมุน, ส้มตำ, เครื่องดื่ม',
      icon: 'restaurant_menu',
      action: 'ดูข้อมูลสินค้า',
      link: '/main-conten-mng/products'
    },
    {
      title: 'ข้อมูลพนักงาน',
      description: 'เพิ่มพนักงาน, ระดับสิทธิ์, และกำหนดบทบาทในระบบ',
      icon: 'people',
      action: 'ดูพนักงาน',
      link: '/main-conten-mng/users'
    },
    {
      title: 'ตั้งค่าร้าน',
      description: 'ชื่อร้าน, บุคคลธรรมดา/นิติบุคคล, เลขผู้เสียภาษี, ที่อยู่สาขา, บัญชีธนาคาร สำหรับพิมพ์หัวเอกสารและสัญญา',
      icon: 'storefront',
      action: 'ตั้งค่าร้าน',
      link: '/main-conten-mng/shop'
    }
  ];
}
