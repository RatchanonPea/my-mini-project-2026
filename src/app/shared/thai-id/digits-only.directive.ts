import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Lets only digits be typed or pasted into an input (account numbers, day counts...). Letters never appear:
 * the keystroke is refused, and pasted text is cleaned. For type="number" it also refuses e, +, - and "."
 * which the browser would otherwise accept in a number field.
 */
@Directive({ selector: 'input[appDigitsOnly]', standalone: true })
export class DigitsOnlyInput {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  @HostListener('beforeinput', ['$event'])
  onBeforeInput(event: InputEvent): void {
    if (event.data && /\D/.test(event.data)) event.preventDefault();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.el.type === 'number' && ['e', 'E', '+', '-', '.', ','].includes(event.key)) event.preventDefault();
  }

  @HostListener('input')
  onInput(): void {
    if (this.el.type === 'number') return; // the browser already limits a number field's value
    const clean = this.el.value.replace(/\D/g, '');
    if (clean !== this.el.value) {
      this.el.value = clean;
      // tell the form: pasted text was cleaned after the form's own input listener may have read it
      this.el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
}
