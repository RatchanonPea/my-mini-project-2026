import Swal from "sweetalert2";
export function DialogSuccess(htmlText: string = "บันทึกรายการสำเร็จ", titleText: string = "สำเร็จ!") {
  Swal.fire({
    html: `
        <div class="py-5 px-4">
            <div class="px-2 pb-2 d-flex justify-content-center align-self-center">
                <img class="me-1" src="assets/images/ico/SuccessTimer_popup.svg" alt="" style="height: 48px;width: 48px;">
            </div>
             <span class="px-1 dc-u-h1 dc-u-text-color--success" >${titleText}</span>
            <div class="px-2 pt-4" style="text-align: center">
                <span class="dc-u-body-1 dc-u-text-color--gray-90">${htmlText}</span>
            </div>
        </div>
        <hr style="margin:0px; border: 1px solid #C5C8CB;">
        `,
    customClass: {
      htmlContainer: "dc-swal-container",
      actions: "py-3 m-0 px-4 mx-2",
      confirmButton: "dc-c-btn-primary-2 dc-swal-button",
    },
    padding: "0px",
    showCloseButton: true,
    focusConfirm: false,
    showConfirmButton: true,
    confirmButtonText: "OK",
    showCancelButton: false,
    allowOutsideClick: false,
  });

}

export function DialogSuccessTimerPromiseResult(htmlText: string = "บันทึกรายการสำเร็จ", titleText: string = "สำเร็จ!") {
  return new Promise(r => {
    Swal.fire({
      html: `
        <div class="py-5 px-4">
            <div class="px-2 pb-2 d-flex justify-content-center align-self-center">
                <img class="me-1 my-2" src="assets/images/ico/SuccessTimer_popup.svg" alt="" style="height: 48px;width: 48px;">
            </div>
             <span class="px-1 dc-u-h1 dc-u-text-color--success" >${titleText}</span>
            <div class="px-2 pt-4" style="text-align: center">
                <span class="dc-u-body-1 dc-u-text-color--gray-90">${htmlText}</span>
            </div>
        </div>
        `,
      customClass: {
        htmlContainer: "dc-swal-container",
      },
      padding: "0px",
      showCloseButton: true,
      focusConfirm: false,
      showConfirmButton: false,
      confirmButtonText: "ตกลง",
      showCancelButton: false,
      timer: 1000,
      timerProgressBar: true,
      allowOutsideClick: false,
    }).then((result) => {
      r(true);
    });
  });
}

export function DialogInfo(htmlText: string = "", titleText: string = "ข้อมูล") {
  Swal.fire({
    html: `
        <div class="py-5 px-4">
            <div class="px-2 pb-2 d-flex justify-content-start align-self-center">
                <img class="me-1" src="assets/images/ico/Warning_popup.svg" alt="" style="height: 40px;width: 40px;">
                <span class="px-1 my-1" style="font-size:22px;"><strong>${titleText}</strong></span>
            </div>
            <div class="px-2 pt-4" style="text-align: left">
                <span>${htmlText}</span>
            </div>
        </div>
        <hr style="margin:0px; border: 1px solid #C5C8CB;">
        `,
    customClass: {
      htmlContainer: "dc-swal-container",
      actions: "py-3 m-0 px-4 mx-2 justify-content-end",
      confirmButton: "dc-c-btn-secondary-1 dc-swal-button",
    },
    padding: "0px",
    showCloseButton: true,
    focusConfirm: false,
    confirmButtonText: `OK`,
    allowOutsideClick: false,
  });

}

