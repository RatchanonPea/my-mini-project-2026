import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnInit, AfterViewInit, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';

// Leaflet's default marker images resolve relative to leaflet.css, which breaks once Angular
// bundles the CSS. L.Icon.Default always auto-detects and prepends an imagePath from the CSS
// even when iconUrl is set explicitly (see Icon.Default._getIconUrl in leaflet-src.js), so
// setting iconUrl via mergeOptions alone still produces a broken double-prefixed URL. A plain
// L.icon() (not the Default subclass) uses the given URLs as-is, with no such prefixing.
const pinIcon = L.icon({
  iconUrl: '/leaflet/images/marker-icon.png',
  iconRetinaUrl: '/leaflet/images/marker-icon-2x.png',
  shadowUrl: '/leaflet/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export interface LatLng {
  lat: number;
  lng: number;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface NominatimReverseResult {
  display_name: string;
}

const DEFAULT_CENTER: L.LatLngTuple = [13.7563, 100.5018]; // Bangkok
const DEFAULT_ZOOM = 6;
const PIN_ZOOM = 17;

@Component({
  selector: 'app-location-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <div class="location-picker">
      @if (!locked) {
        <div class="search-row">
          <mat-form-field appearance="outline" class="search-field" subscriptSizing="dynamic">
            <mat-label>ค้นหาสถานที่ / ที่อยู่</mat-label>
            <input matInput [(ngModel)]="query" (keydown.enter)="$event.preventDefault(); search()" placeholder="เช่น ตลาดสดเจ๊แดง หรือ ชื่อถนน" />
          </mat-form-field>
          <button mat-stroked-button type="button" (click)="search()" [disabled]="searching || !query.trim()">
            <mat-icon>search</mat-icon> ค้นหา
          </button>
        </div>

        <button mat-button type="button" class="my-location-btn" (click)="useMyLocation()" [disabled]="locating">
          <mat-icon>my_location</mat-icon> {{ locating ? 'กำลังค้นหาตำแหน่ง...' : 'ใช้ตำแหน่งปัจจุบันของฉัน' }}
        </button>
        @if (locationError) {
          <span class="location-error">{{ locationError }}</span>
        }

        @if (results.length) {
          <ul class="search-results">
            @for (r of results; track r.display_name) {
              <li>
                <button type="button" (click)="pickResult(r)">
                  <mat-icon>place</mat-icon>
                  <span>{{ r.display_name }}</span>
                </button>
              </li>
            }
          </ul>
        }
      }

      <div #mapEl class="map-canvas" [class.locked]="locked"></div>

      <div class="picker-footer">
        @if (locked) {
          <button mat-stroked-button type="button" (click)="unlock()">
            <mat-icon>edit_location_alt</mat-icon> แก้ไขหมุด
          </button>
        } @else {
          <span class="hint">คลิกบนแผนที่ หรือลากหมุดเพื่อปักตำแหน่งร้าน</span>
        }
        @if (lat !== null && lng !== null) {
          <a mat-button color="primary" [href]="googleMapsUrl()" target="_blank" rel="noopener">
            <mat-icon>open_in_new</mat-icon> เปิดใน Google Maps
          </a>
        }
      </div>
    </div>
  `,
  styles: `
    .location-picker { display: flex; flex-direction: column; gap: 0.5rem; }
    .search-row { display: flex; gap: 0.5rem; align-items: flex-start; }
    .search-field { flex: 1; }
    .search-results {
      list-style: none; margin: 0; padding: 0; max-height: 180px; overflow-y: auto;
      border: 1px solid rgba(124, 45, 18, 0.25); border-radius: 8px;
    }
    .search-results li + li { border-top: 1px solid rgba(124, 45, 18, 0.15); }
    .search-results button {
      display: flex; align-items: center; gap: 0.5rem; width: 100%; padding: 0.5rem 0.75rem;
      background: none; border: none; text-align: left; cursor: pointer; font-size: 0.85rem;
    }
    .search-results button:hover { background: rgba(234, 88, 12, 0.08); }
    .my-location-btn { align-self: flex-start; font-size: 0.85rem; }
    .location-error { font-size: 0.78rem; color: #b91c1c; }
    .map-canvas { width: 100%; height: 280px; border-radius: 12px; overflow: hidden; }
    .map-canvas.locked { cursor: default; }
    .picker-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .hint { font-size: 0.8rem; opacity: 0.7; }

    :host-context(html.dark-theme) .search-results { border-color: #4a2e20; }
    :host-context(html.dark-theme) .search-results button { color: #f3e8e0; }
    :host-context(html.dark-theme) .search-results button:hover { background: rgba(251, 146, 60, 0.15); }
    :host-context(html.dark-theme) .location-error { color: #fca5a5; }
  `,
})
export class LocationPicker implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('mapEl') private mapEl!: ElementRef<HTMLDivElement>;

  @Input() lat: number | null = null;
  @Input() lng: number | null = null;
  @Output() locationChange = new EventEmitter<LatLng>();
  // Fired whenever the pin moves, with the reverse-geocoded address as a suggested default —
  // the consuming form is free to overwrite/edit that text afterward without moving the pin back.
  @Output() addressChange = new EventEmitter<string>();

  private http = inject(HttpClient);
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private ready = false;

  query = '';
  searching = false;
  results: NominatimResult[] = [];
  locked = false;
  locating = false;
  locationError = '';

  ngOnInit(): void {
    // A location that was already saved starts locked so it can't be nudged by an accidental
    // click; the user must explicitly hit "แก้ไขหมุด" to move it. Set before the first change
    // detection pass (not in ngAfterViewInit) to avoid an ExpressionChangedAfterItHasBeenChecked
    // error on the @if/@else branch this flag controls.
    this.locked = this.lat !== null && this.lng !== null;
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapEl.nativeElement).setView(
      this.lat !== null && this.lng !== null ? [this.lat, this.lng] : DEFAULT_CENTER,
      this.lat !== null && this.lng !== null ? PIN_ZOOM : DEFAULT_ZOOM,
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(this.map);

    if (this.lat !== null && this.lng !== null) {
      this.placeMarker(this.lat, this.lng, false);
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      if (this.locked) return;
      this.setLocation(e.latlng.lat, e.latlng.lng);
    });

    // Leaflet snapshots the container's size at creation time; if Angular hasn't finished laying
    // out the flex column yet (e.g. still mid page-enter animation), that snapshot is wrong and
    // the map renders squeezed into a corner. Re-measure once the container has its final size.
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
    this.resizeObserver.observe(this.mapEl.nativeElement);
    requestAnimationFrame(() => this.map?.invalidateSize());

    this.ready = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready || !this.map) return;
    if ((changes['lat'] || changes['lng']) && this.lat !== null && this.lng !== null) {
      this.placeMarker(this.lat, this.lng, true);
    }
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.map?.remove();
  }

  private placeMarker(lat: number, lng: number, recenter: boolean): void {
    if (!this.map) return;
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng], { icon: pinIcon, draggable: !this.locked }).addTo(this.map);
      this.marker.on('dragend', () => {
        const pos = this.marker!.getLatLng();
        this.setLocation(pos.lat, pos.lng, false);
      });
    }
    if (recenter) {
      this.map.setView([lat, lng], Math.max(this.map.getZoom(), PIN_ZOOM));
    }
  }

  private setLocation(lat: number, lng: number, recenter = false, knownAddress?: string): void {
    this.lat = lat;
    this.lng = lng;
    this.placeMarker(lat, lng, recenter);
    this.locationChange.emit({ lat, lng });

    if (knownAddress !== undefined) {
      this.addressChange.emit(knownAddress);
    } else {
      this.reverseGeocode(lat, lng);
    }
  }

  private reverseGeocode(lat: number, lng: number): void {
    const params = { format: 'json', lat: String(lat), lon: String(lng) };
    this.http.get<NominatimReverseResult>('https://nominatim.openstreetmap.org/reverse', { params }).subscribe({
      next: (r) => {
        if (r?.display_name) this.addressChange.emit(r.display_name);
      },
      error: () => {},
    });
  }

  search(): void {
    const q = this.query.trim();
    if (!q) return;
    this.searching = true;
    this.results = [];
    const params = { format: 'json', q, limit: '5', countrycodes: 'th' };
    this.http.get<NominatimResult[]>('https://nominatim.openstreetmap.org/search', { params }).subscribe({
      next: (r) => {
        this.results = r;
        this.searching = false;
      },
      error: () => {
        this.searching = false;
      },
    });
  }

  pickResult(r: NominatimResult): void {
    this.results = [];
    this.setLocation(Number(r.lat), Number(r.lon), true, r.display_name);
  }

  useMyLocation(): void {
    if (!navigator.geolocation) {
      this.locationError = 'เบราว์เซอร์นี้ไม่รองรับการค้นหาตำแหน่ง';
      return;
    }
    this.locating = true;
    this.locationError = '';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        this.locating = false;
        this.setLocation(pos.coords.latitude, pos.coords.longitude, true);
      },
      (err) => {
        this.locating = false;
        this.locationError = err.code === err.PERMISSION_DENIED
          ? 'กรุณาอนุญาตให้เข้าถึงตำแหน่งของคุณ'
          : 'ไม่สามารถค้นหาตำแหน่งได้ กรุณาลองใหม่';
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  googleMapsUrl(): string {
    return `https://www.google.com/maps?q=${this.lat},${this.lng}`;
  }

  unlock(): void {
    this.locked = false;
    this.marker?.dragging?.enable();
  }

  // Clears the pin — used by forms (e.g. "add supplier") that reset themselves after a successful
  // submit, so the map goes back to its empty starting state along with the rest of the form.
  reset(): void {
    this.lat = null;
    this.lng = null;
    this.locked = false;
    this.query = '';
    this.results = [];
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
    this.map?.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
  }
}
