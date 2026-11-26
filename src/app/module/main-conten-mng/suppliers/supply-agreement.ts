import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ApiService, Supplier, SupplyContract } from '../../../services/api';
import { PrintService } from '../../../services/print';
import { AuthService } from '../../../services/auth';
import { ShopService } from '../../../services/shop';
import { AgreementShop, buildSupplyAgreementDoc } from '../../../common/print-docs';
import { DialogErrorHtmlConfirm } from '../../../common/helper';
import { BuyerCheck, ContractDialog, ContractDialogData, ContractOptions } from './contract-dialog/contract-dialog';

/**
 * Picks the quantity / price / branch in a dialog, records the agreement (so purchases can follow its price and credit),
 * then prints it. Used by the supplier list and profile. A recorded agreement can be reprinted exactly as it was.
 */
@Injectable({ providedIn: 'root' })
export class SupplyAgreementService {
  private readonly dialog = inject(MatDialog);
  private readonly printer = inject(PrintService);
  private readonly shop = inject(ShopService);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  /** the agreement carries the owner's ID card number and address: managers / admins only (the API enforces it) */
  get allowed(): boolean {
    return this.auth.isManager();
  }

  private deny(): void {
    DialogErrorHtmlConfirm('ข้อตกลงซื้อขายมีข้อมูลส่วนตัวของเจ้าของร้าน ทำหรือพิมพ์ได้เฉพาะผู้จัดการหรือแอดมิน');
  }

  /** resolves with the recorded agreement, or null when the user cancelled or saving failed */
  async print(supplier: Supplier): Promise<SupplyContract | null> {
    if (!this.allowed) {
      this.deny();
      return null;
    }
    const settings = await this.shop.load();
    const branches = settings.branches.filter((b) => b.is_active);

    const profile = settings.profile!;
    const owner = settings.owner;
    const empty = (value: unknown) => String(value ?? '').trim() === '';
    // the buyer is the shop; its owner / signatory is the user flagged on the shop settings page. What the contract
    // still lacks is reported here so the user is told to fix the source (ตั้งค่าร้าน / the owner's user profile).
    const buyerCheck = (branchId: number | null): BuyerCheck => {
      const branch = branches.find((b) => b.branch_id === branchId) ?? ShopService.mainBranch(branches);
      const required: string[] = [];
      if (!owner) {
        required.push('เจ้าของร้าน/ผู้ลงนาม (เลือกที่ ตั้งค่าร้าน)');
      } else if (profile.entity_type === 'juristic') {
        if (empty(profile.legal_name)) required.push('ชื่อนิติบุคคล');
        if (empty(profile.signatory_position)) required.push('ตำแหน่งผู้ลงนาม');
        if (empty(profile.tax_id)) required.push('เลขทะเบียนนิติบุคคล');
        if (empty(branch?.address)) required.push('ที่อยู่สาขา');
      } else {
        if (empty(owner.national_id)) required.push('เลขบัตรประชาชนของเจ้าของร้าน');
        if (empty(owner.address) && empty(branch?.address)) required.push('ที่อยู่ของเจ้าของร้าน');
      }
      const phone = (owner?.phone || branch?.phone || '').trim();
      return { required, recommended: phone ? [] : ['เบอร์โทร'] };
    };

    const options = await new Promise<ContractOptions | undefined>((resolve) => {
      this.dialog
        .open<ContractDialog, ContractDialogData, ContractOptions>(ContractDialog, {
          width: '520px',
          maxWidth: '95vw',
          data: {
            supplierName: supplier.name,
            defaultCreditDays: supplier.credit_days ?? settings.profile?.default_credit_days ?? null,
            branches,
            defaultBranchId: ShopService.mainBranch(branches)?.branch_id ?? null,
            buyerCheck,
          },
        })
        .afterClosed()
        .subscribe(resolve);
    });
    if (!options) return null;

    const branch = branches.find((b) => b.branch_id === options.branchId) ?? ShopService.mainBranch(branches) ?? null;
    let contract: SupplyContract;
    try {
      contract = await firstValueFrom(
        this.api.createSupplyContract({
          supplier_id: supplier.supplier_id,
          quantity: options.quantity,
          per: options.per,
          unit_price: options.unitPrice,
          credit_days: options.creditDays,
          branch_id: branch?.branch_id ?? null,
          snapshot: { profile, owner, branch, supplier },
        }),
      );
    } catch (err) {
      DialogErrorHtmlConfirm((err as { error?: { message?: string } })?.error?.message ?? 'บันทึกข้อตกลงไม่สำเร็จ');
      return null;
    }
    await this.show(supplier, options, { profile, owner, branch }, contract.code);
    return contract;
  }

  /** Prints a recorded agreement again with the buyer / seller details it was made with. */
  async reprint(contract: SupplyContract): Promise<void> {
    if (!this.allowed) {
      this.deny();
      return;
    }
    try {
      const detail = await firstValueFrom(this.api.getSupplyContract(contract.contract_id));
      const snap = detail.snapshot;
      if (!snap) {
        DialogErrorHtmlConfirm('ข้อตกลงนี้ไม่มีข้อมูลที่เก็บไว้สำหรับพิมพ์ซ้ำ');
        return;
      }
      const options: ContractOptions = {
        quantity: detail.quantity,
        per: detail.per,
        unitPrice: detail.unit_price === null ? null : Number(detail.unit_price),
        creditDays: detail.credit_days,
        branchId: detail.branch_id,
      };
      await this.show(snap.supplier, options, { profile: snap.profile, owner: snap.owner, branch: snap.branch }, detail.code);
    } catch {
      DialogErrorHtmlConfirm('เปิดข้อตกลงไม่สำเร็จ');
    }
  }

  private async show(supplier: Supplier, options: ContractOptions, shop: AgreementShop, code: string): Promise<void> {
    try {
      await this.printer.print(buildSupplyAgreementDoc(supplier, options, shop, code));
    } catch {
      DialogErrorHtmlConfirm('เปิดหน้าพิมพ์ไม่สำเร็จ');
    }
  }
}