export function DialogWarningHtml(text = "", title = "แจ้งเตือน"): Promise<boolean> {
  text = transformDupErrorText(text);
  return new Promise((r) => {
    Swal.fire({
      html: `
        <div class="py-5 px-4">
            <div class="px-2 pb-2 d-flex justify-content-start align-self-center">
                <img class="me-1" src="assets/images/ico/Warning_popup.svg" alt="" style="height: 40px;width: 40px;">
                <span class="px-1 my-1 dc-u-h1 dc-u-text-color--gray-90" >${title}</span>
            </div>
            <div class="px-2 pt-4" style="text-align: left">
                <span class="dc-u-body-1 dc-u-text-color--gray-90">${text}</span>
            </div>
        </div>
        <hr style="margin:0px; border: 1px solid #C5C8CB;">
        `,
      customClass: {
        htmlContainer: "dc-swal-container",
        actions: "py-3 m-0 px-4 mx-2 justify-content-end",
        confirmButton: "dc-c-btn-secondary-1 dc-swal-button",
      },
      padding: "0px",
      showCloseButton: true,
      focusConfirm: true,
      confirmButtonText: `OK`,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        r(true);
      } else {
        r(false);
      }
    });
  });
}

export function DialogWarningHtmlCanScroll(text = "", title = "แจ้งเตือน"): Promise<boolean> {
  text = transformOraErrorText(text);
  return new Promise((r) => {
    Swal.fire({
      html: `
        <div class="py-5 px-4">
            <div class="px-2 pb-2 d-flex justify-content-start align-self-center">
                <img class="me-1" src="assets/images/ico/Warning_popup.svg" alt="" style="height: 40px;width: 40px;">
                <span class="px-1 my-1 dc-u-h1 dc-u-text-color--gray-90" >${title}</span>
            </div>
            <div class="px-2 pt-4" style="text-align: left;overflow-y:auto;max-height:400px;">
                <span class="dc-u-body-1 dc-u-text-color--gray-90">${text}</span>
            </div>
        </div>
        <hr style="margin:0px; border: 1px solid #C5C8CB;">
        `,
      customClass: {
        htmlContainer: "dc-swal-container",
        actions: "py-3 m-0 px-4 mx-2 justify-content-end",
        confirmButton: "dc-c-btn-secondary-1 dc-swal-button",
      },
      padding: "0px",
      showCloseButton: true,
      focusConfirm: true,
      confirmButtonText: `OK`,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        r(true);
      } else {
        r(false);
      }
    });
  });
}

export function DialogWarningHtmlNOTAllowEnterKey(text = "", title = "แจ้งเตือน"): Promise<boolean> {
  text = transformOraErrorText(text);
  return new Promise((r) => {
    Swal.fire({
      html: `
        <div class="py-5 px-4">
            <div class="px-2 pb-2 d-flex justify-content-start align-self-center">
                <img class="me-1" src="assets/images/ico/Warning_popup.svg" alt="" style="height: 40px;width: 40px;">
                <span class="px-1 my-1 dc-u-h1 dc-u-text-color--gray-90">${title}</span>
            </div>
            <div class="px-2 pt-4" style="text-align: left">
                <span class="dc-u-body-1 dc-u-text-color--gray-90">${text}</span>
            </div>
        </div>
        <hr style="margin:0px; border: 1px solid #C5C8CB;">
        `,
      customClass: {
        htmlContainer: "dc-swal-container",
        actions: "py-3 m-0 px-4 mx-2 justify-content-end",
        confirmButton: "dc-c-btn-secondary-1 dc-swal-button",
      },
      padding: "0px",
      showCloseButton: true,
      focusConfirm: true,
      confirmButtonText: `OK`,
      allowOutsideClick: false,
      allowEnterKey: false,
    }).then((result) => {
      if (result.isConfirmed) {
        r(true);
      } else {
        r(false);
      }
    });
  });
}

function transformDupErrorText(text: string) {
  // let hasDup = false;
  // hasDup = text.includes("Duplicate");
  // hasDup = hasDup || text.includes("UNIQUE constraint failed");
  // hasDup = hasDup || text.includes("ซ้ำ");
  // if (hasDup) {
  //   text = "มีข้อมูลนี้อยู่ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง";
  // }
  const hasDup = ["Duplicate", "UNIQUE constraint failed", "ซ้ำ", "ไม่สามารถเพิ่ม", "ในระบบแล้ว"].some(str => text.includes(str));
  if (hasDup) {
    text = "มีข้อมูลนี้อยู่ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง";
  }
  return text;
}

