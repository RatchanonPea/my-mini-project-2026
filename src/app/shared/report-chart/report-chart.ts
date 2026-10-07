import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ThemeService } from '../../services/theme';
import Chart, { ChartType } from 'chart.js/auto';

export interface ReportChartSeries {
  label: string;
  data: number[];
  color: string;
}

// A small line/bar toggle-able chart used on both Reports and Dashboard, built directly on
// Chart.js (same "use the JS library directly" pattern as Leaflet in location-picker.ts) rather
// than pulling in an Angular wrapper package for it.
@Component({
  selector: 'app-report-chart',
  standalone: true,
  imports: [CommonModule, MatButtonToggleModule],
  template: `
    <div class="chart-toolbar">
      <mat-button-toggle-group [value]="chartType" (change)="setType($event.value)" aria-label="ชนิดกราฟ">
        <mat-button-toggle value="line"><i class="fas fa-chart-line"></i> เส้น</mat-button-toggle>
        <mat-button-toggle value="bar"><i class="fas fa-chart-column"></i> แท่ง</mat-button-toggle>
      </mat-button-toggle-group>
    </div>
    <div class="chart-wrap" [class.empty]="!labels.length">
      @if (labels.length) {
        <canvas #canvas></canvas>
      } @else {
        <p class="no-data">ยังไม่มีข้อมูลสำหรับช่วงนี้</p>
      }
    </div>
  `,
  styles: `
    :host { display: block; }
    .chart-toolbar { display: flex; justify-content: flex-end; margin-bottom: 0.75rem; }
    .chart-wrap { position: relative; height: 280px; }
    .chart-wrap.empty { display: grid; place-items: center; }
    .no-data { margin: 0; opacity: 0.6; font-size: 0.9rem; }

    ::ng-deep .mat-button-toggle-group {
      border-radius: 999px !important;
      overflow: hidden;
      border-color: rgba(124, 45, 18, 0.25) !important;
    }
    ::ng-deep .mat-button-toggle-checked {
      background-color: #ea580c !important;
      color: #fff !important;
    }
    ::ng-deep .mat-button-toggle-label-content {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.82rem;
      line-height: 2.2 !important;
      padding: 0 0.9rem !important;
    }
  `,
})
export class ReportChart implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvasRef?: ElementRef<HTMLCanvasElement>;
  @Input() labels: string[] = [];
  @Input() series: ReportChartSeries[] = [];

  private theme = inject(ThemeService);
  private chart: Chart | null = null;
  chartType: ChartType = 'line';
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['labels'] || changes['series']) && this.viewReady) {
      this.render();
    }
  }

  setType(type: ChartType): void {
    this.chartType = type;
    this.render();
  }

  private render(): void {
    if (!this.canvasRef || !this.labels.length) {
      this.chart?.destroy();
      this.chart = null;
      return;
    }
    const isDark = this.theme.mode() === 'dark';
    const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.06)';
    const tickColor = isDark ? '#b9a79b' : '#475569';

    this.chart?.destroy();
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: this.chartType,
      data: {
        labels: this.labels,
        datasets: this.series.map((s) => ({
          label: s.label,
          data: s.data,
          borderColor: s.color,
          backgroundColor: this.chartType === 'bar' ? s.color + 'cc' : s.color + '26',
          fill: this.chartType === 'line',
          tension: 0.35,
          borderRadius: this.chartType === 'bar' ? 6 : 0,
          borderWidth: 2,
          pointRadius: this.chartType === 'line' ? 3 : 0,
          pointHoverRadius: 5,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: tickColor, usePointStyle: true } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString('th-TH')} บาท`,
            },
          },
        },
        scales: {
          x: { grid: { color: gridColor }, ticks: { color: tickColor } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor, callback: (v) => Number(v).toLocaleString('th-TH') } },
        },
      },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
