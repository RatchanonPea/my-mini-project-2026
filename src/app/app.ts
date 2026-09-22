import { Component, inject } from '@angular/core';
import { NetworkService } from './services/network';
import { ThemeService } from './services/theme';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected network = inject(NetworkService);
  private theme = inject(ThemeService);
  protected title = 'Arre ไก่หมุน';
}