function transformOraErrorText(text: string) {
  let hasORA12570 = text.includes("ORA-12570");
  if (hasORA12570) {
    text = "ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาติดต่อผู้ดูแลระบบ (Timeout ORA-12570)";
  }
  return text;
}

export function DialogErrorHtmlConfirm(text = "", title = "ผิดพลาด") {
  text = transformOraErrorText(text);
  return new Promise((r) => {
    Swal.fire({
      html: `
        <div class="py-5 px-4">
            <div class="px-2 pb-2 d-flex justify-content-start align-self-center">
                <img class="me-1" src="assets/images/ico/Error_popup.svg" alt="" style="height: 40px;width: 40px;">
                <span class="px-1 my-1 dc-u-h1 dc-u-text-color--gray-90" >${title}</span>
            </div>
            <div class="px-2 pt-4" style="text-align: left">
                <span class="dc-u-body-1 dc-u-text-color--gray-90">${text}</span>
            </div>
        </div>
        <hr style="margin:0px; border: 1px solid #C5C8CB;">
        `,
      customClass: {
        htmlContainer: "dc-swal-container",
        actions: "py-3 m-0 px-4 mx-2 justify-content-end",
        confirmButton: "dc-c-btn-secondary-1 dc-swal-button",
      },
      padding: "0px",
      showCloseButton: true,
      focusConfirm: false,
      confirmButtonText: `OK`,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        r(true);
      } else {
        r(false);
      }
    });
  });
}

export function ConfirmDialog(_title = 'ยืนยันการทำรายการ ?', _text = ' ', ConfirmTxt = 'Confirm', CancelTxt = 'Cancel'): Promise<boolean> {
  _title = _title == '' ? 'ยืนยันการทำรายการ ?' : _title;
  return new Promise((r) => {
    Swal.fire({
      html: `
        <div class="py-5 px-4">
            <div class="px-2 pb-2 d-flex justify-content-start align-self-center">
                <img class="me-1" src="assets/images/ico/Confirmation_popup.svg" alt="" style="height: 40px;width: 40px;">
                <span class="px-1 my-1 dc-u-h1 dc-u-text-color--gray-90" >${_title}</span>
            </div>
            <div class="px-2 pt-4" style="text-align: left">
                <span class="dc-u-body-1 dc-u-text-color--gray-90">${_text}</span>
            </div>
        </div>
        <hr style="margin:0px; border: 1px solid #C5C8CB;">
        `,
      customClass: {
        htmlContainer: "dc-swal-container",
        actions: "py-3 m-0 px-4 mx-2 justify-content-end",
        confirmButton: "dc-c-btn-primary-2 dc-swal-button",
        cancelButton: "dc-c-btn-secondary-1 dc-swal-button",
      },
      padding: "0px",
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: ConfirmTxt,
      cancelButtonText: CancelTxt,
      focusCancel: true,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        r(true);
      } else {
        r(false);
      }
    });
  });
}

export function DialogConfirmCanScroll(text = ' ', title = 'ยืนยันการทำรายการ ?'): Promise<boolean> {
  return new Promise((r) => {
    Swal.fire({
      html: `
        <div class="py-5 px-4">
            <div class="px-2 pb-2 d-flex justify-content-start align-self-center">
                <img class="me-1" src="assets/images/ico/Confirmation_popup.svg" alt="" style="height: 40px;width: 40px;">
                <span class="px-1 my-1 dc-u-h1 dc-u-text-color--gray-90" >${title}</span>
            </div>
            <div class="px-2 pt-4" style="text-align: left;overflow-y:auto;max-height:300px;">
                <span class="dc-u-body-1 dc-u-text-color--gray-90">${text}</span>
            </div>
        </div>
        <hr style="margin:0px; border: 1px solid #C5C8CB;">
        `,
      customClass: {
        htmlContainer: "dc-swal-container",
        actions: "py-3 m-0 px-4 mx-2 justify-content-end",
        confirmButton: "dc-c-btn-primary-2 dc-swal-button",
        cancelButton: "dc-c-btn-secondary-1 dc-swal-button",
      },
      padding: "0px",
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      focusCancel: true,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        r(true);
      } else {
        r(false);
      }
    });
  });
}

