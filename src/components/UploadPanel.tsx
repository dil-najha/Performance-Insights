import React, { useState } from 'react';
import type { PerformanceReport } from '../types';
import { useDataValidation, DataValidator } from '../utils/dataValidation';

interface Props {
  label: string;
  onLoaded: (report: PerformanceReport) => void;
}

export default function UploadPanel({ label, onLoaded }: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const { validateFile } = useDataValidation();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.name.endsWith('.json')) {
      setValidationResults({
        valid: false,
        errors: ['Please upload a .json file'],
        warnings: []
      });
      return;
    }

    setIsValidating(true);
    setValidationResults(null);

    try {
      // 🎯 Realistic processing delay (5-7 seconds for better UX feel)
      const processingDelay = Math.floor(Math.random() * 2000) + 5000; // 5-7 seconds
      
      // Run validation and delay in parallel
      const [validation] = await Promise.all([
        validateFile(file),
        new Promise(resolve => setTimeout(resolve, processingDelay))
      ]);

      setValidationResults(validation);

      if (validation.valid && validation.sanitized) {
        onLoaded(validation.sanitized);
      }
    } catch (error) {
      setValidationResults({
        valid: false,
        errors: ['Failed to process file'],
        warnings: []
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const clearValidation = () => {
    setValidationResults(null);
  };

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h3 className="card-title text-sm">{label}</h3>
        
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-primary bg-primary/10' 
              : validationResults?.valid === false
              ? 'border-error bg-error/10'
              : validationResults?.valid === true
              ? 'border-success bg-success/10'
              : 'border-base-300 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isValidating ? (
            <div className="space-y-3">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <div className="text-sm font-medium">Processing performance data...</div>
              <div className="text-xs opacity-75">
                Analyzing metrics, validating format, extracting insights...
              </div>
              <div className="w-full bg-base-300 rounded-full h-1.5">
                <div className="bg-primary h-1.5 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-4xl mb-2">
                {validationResults?.valid === false ? '❌' : 
                 validationResults?.valid === true ? '✅' : '📁'}
              </div>
              <div className="text-sm font-medium mb-2">
                {validationResults?.valid === false ? 'Validation Failed' :
                 validationResults?.valid === true ? 'File Validated Successfully' :
                 'Drop JSON file here or click to browse'}
              </div>
              <input
                type="file"
                accept=".json"
                onChange={handleChange}
                className="file-input file-input-bordered file-input-primary file-input-sm w-full max-w-xs"
              />
            </>
          )}
        </div>

        {/* Validation Results */}
        {validationResults && (
          <div className="space-y-2 mt-4">
            {/* Errors */}
            {validationResults.errors && validationResults.errors.length > 0 && (
              <div className="alert alert-error alert-sm">
                <div className="text-xs">
                  <div className="font-semibold">Errors:</div>
                  <ul className="list-disc list-inside">
                    {validationResults.errors.map((error: string, i: number) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Warnings */}
            {validationResults.warnings && validationResults.warnings.length > 0 && (
              <div className="alert alert-warning alert-sm">
                <div className="text-xs">
                  <div className="font-semibold">Warnings:</div>
                  <ul className="list-disc list-inside">
                    {validationResults.warnings.map((warning: string, i: number) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Success Info */}
            {validationResults.valid && validationResults.sanitized && (
              <div className="alert alert-success alert-sm">
                <div className="text-xs">
                  <div className="font-semibold">✅ Successfully loaded:</div>
                  <div>Name: {validationResults.sanitized.name}</div>
                  <div>Metrics: {Object.keys(validationResults.sanitized.metrics).length}</div>
                  {validationResults.sanitized.timestamp && (
                    <div>Timestamp: {new Date(validationResults.sanitized.timestamp).toLocaleString()}</div>
                  )}
                </div>
              </div>
            )}

            <button 
              className="btn btn-ghost btn-xs"
              onClick={clearValidation}
            >
              Clear validation
            </button>
          </div>
        )}

        {/* Sample Format Help */}
        <div className="collapse collapse-arrow bg-base-200 mt-4">
          <input type="checkbox" /> 
          <div className="collapse-title text-xs font-medium">
            📖 Expected JSON Format
          </div>
          <div className="collapse-content text-xs"> 
            <pre className="bg-base-300 p-2 rounded text-xs overflow-x-auto">
{`{
  "name": "Load Test Results",
  "timestamp": "2025-08-21T10:00:00Z",
  "metrics": {
    "responseTimeAvg": 150,
    "responseTimeP95": 240,
    "throughput": 460,
    "errorRate": 1.2,
    "cpu": 75,
    "memory": 950
  }
}

// Also supports flat format:
{
  "responseTimeAvg": 150,
  "throughput": 460,
  "errorRate": 1.2
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
