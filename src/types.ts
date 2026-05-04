export interface ParseSummary {
  parserUsed?: string;
  organizationCode?: string;
  counts?: {
    lineItems?: number;
    kpis?: number;
    reportingPeriods?: number;
    clientData?: number;
    arAging?: number;
    issues?: number;
  };
  categoryTotals?: { category: string; total: number }[];
  topLineItems?: { line_item: string; category: string; amount: number }[];
  reportingPeriodsPreview?: {
    period_label?: string | null;
    period_start?: string | null;
    period_end?: string | null;
  }[];
  kpiUsdPreview?: { kpi_name: string; kpi_value: number; kpi_unit: string }[];
  kpiPctPreview?: { kpi_name: string; kpi_value: number; kpi_unit: string }[];
}

export interface UploadResponse {
  success?: boolean;
  message?: string;
  filename?: string;
  size?: number;
  organization?: string;
  error?: string;
  parse?: {
    ok?: boolean;
    skipped?: boolean;
    reason?: string;
    error?: string;
    summary?: ParseSummary;
  };
}