export function DialogConfirmCanScrollCustom(text = ' ', title = 'ยืนยันการทำรายการ ?', confirmButtonText = "Confirm", cancelButtonText = "Cancel"): Promise<any> {
  return new Promise((r) => {
    Swal.fire({
      html: `
        <div class="py-5 px-4">
            <div class="px-2 pb-2 d-flex justify-content-start align-self-center">
                <img class="me-1" src="assets/images/ico/Confirmation_popup.svg" alt="" style="height: 40px;width: 40px;">
                <span class="px-1 my-1 dc-u-h1 dc-u-text-color--gray-90" >${title}</span>
            </div>
            <div class="px-2 pt-4" style="text-align: left;overflow-y:auto;max-height:300px;">
                <span class="dc-u-body-1 dc-u-text-color--gray-90">${text}</span>
            </div>
        </div>
        <hr style="margin:0px; border: 1px solid #C5C8CB;">
        `,
      customClass: {
        htmlContainer: "dc-swal-container",
        actions: "py-3 m-0 px-4 mx-2 justify-content-end",
        confirmButton: "dc-c-btn-primary-2 dc-swal-button",
        cancelButton: "dc-c-btn-secondary-1 dc-swal-button",
      },
      padding: "0px",
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: confirmButtonText,
      cancelButtonText: cancelButtonText,
      focusCancel: true,
      allowOutsideClick: false,
    }).then(result => {
      // if (result.isConfirmed) {
      //   console.log(result);
      //   // r(true);
      // } else if (result.dismiss === Swal.DismissReason.cancel) {
      //   console.log(result);
      // } else {
      //   console.log(result);
      //   // r(false);
      // }
      r(result);
    });
  });
}

export function ConfirmDelete(text = "ยืนยันการลบ", title = "คุณต้องการลบข้อมูลนี้ใช่หรือไม่ ?"): Promise<boolean> {
  return new Promise((r) => {
    Swal.fire({
      html: `
        <div class="py-5 px-4">
            <div class="px-2 pb-2 d-flex justify-content-start align-self-center">
                <img class="me-1" src="assets/images/ico/ConfirmDelete_popup.svg" alt="" style="height: 40px;width: 40px;">
                <span class="px-1 my-1 dc-u-h1 dc-u-text-color--gray-90" >${text}</span>
            </div>
            <div class="px-2 pt-4" style="text-align: left">
                <span class="dc-u-body-1 dc-u-text-color--gray-90">${title}</span>
            </div>
        </div>
        <hr style="margin:0px; border: 1px solid #C5C8CB;">
        `,
      customClass: {
        htmlContainer: "dc-swal-container",
        actions: "py-3 m-0 px-4 mx-2 justify-content-end",
        confirmButton: "dc-c-btn-primary-2--error dc-swal-button",
        cancelButton: "dc-c-btn-secondary-1 dc-swal-button",
      },
      padding: "0px",
      showCloseButton: true,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isConfirmed) {
        r(true);
      } else {
        r(false);
      }
    });
  });
}

export const PASSWORD_MODE = 'password';

export function SortingDatasource(datasource: any, opt: any) {
  let data = datasource || [];
  if (opt.sort && opt.sort.length > 0) {
    opt.sort.forEach((sortOption: any) => {
      const field = sortOption.selector;
      const direction = sortOption.desc ? -1 : 1;
      data = data.sort((a: any, b: any) => {
        if (a[field] < b[field]) return -1 * direction;
        if (a[field] > b[field]) return 1 * direction;
        return 0;
      });
    });
  }
  return data;
}

export function FilterInactive(gridDataSource: any, status: string): any {
  switch (status) {
    case "Active":
      return gridDataSource.filter((obj: any) => !obj.Inactivated);
    case "Inactive":
      return gridDataSource.filter((obj: any) => obj.Inactivated);
    default:
      return gridDataSource;
  }
}

