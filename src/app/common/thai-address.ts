/** One sub-district with the district / province / postal code it belongs to. */
export interface AddressRow {
  sub: string;
  district: string;
  province: string;
  zip: string;
}

export type AddressField = 'sub' | 'district' | 'province' | 'zip';
export const ADDRESS_FIELDS: readonly AddressField[] = ['sub', 'district', 'province', 'zip'];

export type AddressSelection = Record<AddressField, string>;

export interface AddressParts extends AddressSelection {
  /** house number, moo, soi, road... */
  detail: string;
}

interface RawAddressData {
  provinces: string[];
  districts: [string, number][];
  subs: [string, number, string][];
}

export const BANGKOK = 'กรุงเทพมหานคร';
export const EMPTY_SELECTION: AddressSelection = { sub: '', district: '', province: '', zip: '' };

let cache: Promise<AddressRow[]> | undefined;

/** Fetches (once) the sub-district / district / province / postal code list from assets/data/thai-address.json. */
export function loadAddressRows(): Promise<AddressRow[]> {
  cache ??= fetch('assets/data/thai-address.json')
    .then((res) => {
      if (!res.ok) throw new Error(`address data ${res.status}`);
      return res.json() as Promise<RawAddressData>;
    })
    .then((d) =>
      d.subs.map(([sub, districtIx, zip]) => ({
        sub,
        district: d.districts[districtIx][0],
        province: d.provinces[d.districts[districtIx][1]],
        zip,
      })),
    )
    .catch((err) => {
      cache = undefined; // allow a retry
      throw err;
    });
  return cache;
}

/** Rows that agree with every chosen part (empty parts are ignored). */
export function matchRows(rows: AddressRow[], chosen: Partial<AddressSelection>): AddressRow[] {
  return rows.filter((r) => ADDRESS_FIELDS.every((f) => !chosen[f] || r[f] === chosen[f]));
}

/** Bangkok uses แขวง / เขต, everywhere else ตำบล / อำเภอ / จังหวัด. */
export function composeAddress(p: AddressParts): string {
  const bkk = p.province === BANGKOK;
  return [
    p.detail.trim(),
    p.sub && `${bkk ? 'แขวง' : 'ต.'}${p.sub}`,
    p.district && `${bkk ? 'เขต' : 'อ.'}${p.district}`,
    p.province && `${bkk ? '' : 'จ.'}${p.province}`,
    p.zip,
  ]
    .filter(Boolean)
    .join(' ');
}

const TAIL = /^(.*?)\s*(?:ต\.|แขวง)\s*(\S.*?)\s+(?:อ\.|เขต)\s*(\S.*?)\s+(?:จ\.\s*)?(\S.*?)\s+(\d{5})\s*$/s;

/**
 * Splits a stored address back into its parts. Only a tail that names a real sub-district / district / province /
 * postal code combination counts; anything else (older free text) is kept whole as the detail line.
 */
export function parseAddress(text: string, rows: AddressRow[]): AddressParts {
  const value = (text ?? '').trim();
  const m = TAIL.exec(value);
  if (m && rows.some((r) => r.sub === m[2] && r.district === m[3] && r.province === m[4] && r.zip === m[5])) {
    return { detail: m[1].trim(), sub: m[2], district: m[3], province: m[4], zip: m[5] };
  }
  return { detail: value, ...EMPTY_SELECTION };
}
