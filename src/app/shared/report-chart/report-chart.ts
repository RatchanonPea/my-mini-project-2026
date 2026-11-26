import { AfterViewInit, Component, ElementRef, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ThemeService } from '../../services/theme';
import Chart, { ChartType, Plugin, ScriptableContext } from 'chart.js/auto';

export interface ReportChartSeries {
  label: string;
  data: number[];
  color: string;
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/** soft area under a line: the series colour fading out towards the bottom of the plot (colour is #rrggbb) */
function areaFill(color: string) {
  return ({ chart }: ScriptableContext<ChartType>) => {
    const area = chart.chartArea;
    // first layout pass: the plot has no size yet
    if (!area) return color + '1f';
    const gradient = chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
    gradient.addColorStop(0, color + '4d');
    gradient.addColorStop(1, color + '00');
    return gradient;
  };
}

/** thin vertical guide through the hovered period on the line chart */
const hoverGuide = (color: string): Plugin => ({
  id: 'hoverGuide',
  beforeDatasetsDraw(chart) {
    const active = chart.tooltip?.getActiveElements()[0];
    if (!active || (chart.config as { type?: ChartType }).type !== 'line') return;
    const { ctx, chartArea } = chart;
    ctx.save();
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = color;
    ctx.moveTo(active.element.x, chartArea.top);
    ctx.lineTo(active.element.x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
});

/** figure above each bar (below for negatives) */
const barValues = (labelColor: string, fontFamily: string): Plugin => ({
  id: 'barValues',
  // drawn once, after every bar, so a neighbouring bar can't paint over a figure
  afterDatasetsDraw(chart) {
    if ((chart.config as { type?: ChartType }).type !== 'bar') return;
    const { ctx, data } = chart;
    const labels: { text: string; x: number; y: number; below: boolean; width: number }[] = [];
    ctx.save();
    ctx.font = `700 14px ${fontFamily}`;
    data.datasets.forEach((set, d) => {
      if (!chart.isDatasetVisible(d)) return;
      chart.getDatasetMeta(d).data.forEach((element, i) => {
        const value = Number((set.data as number[])[i]);
        if (!value) return;
        const { x, y } = element.getProps(['x', 'y']) as { x: number; y: number };
        const text = compact.format(value);
        const below = value < 0;
        labels.push({ text, below, x, y: below ? y + 4 : y - 4, width: ctx.measureText(text).width });
      });
    });

    // all or nothing: if any two figures would touch, show none (the tooltip still has them all).
    // Showing only some would look like the rest have no value.
    const crowded = labels.some((a, i) =>
      labels.slice(i + 1).some((b) => Math.abs(a.x - b.x) < (a.width + b.width) / 2 + 6 && Math.abs(a.y - b.y) < 18));
    if (!crowded) {
      ctx.fillStyle = labelColor;
      ctx.textAlign = 'center';
      labels.forEach((label) => {
        ctx.textBaseline = label.below ? 'top' : 'bottom';
        ctx.fillText(label.text, label.x, label.y);
      });
    }
    ctx.restore();
  },
});

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
    .chart-wrap { position: relative; height: 320px; }
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
      font-size: 0.875rem;
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
    const gridColor = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(67,20,7,0.09)';
    const tickColor = isDark ? '#dccbbf' : '#4a3a31';
    const surface = isDark ? '#241a15' : '#ffffff';
    const font = { family: getComputedStyle(document.body).fontFamily, size: 14 };
    const isLine = this.chartType === 'line';

    this.chart?.destroy();
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: this.chartType,
      plugins: [
        hoverGuide(isDark ? 'rgba(253,186,116,0.5)' : 'rgba(194,65,12,0.4)'),
        barValues(isDark ? '#f7eee8' : '#1f1410', font.family),
      ],
      data: {
        labels: this.labels,
        datasets: this.series.map((s) => ({
          label: s.label,
          data: s.data,
          borderColor: s.color,
          backgroundColor: isLine ? areaFill(s.color) : s.color,
          fill: isLine,
          // monotone: smooth without overshooting, so the curve never shows values that don't exist
          cubicInterpolationMode: 'monotone' as const,
          borderWidth: isLine ? 2.5 : 0,
          borderRadius: isLine ? 0 : 4,
          maxBarThickness: 34,
          categoryPercentage: 0.72,
          barPercentage: 0.85,
          // a small dot on every period, ringed in the card colour
          pointRadius: isLine ? 3.5 : 0,
          pointHoverRadius: 6,
          pointBackgroundColor: s.color,
          pointBorderColor: surface,
          pointBorderWidth: 1.5,
          pointHoverBackgroundColor: s.color,
          pointHoverBorderColor: surface,
          pointHoverBorderWidth: 3,
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        // head room for the figures above the bars
        layout: { padding: { top: 8 } },
        plugins: {
          legend: {
            align: 'start',
            labels: { color: tickColor, font, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 18 },
          },
          tooltip: {
            backgroundColor: surface,
            titleColor: isDark ? '#f7eee8' : '#1f1410',
            bodyColor: tickColor,
            borderColor: isDark ? 'rgba(253,186,116,0.25)' : 'rgba(124,45,18,0.15)',
            borderWidth: 1,
            cornerRadius: 12,
            padding: 12,
            boxPadding: 6,
            usePointStyle: true,
            titleFont: { ...font, size: 15, weight: 'bold' },
            bodyFont: font,
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString('th-TH')} บาท`,
            },
          },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: tickColor, font, maxRotation: 0, autoSkipPadding: 16 } },
          y: {
            grid: { color: gridColor },
            border: { display: false },
            grace: '12%',
            ticks: { color: tickColor, font, maxTicksLimit: 6, padding: 8, callback: (v) => compact.format(Number(v)) },
          },
        },
      },
    });
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