export enum MessageType {
  SUCCESS = 'Operation completed successfully!',
  FAIL = 'Operation failed. Please try again.',
  WARNING = 'Please check your input values.',
  IS_REQUIRED = "It's required",
}

export function CalculateQTYForDrug(input: any) {
  // Extract input values
  let {
    RequestQty: RQ,  // หมอสั่ง
    DosageQty: DQ,
    ConsumeQty: ConsumeQty,
    DosageBy: DosageBy,
    RepeatPerDurationType: RP,
    EveryDurationType: FeqT,
    Every: EV,
    Duration: DR,
    DurationType: DT,
    StrengthQuantity: VL,  // ปริมาตรของยาต่อ ขวด,ถุง,Tab
    GroupType: GT,
    StatDoseYN: StatDoseYN,
    StatDoseQty: StatDoseQty,
    FractionalDoseRoundUpYN: FractionalDoseRoundUpYN, // RoundUp
    AllocatedFor: AF,  // จากช่องกรอก
    AllocatedForDurationType: AllocatedForDurationType,
    RequestStatus: RequestStatus
  } = input;

  // Define all required fields
  const requiredFields = [
    'RequestQty', 'ConsumeQty', 'DosageBy', 'RepeatPerDurationType',
    'EveryDurationType', 'Every', 'Duration', 'DurationType', 'AllocatedForDurationType',
    'StrengthQuantity', 'GroupType', 'StatDoseYN', 'AllocatedFor', 'RequestStatus', 'StatDoseQty'
  ];
  const missingFields = requiredFields.filter(field => !(field in input));
  if (missingFields.length > 0) {
    alert(`Missing required fields: ${missingFields.join(', ')}`)
    return `Missing required fields: ${missingFields.join(', ')}`;
  }
  // debugger
  let qty = 0; // ค่า QTY ที่จะคืนกลับ
  let FrequrncyTypeofUnit = 0;
  let DTU = 0; //DurationTypeOfUnit
  // สร้างตัวช่วยแปลงหน่วยย่อยเป็นวัน
  const convertToDays = (unit: string, value: number): number => {
    const timeUnitsInDays = {
      MN: value / timeUnits.MN, // นาที -> วัน
      H: timeUnits.H / value,        // ชั่วโมง -> วัน
      D: value,             // วัน -> วัน
      W: value * timeUnits.W,         // สัปดาห์ -> วัน
      M: value * timeUnits.M,        // เดือน -> วัน
      Y: value * timeUnits.Y        // ปี -> วัน
    };

    return timeUnitsInDays[unit as keyof typeof timeUnitsInDays] || 0;
  };

  // DurationType Freq
  let Min = 1440;
  let Hr = 24;
  let Month = 30;
  let Year = 365;
  let Day = 1;
  let Week = 7;

  let timeUnits = {
    MN: Min,  // นาที
    H: Hr,    // ชั่วโมง
    D: Day,   // วัน
    W: Week,  // สัปดาห์
    M: Month, // เดือน
    Y: Year   // ปี
  };
  let DoserPerDay = 0;
  // ตรวจสอบ FulidYN
  if (GT !== 'RX') {
    return returnOrder(RQ, true, 'FulidYN !== "GroupType"');
  }

  // ตรวจสอบ AllocatedFor (AF)
  if (AF <= 0 || AF === null) {
    return returnOrder(RQ, false, 'AF <= 0 || AF === null');
  }

  // คำนวณ DQVolume
  let DQVolume = DQ;
  if (DosageBy == 'A') {
    DQVolume = DQ * ConsumeQty;
  }
  // คำนวณ DoserPerDay
  if ((DosageBy != 'A') && FractionalDoseRoundUpYN == true) {
    // DQVolume = 300 ;
    // VL = 400 ;
    let CalDoseQty = Math.ceil((Math.ceil(DQVolume / VL)) * VL);
    DoserPerDay = CalDoseQty * RP
  } else {
    DoserPerDay = DQVolume * RP
  }

  // ปรับค่าตาม DurationType (DT)
  let DTs: keyof typeof timeUnits = DT;
  DTU = timeUnits[DTs];

  // ปรับค่าตาม FrequrncyType
  let FeqTs: keyof typeof timeUnits = FeqT;
  if (FeqT == 'D' || FeqT == 'M' || FeqT == 'Y') {
    FrequrncyTypeofUnit = timeUnits[FeqTs];
  } else {
    // EV = 1;
    RP = 1;
    FrequrncyTypeofUnit = 1;
  }

  // คำนวณ VolumeStat
  const VolumeStat = StatDoseYN ? (RequestStatus != 'N') ? StatDoseQty : 0 : 0;

  let VolumeQTY = 1
  if (DosageBy != 'Q') {
    VolumeQTY = VL;
  }

  // แปลง FrequencyType และ DurationType เป็นหน่วยวัน
  const DurationTypeTypeofUnitInDays = convertToDays(DT, DR); // แปลง DurationType เป็นวัน
  const EveryTypeofUnitInDays = convertToDays(FeqT, EV); // แปลง FrequencyType เป็นวัน
  const AllocatedForDurationInDays = convertToDays(AllocatedForDurationType, AF); // แปลง AllocatedForDurationType เป็นวัน
  let ConvertQty = 0;
  let FormulaWithValues = '';
  if (DosageBy == 'Q') {
    ConvertQty = (DoserPerDay * (AllocatedForDurationInDays / (EveryTypeofUnitInDays)) * VolumeQTY) + VolumeStat;
    // แทนค่าตัวเลขในสูตร
    FormulaWithValues = `(${DoserPerDay} * (${AllocatedForDurationInDays} / ${EveryTypeofUnitInDays}) * ${VolumeQTY}) + ${VolumeStat}`;

    // ปรับค่าหาก FrequencyType Hr ไม่ตรงกับที่กำหนด
    if (FeqT == 'H') {
      ConvertQty = ((DoserPerDay * EveryTypeofUnitInDays) * AllocatedForDurationInDays) + VolumeStat;
      // แทนค่าตัวเลขในสูตร
      FormulaWithValues = `(((${DoserPerDay} * ${EveryTypeofUnitInDays}) * ${AllocatedForDurationInDays}) + ${VolumeStat})`;
    }
    // ปรับค่าหาก FrequencyType MN ไม่ตรงกับที่กำหนด
    if (FeqT == 'MN') {
      // คำนวณ ConvertQty
      ConvertQty = ((DoserPerDay * (DurationTypeTypeofUnitInDays / EveryTypeofUnitInDays)) * AllocatedForDurationInDays) + VolumeStat;
      // สูตรพร้อมแทนค่า
      FormulaWithValues = `(((${DoserPerDay} * (${DurationTypeTypeofUnitInDays} / ${EveryTypeofUnitInDays})) * ${AllocatedForDurationInDays}) + ${VolumeStat})`;
    }
  } else {
    ConvertQty = (DoserPerDay * (AllocatedForDurationInDays / (EveryTypeofUnitInDays)) / VL) + VolumeStat;
    // แทนค่าตัวเลขในสูตร
    FormulaWithValues = `(${DoserPerDay} * (${AllocatedForDurationInDays} / ${EveryTypeofUnitInDays}))/ ${VL}) + ${VolumeStat}`;
    // ปรับค่าหาก FrequencyType Hr ไม่ตรงกับที่กำหนด
    if (FeqT == 'H') {
      ConvertQty = (((DoserPerDay * EveryTypeofUnitInDays) * AllocatedForDurationInDays) / VL) + VolumeStat;
      // แทนค่าตัวเลขในสูตร
      FormulaWithValues = `(${DoserPerDay} * ${EveryTypeofUnitInDays}) * ${AllocatedForDurationInDays})) / ${VL}) + ${VolumeStat})`;
    }
    // ปรับค่าหาก FrequencyType MN ไม่ตรงกับที่กำหนด
    if (FeqT == 'MN') {
      // คำนวณ ConvertQty
      ConvertQty = ((((DoserPerDay * (DurationTypeTypeofUnitInDays / EveryTypeofUnitInDays)) * AllocatedForDurationInDays)) / VL) + VolumeStat;
      // สูตรพร้อมแทนค่า
      FormulaWithValues = `((((${DoserPerDay} * (${DurationTypeTypeofUnitInDays} / ${EveryTypeofUnitInDays})) * ${AllocatedForDurationInDays})) / ${VL}) + ${VolumeStat})`;
    }
  }

  // เปรียบเทียบกับ RequestQty (RQ)
  qty = Math.ceil(ConvertQty) > RQ ? RQ : Math.ceil(ConvertQty);
  // qty = ConvertQty;
  // qty = Math.ceil(ConvertQty);
  let icon: boolean = (qty == RQ) ? true : false;
  return returnOrder(qty, false, FormulaWithValues, icon);
}


