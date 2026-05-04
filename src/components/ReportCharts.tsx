import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import type { ParseSummary, UploadResponse } from '../types';

const CHART_COLORS = [
  '#667eea',
  '#764ba2',
  '#3498db',
  '#1abc9c',
  '#f39c12',
  '#e74c3c',
  '#9b59b6',
  '#2ecc71',
  '#34495e',
  '#95a5a6',
  '#16a085',
  '#2980b9',
];

const currencyFmt = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
const currencyFmtFine = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});
const pctFmt = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

function fmtUsd(n: number) {
  return currencyFmt.format(n);
}
function fmtUsdFine(n: number) {
  return currencyFmtFine.format(n);
}
function fmtPct(n: number) {
  return `${pctFmt.format(n)}%`;
}

function truncate(str: string | undefined | null, max: number) {
  const s = str != null ? String(str) : '';
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

interface Props {
  data: UploadResponse;
  summary: ParseSummary;
}

export function ReportCharts({ data, summary }: Props) {
  const catRef = useRef<HTMLCanvasElement>(null);
  const topRef = useRef<HTMLCanvasElement>(null);
  const usdRef = useRef<HTMLCanvasElement>(null);
  const pctRef = useRef<HTMLCanvasElement>(null);

  const cats = summary.categoryTotals ?? [];
  const tops = summary.topLineItems ?? [];
  const kUsd = summary.kpiUsdPreview ?? [];
  const kPct = summary.kpiPctPreview ?? [];
  const counts = summary.counts ?? {};
  const periods = summary.reportingPeriodsPreview ?? [];

  const periodLine =
    periods.length > 0
      ? periods
          .map((p) => p.period_label ?? p.period_start ?? '—')
          .join(' · ')
      : '—';

  useEffect(() => {
    const instances: Chart[] = [];

    const categoryTotals = summary.categoryTotals ?? [];
    const topLineItems = summary.topLineItems ?? [];
    const usdKpis = summary.kpiUsdPreview ?? [];
    const pctKpis = summary.kpiPctPreview ?? [];

    if (catRef.current && categoryTotals.length > 0) {
      Chart.getChart(catRef.current)?.destroy();
      instances.push(
        new Chart(catRef.current, {
          type: 'bar',
          data: {
            labels: categoryTotals.map((c) => truncate(c.category, 42)),
            datasets: [
              {
                label: 'Total',
                data: categoryTotals.map((c) => c.total),
                backgroundColor: categoryTotals.map(
                  (_, i) => CHART_COLORS[i % CHART_COLORS.length]
                ),
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => fmtUsdFine(ctx.raw as number),
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  callback: (v) => fmtUsd(Number(v)),
                  maxTicksLimit: 8,
                },
              },
            },
          },
        })
      );
    }

    if (topRef.current && topLineItems.length > 0) {
      Chart.getChart(topRef.current)?.destroy();
      instances.push(
        new Chart(topRef.current, {
          type: 'bar',
          data: {
            labels: topLineItems.map((r) =>
              truncate(r.line_item || '(unnamed)', 36)
            ),
            datasets: [
              {
                label: 'Amount',
                data: topLineItems.map((r) => r.amount),
                backgroundColor: topLineItems.map(
                  (_, i) => CHART_COLORS[(i + 3) % CHART_COLORS.length]
                ),
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const row = topLineItems[ctx.dataIndex];
                    const cat = row?.category ? ` (${row.category})` : '';
                    return `${fmtUsdFine(ctx.raw as number)}${cat}`;
                  },
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  callback: (v) => fmtUsd(Number(v)),
                  maxTicksLimit: 8,
                },
              },
            },
          },
        })
      );
    }

    if (usdRef.current && usdKpis.length > 0) {
      Chart.getChart(usdRef.current)?.destroy();
      instances.push(
        new Chart(usdRef.current, {
          type: 'doughnut',
          data: {
            labels: usdKpis.map((k) => truncate(k.kpi_name, 28)),
            datasets: [
              {
                data: usdKpis.map((k) => k.kpi_value),
                backgroundColor: usdKpis.map(
                  (_, i) => CHART_COLORS[i % CHART_COLORS.length]
                ),
                borderWidth: 1,
                borderColor: '#fff',
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: { boxWidth: 12, font: { size: 11 } },
              },
              tooltip: {
                callbacks: {
                  label: (ctx) => {
                    const label = ctx.label ?? '';
                    return `${label}: ${fmtUsdFine(ctx.raw as number)}`;
                  },
                },
              },
            },
          },
        })
      );
    }

    if (pctRef.current && pctKpis.length > 0) {
      Chart.getChart(pctRef.current)?.destroy();
      instances.push(
        new Chart(pctRef.current, {
          type: 'bar',
          data: {
            labels: pctKpis.map((k) => truncate(k.kpi_name, 40)),
            datasets: [
              {
                label: '%',
                data: pctKpis.map((k) => k.kpi_value),
                backgroundColor: pctKpis.map(
                  (_, i) => CHART_COLORS[(i + 5) % CHART_COLORS.length]
                ),
                borderRadius: 4,
              },
            ],
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => fmtPct(ctx.raw as number),
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  callback: (v) => fmtPct(Number(v)),
                  maxTicksLimit: 8,
                },
              },
            },
          },
        })
      );
    }

    return () => {
      instances.forEach((c) => c.destroy());
    };
  }, [summary]);

  return (
    <section className="report-section">
      <h2>Report overview</h2>
      <div className="report-overview">
        <div>
          <strong>Organization:</strong>{' '}
          {summary.organizationCode ?? data.organization ?? '—'}
        </div>
        <div>
          <strong>Parser:</strong> {summary.parserUsed ?? '—'}
        </div>
        <div>
          <strong>File:</strong> {data.filename ?? '—'}
        </div>
        <div>
          <strong>Size:</strong>{' '}
          {data.size != null ? `${(data.size / 1024).toFixed(2)} KB` : '—'}
        </div>
        <div>
          <strong>Reporting period(s):</strong> {periodLine}
        </div>
        <div>
          <strong>Counts:</strong>{' '}
          {[
            `line items ${counts.lineItems ?? 0}`,
            `KPIs ${counts.kpis ?? 0}`,
            `issues ${counts.issues ?? 0}`,
          ].join(', ')}
        </div>
      </div>

      <div className="report-charts">
        {cats.length > 0 ? (
          <div className="chart-card">
            <h3>Amounts by category</h3>
            <div className="chart-wrap">
              <canvas ref={catRef} />
            </div>
          </div>
        ) : (
          <div className="chart-card empty-note">
            <p>
              No category totals — parser may not have labeled categories for
              this file.
            </p>
          </div>
        )}

        {tops.length > 0 ? (
          <div className="chart-card">
            <h3>Top line items (by magnitude)</h3>
            <div className="chart-wrap">
              <canvas ref={topRef} />
            </div>
          </div>
        ) : (
          <div className="chart-card empty-note">
            <p>No line-item amounts extracted.</p>
          </div>
        )}

        {kUsd.length > 0 ? (
          <div className="chart-card">
            <h3>USD KPIs</h3>
            <div className="chart-wrap">
              <canvas ref={usdRef} />
            </div>
          </div>
        ) : (
          <div className="chart-card empty-note">
            <p>No USD KPIs in this parse.</p>
          </div>
        )}

        {kPct.length > 0 ? (
          <div className="chart-card">
            <h3>Percent KPIs</h3>
            <div className="chart-wrap">
              <canvas ref={pctRef} />
            </div>
          </div>
        ) : (
          <div className="chart-card empty-note">
            <p>No percentage KPIs in this parse.</p>
          </div>
        )}
      </div>
    </section>
  );
}
