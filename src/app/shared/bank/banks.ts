/**
 * Banks offered in the bank selector. `code` is also the file name of its badge in assets/images/banks/.
 * What is stored in the database is the Thai name, so printed documents read naturally.
 */
export interface Bank {
  code: string;
  name: string;
  /** lower-cased fragments that identify the bank in older free-text values ("กสิกร", "KBank") */
  aliases: string[];
}

export const OTHER_BANK = 'OTHER';

export const BANKS: Bank[] = [
  { code: 'BBL', name: 'ธนาคารกรุงเทพ', aliases: ['กรุงเทพ', 'bbl', 'bangkokbank'] },
  { code: 'KBANK', name: 'ธนาคารกสิกรไทย', aliases: ['กสิกร', 'kbank', 'kasikorn'] },
  { code: 'KTB', name: 'ธนาคารกรุงไทย', aliases: ['กรุงไทย', 'ktb', 'krungthai'] },
  { code: 'SCB', name: 'ธนาคารไทยพาณิชย์', aliases: ['ไทยพาณิชย์', 'scb'] },
  { code: 'BAY', name: 'ธนาคารกรุงศรีอยุธยา', aliases: ['กรุงศรี', 'อยุธยา', 'krungsri', 'bay'] },
  { code: 'TTB', name: 'ธนาคารทหารไทยธนชาต', aliases: ['ทหารไทย', 'ธนชาต', 'ttb', 'tmb'] },
  { code: 'GSB', name: 'ธนาคารออมสิน', aliases: ['ออมสิน', 'gsb'] },
  { code: 'BAAC', name: 'ธนาคารเพื่อการเกษตรและสหกรณ์การเกษตร (ธ.ก.ส.)', aliases: ['ธกส', 'เพื่อการเกษตร', 'baac'] },
  { code: 'GHB', name: 'ธนาคารอาคารสงเคราะห์', aliases: ['อาคารสงเคราะห์', 'ธอส', 'ghb'] },
  { code: 'CIMBT', name: 'ธนาคารซีไอเอ็มบี ไทย', aliases: ['ซีไอเอ็มบี', 'cimb'] },
  { code: 'UOB', name: 'ธนาคารยูโอบี', aliases: ['ยูโอบี', 'uob'] },
  { code: 'KKP', name: 'ธนาคารเกียรตินาคินภัทร', aliases: ['เกียรตินาคิน', 'kkp', 'kiatnakin'] },
  { code: 'LHBANK', name: 'ธนาคารแลนด์ แอนด์ เฮ้าส์', aliases: ['แลนด์', 'lhbank'] },
  { code: 'ISBT', name: 'ธนาคารอิสลามแห่งประเทศไทย', aliases: ['อิสลาม', 'isbt'] },
  { code: 'TISCO', name: 'ธนาคารทิสโก้', aliases: ['ทิสโก้', 'tisco'] },
  { code: 'ICBC', name: 'ธนาคารไอซีบีซี (ไทย)', aliases: ['ไอซีบีซี', 'icbc'] },
  { code: 'SME', name: 'ธนาคารพัฒนาวิสาหกิจขนาดกลางและขนาดย่อมแห่งประเทศไทย', aliases: ['sme', 'พัฒนาวิสาหกิจ'] },
];

const normalise = (text: string): string => text.toLowerCase().replace(/[\s.()\-]/g, '').replace(/ธนาคาร/g, '');

/** the bank a stored name belongs to (exact name first, then the aliases), or null for an unknown / free-text bank */
export function findBank(name: string | null | undefined): Bank | null {
  const wanted = normalise(String(name ?? ''));
  if (!wanted) return null;
  return (
    BANKS.find((b) => normalise(b.name) === wanted) ??
    BANKS.find((b) => b.aliases.some((alias) => wanted.includes(normalise(alias)))) ??
    null
  );
}
