# Performance Dashboard

Upload a benchmark (baseline) JSON report and a normal (current) JSON report to see differences, charts, and improvement tips.

## JSON format

- Preferred shape:
```json
{
  "name": "Benchmark",
  "timestamp": "2025-08-01T10:00:00Z",
  "metrics": {
    "responseTimeAvg": 120,
    "throughput": 500,
    "errorRate": 0.5
  }
}
```
- Flat objects with numeric values also work.

## Run locally

1. Install dependencies
2. Start dev server
3. Open http://localhost:5173 and click "Load Sample" or upload your files.

