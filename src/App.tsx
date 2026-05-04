import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { uploadFinancialStatement } from './api/uploadFinancialStatement';
import { ReportCharts } from './components/ReportCharts';
import type { UploadResponse } from './types';

const ORGS = [
  { code: 'HSO', label: 'HSO / Express Mart' },
  { code: '303', label: '303 Software' },
  { code: 'NORTH', label: 'NORTH Dispensaries' },
  { code: 'LS', label: 'Lucky Services' },
  { code: 'MV', label: 'Minted Ventures' },
  { code: 'TV', label: "Tom's Vending" },
  { code: 'FSM', label: 'FSM (Full Send Management)' },
] as const;

export default function App() {
  const envApiBase = import.meta.env.VITE_API_URL?.trim() ?? '';
  const useDevProxy = import.meta.env.DEV;
  const canUpload = useDevProxy || !!envApiBase;

  const [organization, setOrganization] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const mutation = useMutation({
    mutationFn: async ({
      organization: org,
      file,
    }: {
      organization: string;
      file: File;
    }) => uploadFinancialStatement(org, file),
  });

  const assignFile = useCallback((file: File | null) => {
    setSelectedFile(file);
    mutation.reset();
  }, [mutation]);

  const handleUpload = () => {
    if (!canUpload || !organization || !selectedFile) return;
    mutation.mutate({ organization, file: selectedFile });
  };

  const formatKb = (bytes: number) => (bytes / 1024).toFixed(2);

  const data = mutation.data;
  const parse = data?.parse;
  const showReport =
    !!parse?.summary &&
    parse.ok === true &&
    parse.skipped !== true;

  const statusBlock = getStatusBlock(
    useDevProxy,
    envApiBase,
    mutation.isPending,
    mutation.error,
    data
  );

  return (
    <div className="container">
      <div className="header">
        <h1>🏢 FSM Finance Dashboard</h1>
        <p>Streamlined financial statement analysis for FSM portfolio entities</p>
      </div>

      <div className="upload-section">
        <div className="form-row">
          <label htmlFor="orgSelect">Organization</label>
          <select
            id="orgSelect"
            className="org-select"
            required
            value={organization}
            onChange={(e) => {
              setOrganization(e.target.value);
              mutation.reset();
            }}
          >
            <option value="">Select organization…</option>
            {ORGS.map(({ code, label }) => (
              <option key={code} value={code}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div
          className={`upload-area${dragOver ? ' dragover' : ''}${mutation.isPending ? ' busy' : ''}`}
          role="presentation"
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            const f = e.dataTransfer?.files?.[0];
            if (f) assignFile(f);
          }}
        >
          <div className="upload-icon">{selectedFile ? '✅' : '📊'}</div>
          <div className="upload-text">
            {selectedFile
              ? `Selected: ${selectedFile.name}`
              : 'Drag & drop or choose a financial statement'}
          </div>
          <div className="file-types">
            {selectedFile
              ? `${formatKb(selectedFile.size)} KB`
              : 'Excel (.xlsx, .xls) or PDF (text extract) — CSV is stored but not auto-parsed'}
          </div>
          <input
            id="fileInput"
            type="file"
            hidden
            accept=".xlsx,.xls,.csv,.pdf"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) assignFile(f);
            }}
          />
          <button
            type="button"
            className="upload-btn secondary"
            disabled={mutation.isPending}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            Choose file
          </button>
          <button
            type="button"
            className="upload-btn"
            disabled={
              mutation.isPending ||
              !canUpload ||
              !organization ||
              !selectedFile
            }
            onClick={handleUpload}
          >
            Upload &amp; analyze
          </button>
        </div>

        <p className="api-hint">
          {useDevProxy
            ? `Dev: uploads go to same-origin /api → Vite proxies to ${envApiBase || 'http://localhost:3000'} (set VITE_API_URL in .env to match backend PORT).`
            : envApiBase
              ? `API base (VITE_API_URL): ${envApiBase}`
              : 'Set VITE_API_URL at build time for production API calls.'}
        </p>

        <div className={`status${statusBlock.suffix}`}>
          <h3>{statusBlock.title}</h3>
          <p>{statusBlock.message}</p>
          {statusBlock.detail !== undefined && (
            <pre className="pre-result">
              {typeof statusBlock.detail === 'string'
                ? statusBlock.detail
                : JSON.stringify(statusBlock.detail, null, 2)}
            </pre>
          )}
        </div>

        {showReport && data && parse?.summary && (
          <ReportCharts
            key={`${data.filename ?? ''}-${data.organization ?? ''}`}
            data={data}
            summary={parse.summary}
          />
        )}

        <h3
          style={{
            textAlign: 'center',
            color: '#2c3e50',
            marginBottom: '20px',
          }}
        >
          📈 Supported Organizations
        </h3>
        <div className="orgs">
          {ORGS.filter((o) => o.code !== 'FSM').map(({ code, label }) => (
            <div key={code} className="org">
              {label}
            </div>
          ))}
        </div>
      </div>

      <div className="features">
        <div className="feature">
          <div className="feature-icon">⚡</div>
          <h3>Instant Upload</h3>
          <p>Send statements to the API for immediate processing</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🤖</div>
          <h3>Smart Parsing</h3>
          <p>Excel files are routed through org-aware parsers on the server</p>
        </div>
        <div className="feature">
          <div className="feature-icon">📊</div>
          <h3>Multi-Entity View</h3>
          <p className="coming-soon">
            Consolidated dashboard across portfolio companies (planned)
          </p>
        </div>
        <div className="feature">
          <div className="feature-icon">🔒</div>
          <h3>Secure Storage</h3>
          <p>Files are stored server-side; tighten auth/CORS for production</p>
        </div>
      </div>
    </div>
  );
}

function getStatusBlock(
  isDev: boolean,
  apiBase: string,
  isPending: boolean,
  error: Error | null,
  data: UploadResponse | undefined
): {
  suffix: string;
  title: string;
  message: string;
  detail?: unknown;
} {
  if (!isDev && !apiBase.trim()) {
    return {
      suffix: ' warn',
      title: 'API URL missing',
      message:
        'VITE_API_URL was not set at build time. Rebuild with VITE_API_URL pointing at your API.',
    };
  }

  if (isPending) {
    const target = isDev
      ? `/api/upload (proxied to ${apiBase.trim() || 'http://localhost:3000'})`
      : `${apiBase.trim()}/api/upload`;
    return {
      suffix: '',
      title: 'Uploading…',
      message: `Sending to ${target}`,
    };
  }

  if (error) {
    return {
      suffix: ' error',
      title: 'Network error',
      message: error.message,
    };
  }

  if (!data) {
    return {
      suffix: '',
      title: 'Connected upload',
      message:
        'Choose an organization and file, then upload to the finance API for storage and parsing.',
    };
  }

  const summaryLine = data.message ?? 'Upload complete.';

  if (data.parse?.ok === false) {
    return {
      suffix: ' warn',
      title: 'Uploaded — parse error',
      message: summaryLine,
      detail: data,
    };
  }

  if (data.parse?.skipped) {
    return {
      suffix: ' warn',
      title: 'Uploaded — parsing skipped',
      message: `${summaryLine} ${data.parse.reason ?? ''}`.trim(),
      detail: data,
    };
  }

  return {
    suffix: '',
    title: 'Success',
    message: summaryLine,
    detail: data,
  };
}
