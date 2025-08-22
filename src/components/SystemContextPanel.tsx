import React from 'react';
import type { SystemContext } from '../types';

interface Props {
  context: SystemContext;
  onContextChange: (context: SystemContext) => void;
  aiEnabled: boolean;
  onAIToggle: () => void;
}

export default function SystemContextPanel({ context, onContextChange, aiEnabled, onAIToggle }: Props) {
  const updateContext = (key: keyof SystemContext, value: string) => {
    onContextChange({
      ...context,
      [key]: value
    });
  };

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-4">
        <div className="flex justify-end items-center mb-3">
          {/* Removed heading per user request */}
          <div className="form-control">
            <label className="label cursor-pointer gap-2">
              <span className="label-text text-sm">AI Analysis</span>
              <input 
                type="checkbox" 
                className="toggle toggle-primary toggle-sm" 
                checked={aiEnabled}
                onChange={onAIToggle}
              />
            </label>
          </div>
        </div>
        
        {/* Collapsible System Context Fields */}
        {aiEnabled && (
          <div className="animate-in slide-in-from-top duration-300">
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

              {/* Model selection removed */}
            </div>

            {/* ✅ NEW ADVANCED CONTEXT FIELDS */}
            <div className="divider text-xs opacity-60 mt-4 mb-2">Advanced Context (Optional)</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="form-control">
                <label className="label label-text text-xs">Business Criticality</label>
                <select 
                  className="select select-bordered select-xs"
                  value={context.business_criticality || ''}
                  onChange={(e) => updateContext('business_criticality', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="low">Low Impact</option>
                  <option value="medium">Medium Impact</option>
                  <option value="high">High Impact</option>
                  <option value="critical">Mission Critical</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label label-text text-xs">Team Focus</label>
                <select 
                  className="select select-bordered select-xs"
                  value={context.team || ''}
                  onChange={(e) => updateContext('team', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="frontend">Frontend Team</option>
                  <option value="backend">Backend Team</option>
                  <option value="devops">DevOps Team</option>
                  <option value="fullstack">Full Stack Team</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label label-text text-xs">Urgency Level</label>
                <select 
                  className="select select-bordered select-xs"
                  value={context.urgency || ''}
                  onChange={(e) => updateContext('urgency', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="low">Low - Routine Analysis</option>
                  <option value="medium">Medium - Performance Review</option>
                  <option value="high">High - Issue Investigation</option>
                  <option value="emergency">Emergency - Critical Issue</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label label-text text-xs">Recent Changes</label>
                <input 
                  type="text" 
                  placeholder="e.g., New deployment, config change..."
                  className="input input-bordered input-xs" 
                  value={context.recent_changes || ''}
                  onChange={(e) => updateContext('recent_changes', e.target.value)}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label label-text text-xs">Performance Goals</label>
                <input 
                  type="text" 
                  placeholder="e.g., Reduce latency by 20%, improve throughput..."
                  className="input input-bordered input-xs" 
                  value={context.performance_goals || ''}
                  onChange={(e) => updateContext('performance_goals', e.target.value)}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label label-text text-xs">Known Issues</label>
                <input 
                  type="text" 
                  placeholder="e.g., Database slow queries, memory leaks..."
                  className="input input-bordered input-xs" 
                  value={context.known_issues || ''}
                  onChange={(e) => updateContext('known_issues', e.target.value)}
                />
              </div>

              <div className="form-control md:col-span-2">
                <label className="label label-text text-xs">Custom Analysis Focus</label>
                <textarea 
                  className="textarea textarea-bordered textarea-xs h-16" 
                  placeholder="Specific areas to focus on or additional context..."
                  value={context.custom_focus || ''}
                  onChange={(e) => updateContext('custom_focus', e.target.value)}
                />
              </div>
            </div>

            <div className="text-xs opacity-60 mt-2 space-y-1">
              <p>💡 Providing context helps AI generate more relevant and actionable suggestions</p>
              <p>🆓 Free models are available without additional cost • 💳 Paid models offer enhanced capabilities</p>
              {/* Removed selected model display */}
            </div>
          </div>
        )}

        {/* Message when AI is disabled */}
        {!aiEnabled && (
          <div className="text-sm opacity-60 mt-2 text-center">
            📊 Enable AI Analysis to configure system context for enhanced insights
          </div>
        )}
      </div>
    </div>
  );
}
