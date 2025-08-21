import React, { useState, useEffect } from 'react';
import { aiService } from '../services/secureAIService';

interface HistoricalReport {
  id: string;
  timestamp: string;
  baseline: any;
  current: any;
  summary: {
    improved: number;
    worse: number;
    same: number;
    unknown: number;
  };
}

interface Props {
  onSelectReport?: (baseline: any, current: any) => void;
}

export default function HistoricalReports({ onSelectReport }: Props) {
  const [reports, setReports] = useState<HistoricalReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const reportsPerPage = 10;

  useEffect(() => {
    loadHistoricalReports();
  }, [currentPage]);

  const loadHistoricalReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await aiService.getHistoricalReports(reportsPerPage, currentPage * reportsPerPage);
      setReports(result.reports);
      setTotalReports(result.total);
    } catch (err) {
      setError('Failed to load historical reports');
      console.error('Error loading historical reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (report: HistoricalReport) => {
    setSelectedReportId(report.id);
    if (onSelectReport) {
      onSelectReport(report.baseline, report.current);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTrendBadge = (summary: HistoricalReport['summary']) => {
    if (summary.worse > summary.improved) {
      return <span className="badge badge-error badge-sm">Degraded</span>;
    } else if (summary.improved > summary.worse) {
      return <span className="badge badge-success badge-sm">Improved</span>;
    } else {
      return <span className="badge badge-neutral badge-sm">Stable</span>;
    }
  };

  const totalPages = Math.ceil(totalReports / reportsPerPage);

  if (loading && reports.length === 0) {
    return (
      <div className="card bg-base-200 shadow">
        <div className="card-body">
          <h3 className="card-title">📊 Historical Reports</h3>
          <div className="flex justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow">
      <div className="card-body">
        <div className="flex justify-between items-center">
          <h3 className="card-title">📊 Historical Reports</h3>
          <button 
            className="btn btn-sm btn-outline" 
            onClick={loadHistoricalReports}
            disabled={loading}
          >
            {loading ? <span className="loading loading-spinner loading-sm"></span> : '🔄'}
            Refresh
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        )}

        {reports.length === 0 && !loading ? (
          <div className="text-center py-8 opacity-60">
            <p>No historical reports found</p>
            <p className="text-sm">Run some analyses to build up your history</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Baseline</th>
                    <th>Current</th>
                    <th>Summary</th>
                    <th>Trend</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr 
                      key={report.id}
                      className={selectedReportId === report.id ? 'bg-primary/10' : ''}
                    >
                      <td className="text-xs">
                        {formatDate(report.timestamp)}
                      </td>
                      <td className="text-xs">
                        {report.baseline?.name || 'Baseline'}
                      </td>
                      <td className="text-xs">
                        {report.current?.name || 'Current'}
                      </td>
                      <td className="text-xs">
                        <div className="flex gap-1">
                          {report.summary.improved > 0 && (
                            <span className="badge badge-success badge-xs">
                              +{report.summary.improved}
                            </span>
                          )}
                          {report.summary.worse > 0 && (
                            <span className="badge badge-error badge-xs">
                              -{report.summary.worse}
                            </span>
                          )}
                          {report.summary.same > 0 && (
                            <span className="badge badge-neutral badge-xs">
                              ={report.summary.same}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        {getTrendBadge(report.summary)}
                      </td>
                      <td>
                        <button
                          className="btn btn-xs btn-primary"
                          onClick={() => handleSelectReport(report)}
                        >
                          Load
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <div className="join">
                  <button 
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                  >
                    «
                  </button>
                  <button 
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    ‹
                  </button>
                  <span className="join-item btn btn-sm btn-disabled">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button 
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                    disabled={currentPage === totalPages - 1}
                  >
                    ›
                  </button>
                  <button 
                    className="join-item btn btn-sm"
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage === totalPages - 1}
                  >
                    »
                  </button>
                </div>
              </div>
            )}

            <div className="text-xs opacity-60 mt-2 text-center">
              Showing {currentPage * reportsPerPage + 1}-{Math.min((currentPage + 1) * reportsPerPage, totalReports)} of {totalReports} reports
            </div>
          </>
        )}
      </div>
    </div>
  );
}
