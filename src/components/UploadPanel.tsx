import React, { useCallback } from 'react';
import type { PerformanceReport } from '../types';
import { coerceReport } from '../utils/compare';

interface Props {
  label: string;
  onLoaded: (report: PerformanceReport | null) => void;
}

export default function UploadPanel({ label, onLoaded }: Props) {
  const onFile = useCallback(async (file: File) => {
    const text = await file.text();
    const report = coerceReport(text, file.name.replace(/\.[^.]+$/, ''));
    onLoaded(report);
  }, [onLoaded]);

  return (
    <div className="card bg-base-200 shadow-md">
      <div className="card-body gap-3">
        <h3 className="card-title">{label}</h3>
        <input
          type="file"
          accept="application/json,.json"
          className="file-input file-input-bordered w-full"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
          }}
        />
        <p className="text-sm opacity-70">Upload a JSON report. Expected shape: {`{ name, metrics: { key: number } }`}</p>
      </div>
    </div>
  );
}
