import React, { useState } from 'react';
import { aiService } from '../services/secureAIService';

interface Props {
  data: any;
  disabled?: boolean;
}

export default function ExportPanel({ data, disabled }: Props) {
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  const handleExport = async () => {
    if (!data) return;

    setExporting(true);
    try {
      const blob = await aiService.exportReport(data, exportFormat);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `performance-report-${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const generateLocalCSV = () => {
    if (!data?.diffs) return;

    const headers = ['Metric', 'Baseline', 'Current', 'Change', 'Percentage Change', 'Trend'];
    const rows = data.diffs.map((diff: any) => [
      diff.label,
      diff.baseline || 'N/A',
      diff.current || 'N/A',
      diff.change || 'N/A',
      diff.pct ? `${diff.pct.toFixed(2)}%` : 'N/A',
      diff.trend
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generateLocalJSON = () => {
    if (!data) return;

    const exportData = {
      ...data,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!data) return;

    try {
      const textData = data.diffs?.map((diff: any) => 
        `${diff.label}: ${diff.baseline} → ${diff.current} (${diff.pct?.toFixed(1)}% ${diff.trend})`
      ).join('\n') || '';

      await navigator.clipboard.writeText(textData);
      
      // Show temporary success message
      const button = document.getElementById('copy-btn');
      const originalText = button?.textContent || '';
      if (button) {
        button.textContent = '✓ Copied!';
        setTimeout(() => {
          button.textContent = originalText || '📋 Copy to Clipboard';
        }, 2000);
      }
    } catch (error) {
      console.error('Copy failed:', error);
      alert('Copy to clipboard failed');
    }
  };

  return (
    <div className="card bg-base-200 shadow">
      <div className="card-body">
        <h3 className="card-title">📤 Export Report</h3>
        
        <div className="form-control">
          <label className="label">
            <span className="label-text">Export Format</span>
          </label>
          <div className="flex gap-2">
            <label className="label cursor-pointer">
              <input
                type="radio"
                name="format"
                className="radio radio-primary"
                checked={exportFormat === 'csv'}
                onChange={() => setExportFormat('csv')}
              />
              <span className="label-text ml-2">CSV</span>
            </label>
            <label className="label cursor-pointer">
              <input
                type="radio"
                name="format"
                className="radio radio-primary"
                checked={exportFormat === 'json'}
                onChange={() => setExportFormat('json')}
              />
              <span className="label-text ml-2">JSON</span>
            </label>
          </div>
        </div>

        <div className="card-actions justify-start">
          <div className="dropdown">
            <div 
              tabIndex={0} 
              role="button" 
              className={`btn btn-primary ${disabled || !data ? 'btn-disabled' : ''}`}
            >
              📥 Download
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <button 
                  onClick={handleExport}
                  disabled={exporting || disabled || !data}
                  className="text-left"
                >
                  {exporting ? (
                    <span className="loading loading-spinner loading-sm"></span>
                  ) : (
                    '🌐'
                  )}
                  Server Export ({exportFormat.toUpperCase()})
                </button>
              </li>
              <li>
                <button 
                  onClick={exportFormat === 'csv' ? generateLocalCSV : generateLocalJSON}
                  disabled={disabled || !data}
                  className="text-left"
                >
                  💻 Local Export ({exportFormat.toUpperCase()})
                </button>
              </li>
            </ul>
          </div>

          <button
            id="copy-btn"
            className="btn btn-outline btn-sm"
            onClick={copyToClipboard}
            disabled={disabled || !data}
          >
            📋 Copy to Clipboard
          </button>
        </div>

        <div className="text-xs opacity-60 mt-2">
          <p>• Server export includes AI insights and predictions</p>
          <p>• Local export works offline with current data only</p>
          <p>• Copy creates a summary text for sharing</p>
        </div>
      </div>
    </div>
  );
}