function returnOrder(order?: number, closeField?: any, Formula?: any, Icon?: any) {
  return {
    QTY: order,
    RedOnlyField: closeField ?? false,
    Formula: Formula,
    Icon: Icon ?? false,
  };
}

export function dxDateBoxToString(date: Date | null): string {
  if (!date) return '';
  const sd = new Date(date);
  const yyyy = sd.getFullYear();
  const mm = String(sd.getMonth() + 1).padStart(2, '0');
  const dd = String(sd.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T00:00:00`;
}

// ฟังก์ชันสำหรับเลือกข้อความทั้งหมดใน input field
export function selectAllInBox(e: any) {
  // console.log(e);
  try {
    const comp = e?.component;
    const root: any = comp && typeof comp.element === 'function' ? comp.element() : e?.element;
    const input: HTMLInputElement | null = (e?.event?.target instanceof HTMLInputElement)
      ? e.event.target
      : (root && typeof root.querySelector === 'function') ? root.querySelector('input') : null;

    if (!input) return;

    // กดครั้งเเรก
    try { input.focus(); } catch { }

    // เลือกที่ box
    try { input.select(); } catch { }

    // ให้ไม่เลื่อนหลังดเไปเเล้ว
    // try { input.addEventListener('mouseup', (ev: MouseEvent) => ev.preventDefault(), { once: true }); } catch { }

    // เลือกอีกครั้งกันพลาด
    // setTimeout(() => { try { input.select(); } catch { } }, 0);
  } catch { }
}

// Issue #91: format อายุ — ถ้า < 1 วัน แสดงเป็นชั่วโมง, อื่นๆ ใช้ PatientAge เดิม (Y M D)
export function formatAgeBy24HourRule(birthDate: string | Date | null | undefined, patientAge: string | null | undefined): string {
  if (!birthDate) return patientAge ?? '';

  let birth: Date;
  if (birthDate instanceof Date) {
    birth = birthDate;
  } else {
    const str = birthDate.toString().split('(')[0].trim(); // strip "(0Y 0M 0D)" if present
    birth = new Date(str);
    // Handle Thai date format dd/MM/yyyy (BE year) — convert to CE
    if (isNaN(birth.getTime()) && /^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
      const [dd, mm, yyyy] = str.split('/');
      const ceYear = parseInt(yyyy) > 2400 ? parseInt(yyyy) - 543 : parseInt(yyyy);
      birth = new Date(ceYear, parseInt(mm) - 1, parseInt(dd));
    }
  }
  if (isNaN(birth.getTime())) return patientAge ?? '';

  const now = new Date();
  const diffMs = now.getTime() - birth.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  // ถ้าอายุยังไม่ถึง 24 ชั่วโมง
  if (diffHours >= 0 && diffHours < 24) {
    // ถ้ามีเวลาเกิดจริง (ไม่ใช่ 00:00) → แสดงชั่วโมงจริง
    const hasTimeOfBirth = birth.getHours() !== 0 || birth.getMinutes() !== 0 || birth.getSeconds() !== 0;
    if (hasTimeOfBirth) {
      return `${diffHours} Hour${diffHours !== 1 ? 's' : ''}`;
    }
    // ไม่มีเวลาเกิด (date only) → แสดง "< 1 Day"
    return '< 1 Day';
  }
  return patientAge ?? '';
}

