import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** digits only, at most 13 */
export const digitsOnly = (value: unknown): string => String(value ?? '').replace(/\D/g, '').slice(0, 13);

/**
 * Thai national ID card layout: 1-2345-67890-12-3 (1 + 4 + 5 + 2 + 1 digits). Also used for the 13-digit
 * juristic person registration / tax id, which is written the same way. Partial input is formatted as far as it goes.
 */
export function formatThaiId(value: unknown): string {
  const d = digitsOnly(value);
  const parts = [d.slice(0, 1), d.slice(1, 5), d.slice(5, 10), d.slice(10, 12), d.slice(12, 13)];
  return parts.filter(Boolean).join('-');
}

/** the 13th digit of a national ID is a check digit over the first 12 */
export function hasValidThaiIdChecksum(value: unknown): boolean {
  const d = digitsOnly(value);
  if (d.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d[i]) * (13 - i);
  return (11 - (sum % 11)) % 10 === Number(d[12]);
}

/** 13 digits (juristic person id / tax id). Empty is fine: required-ness is a separate validator. */
export const thaiId13Validator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const v = String(control.value ?? '');
  return v === '' || /^\d{13}$/.test(v) ? null : { thaiId: true };
};

/** 13 digits whose check digit is correct: the number printed on a Thai ID card. */
export const thaiNationalIdValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const v = String(control.value ?? '');
  if (v === '') return null;
  if (!/^\d{13}$/.test(v)) return { thaiId: true };
  return hasValidThaiIdChecksum(v) ? null : { thaiIdChecksum: true };
};
