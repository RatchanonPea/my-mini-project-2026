import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../services/theme';
import { Chicken } from '../chicken/chicken';
import { ConfirmDialog } from '../../common/helper';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, Chicken],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
})
export class Navbar implements OnInit, AfterViewInit, OnDestroy {
  readonly brandTitle = 'Arre ไก่หมุน';
  readonly brandSubtitle = 'By อารี อิ่มสอาด';
  // split by grapheme (not code point) so Thai vowels / tone marks stay attached to their consonant
  readonly brandLetters = Navbar.splitGraphemes(this.brandTitle);
  readonly brandSubLetters = Navbar.splitGraphemes(this.brandSubtitle);

  private static splitGraphemes(text: string): string[] {
    const Segmenter = (Intl as unknown as { Segmenter?: new (locale: string, options: object) => { segment(input: string): Iterable<{ segment: string }> } }).Segmenter;
    return Segmenter
      ? Array.from(new Segmenter('th', { granularity: 'grapheme' }).segment(text), (part) => part.segment)
      : Array.from(text);
  }

  currentUser: string | null = null;
  currentUserRole: string | null = null;
  isDropdownOpen = false;
  private subscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    public theme: ThemeService,
    private zone: NgZone,
    private host: ElementRef<HTMLElement>,
  ) {}

  private letters: HTMLElement[] = [];
  private subtitleLetters = new Set<HTMLElement>();
  private lettersUnderChicken = new Set<HTMLElement>();

  // a letter hops once each time the chicken walks onto it, not repeatedly while it lingers there
  private onChickenStep = (event: Event): void => {
    const { x, half } = (event as CustomEvent<{ x: number; half: number }>).detail;
    for (const letter of this.letters) {
      const rect = letter.getBoundingClientRect();
      const distance = Math.abs(x - (rect.left + rect.width / 2));
      // only the small "By ..." line changes colour under the white chicken; the big title just hops
      if (this.subtitleLetters.has(letter)) {
        letter.classList.toggle('contrast', distance < half + rect.width / 2);
      }
      const under = distance < rect.width / 2 + 4;
      if (!under) {
        this.lettersUnderChicken.delete(letter);
        continue;
      }
      if (this.lettersUnderChicken.has(letter)) {
        continue;
      }
      this.lettersUnderChicken.add(letter);
      letter.classList.remove('bounce');
      void letter.offsetWidth;
      letter.classList.add('bounce');
      letter.addEventListener('animationend', () => letter.classList.remove('bounce'), { once: true });
    }
  };

  ngAfterViewInit(): void {
    this.letters = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('.brand-letter'));
    this.subtitleLetters = new Set(this.host.nativeElement.querySelectorAll<HTMLElement>('.brand-subtitle .brand-letter'));
    this.zone.runOutsideAngular(() => window.addEventListener('chicken-step', this.onChickenStep));
  }

  ngOnInit(): void {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );
    this.subscription.add(
      this.authService.currentUserRole$.subscribe(role => {
        this.currentUserRole = role;
      })
    );
  }

  ngOnDestroy(): void {
    window.removeEventListener('chicken-step', this.onChickenStep);
    this.subscription.unsubscribe();
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  logout(): void {
     ConfirmDialog('ยืนยันการออกจากระบบ',"คุณต้องการออกจากระบบใช่หรือไม่")
        .then(async emit => {
          if (emit) {
            this.authService.logout();
          }
        });
  }
}
