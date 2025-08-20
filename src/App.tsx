import React, { useMemo, useState } from 'react';
import UploadPanel from './components/UploadPanel';
import DiffTable from './components/DiffTable';
import MetricDiffChart from './components/MetricDiffChart';
import Suggestions from './components/Suggestions';
import type { PerformanceReport } from './types';
import { compareReports, suggestionsFromDiffs } from './utils/compare';

export default function App() {
  const [baseline, setBaseline] = useState<PerformanceReport | null>(null);
  const [current, setCurrent] = useState<PerformanceReport | null>(null);
  const [loadingSample, setLoadingSample] = useState(false);

  const result = useMemo(() => {
    if (!baseline || !current) return null;
    return compareReports(baseline, current);
  }, [baseline, current]);

  const tips = useMemo(() => result ? suggestionsFromDiffs(result.diffs) : [], [result]);

  const loadSample = async () => {
    setLoadingSample(true);
    try {
      const [b, c] = await Promise.all([
        fetch('/sample/benchmark.json').then(r => r.json()),
        fetch('/sample/current.json').then(r => r.json()),
      ]);
      setBaseline(b);
      setCurrent(c);
    } finally {
      setLoadingSample(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="navbar bg-base-200 shadow">
        <div className="container mx-auto px-4">
          <div className="flex-1">
            <span className="text-xl font-bold">Performance Dashboard</span>
          </div>
          <div className="flex-none">
            <button className={`btn btn-primary ${loadingSample ? 'loading' : ''}`} onClick={loadSample} disabled={loadingSample}>
              Load Sample
            </button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UploadPanel label="Benchmark (Baseline)" onLoaded={setBaseline} />
          <UploadPanel label="Normal (Current)" onLoaded={setCurrent} />
        </div>

        {baseline && current && result && (
          <>
            <div className="stats shadow bg-base-200">
              <div className="stat">
                <div className="stat-title">Improved</div>
                <div className="stat-value text-success">{result.summary.improved}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Worse</div>
                <div className="stat-value text-error">{result.summary.worse}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Same</div>
                <div className="stat-value">{result.summary.same}</div>
              </div>
            </div>

            <MetricDiffChart diffs={result.diffs} />
            <DiffTable diffs={result.diffs} />
            <Suggestions tips={tips} />
          </>
        )}

        {(!baseline || !current) && (
          <div className="alert">
            <span>Upload both reports or click "Load Sample" to try it out.</span>
          </div>
        )}
      </main>
    </div>
  );
}
