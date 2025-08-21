import React from 'react';
import type { SystemContext } from '../types';

interface Props {
  context: SystemContext;
  onContextChange: (context: SystemContext) => void;
}

export default function SystemContextPanel({ context, onContextChange }: Props) {
  const updateContext = (key: keyof SystemContext, value: string) => {
    onContextChange({
      ...context,
      [key]: value
    });
  };

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-4">
        <h3 className="card-title text-sm">⚙️ System Context (Improves AI Suggestions)</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          <div className="form-control">
            <label className="label label-text text-xs">Tech Stack</label>
            <select 
              className="select select-bordered select-xs"
              value={context.stack || ''}
              onChange={(e) => updateContext('stack', e.target.value)}
            >
              <option value="">Select...</option>
              <option value="Node.js">Node.js</option>
              <option value="Python">Python</option>
              <option value="Java">Java</option>
              <option value="Go">Go</option>
              <option value="PHP">PHP</option>
              <option value="Ruby">Ruby</option>
              <option value="C#">.NET/C#</option>
              <option value="Rust">Rust</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label label-text text-xs">Environment</label>
            <select 
              className="select select-bordered select-xs"
              value={context.environment || ''}
              onChange={(e) => updateContext('environment', e.target.value)}
            >
              <option value="">Select...</option>
              <option value="dev">Development</option>
              <option value="staging">Staging</option>
              <option value="prod">Production</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label label-text text-xs">Scale</label>
            <select 
              className="select select-bordered select-xs"
              value={context.scale || ''}
              onChange={(e) => updateContext('scale', e.target.value)}
            >
              <option value="">Select...</option>
              <option value="small">Small (&lt; 100 RPS)</option>
              <option value="medium">Medium (100-1K RPS)</option>
              <option value="large">Large (&gt; 1K RPS)</option>
            </select>
          </div>

          <div className="form-control">
            <label className="label label-text text-xs">Version</label>
            <input 
              type="text" 
              placeholder="v1.2.3"
              className="input input-bordered input-xs"
              value={context.version || ''}
              onChange={(e) => updateContext('version', e.target.value)}
            />
          </div>
        </div>

        <div className="text-xs opacity-60 mt-2">
          💡 Providing context helps AI generate more relevant and actionable suggestions
        </div>
      </div>
    </div>
  );
}
