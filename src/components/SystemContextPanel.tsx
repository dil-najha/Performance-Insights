import React, { useState } from 'react';
import type { SystemContext } from '../types';
import { AI_CONFIG, getPreferredProvider } from '../config/ai';

interface Props {
  context: SystemContext;
  onContextChange: (context: SystemContext) => void;
  aiEnabled: boolean;
  onAIToggle: () => void;
}

export default function SystemContextPanel({ context, onContextChange, aiEnabled, onAIToggle }: Props) {
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const updateContext = (key: keyof SystemContext, value: string) => {
    onContextChange({
      ...context,
      [key]: value
    });
  };

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="card-title text-sm">⚙️ System Configuration & Analysis Context</h3>
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
                <label className="label label-text text-xs">Application Runtime</label>
                <select 
                  className="select select-bordered select-xs"
                  value={context.stack || ''}
                  onChange={(e) => updateContext('stack', e.target.value)}
                >
                  <option value="">Select Runtime...</option>
                  <option value="JavaScript/Node.js">JavaScript/Node.js (Event-driven, V8 engine)</option>
                  <option value="JVM Platform">JVM Platform (Java, Scala, Kotlin)</option>
                  <option value="Compiled Native">Compiled Native (Go, Rust, C#/.NET)</option>
                  <option value="Dynamic Interpreted">Dynamic Interpreted (Python, Ruby, PHP)</option>
                  <option value="Web Frontend">Web Frontend (React, Vue, Angular)</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label label-text text-xs">Deployment Environment</label>
                <select 
                  className="select select-bordered select-xs"
                  value={context.environment || ''}
                  onChange={(e) => updateContext('environment', e.target.value)}
                >
                  <option value="">Select Environment...</option>
                  <option value="development">Development Environment</option>
                  <option value="staging">Staging Environment</option>
                  <option value="production">Production Environment</option>
                  <option value="qa">Quality Assurance Environment</option>
                  <option value="uat">User Acceptance Testing</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label label-text text-xs">System Load Profile</label>
                <select 
                  className="select select-bordered select-xs"
                  value={context.scale || ''}
                  onChange={(e) => updateContext('scale', e.target.value)}
                >
                  <option value="">Select Load Profile...</option>
                  <option value="low">Low Volume (&lt; 100 RPS)</option>
                  <option value="medium">Medium Volume (100-1K RPS)</option>
                  <option value="high">High Volume (1K-10K RPS)</option>
                  <option value="enterprise">Enterprise Scale (&gt; 10K RPS)</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label label-text text-xs">
                  AI Model
                  <span className="ml-1 text-xs opacity-60">(AWS Bedrock)</span>
                </label>
                <select 
                  className="select select-bordered select-xs"
                  value={context.selectedModel || AI_CONFIG.bedrock.primaryModel}
                  onChange={(e) => updateContext('selectedModel', e.target.value)}
                >
                  {AI_CONFIG.bedrock.models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} - {model.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* ✅ NEW ADVANCED CONTEXT FIELDS */}
            <div className="flex justify-end items-center mt-4 mb-2">
              <div className="form-control">
                <label className="label cursor-pointer gap-2">
                  <span className="label-text text-xs opacity-60">Advanced Analysis Parameters (Optional)</span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary toggle-xs" 
                    checked={advancedExpanded}
                    onChange={() => setAdvancedExpanded(!advancedExpanded)}
                  />
                </label>
              </div>
            </div>
            
            {advancedExpanded && (
              <div className="animate-in slide-in-from-top duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label label-text text-xs">Business Impact Classification</label>
                    <select 
                      className="select select-bordered select-xs"
                      value={context.business_criticality || ''}
                      onChange={(e) => updateContext('business_criticality', e.target.value)}
                    >
                      <option value="">Select Impact Level...</option>
                      <option value="low">Low Impact - Non-Critical Systems</option>
                      <option value="medium">Medium Impact - Business Operations</option>
                      <option value="high">High Impact - Revenue Affecting</option>
                      <option value="critical">Mission Critical - Core Business</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label label-text text-xs">Technical Domain Focus</label>
                    <select 
                      className="select select-bordered select-xs"
                      value={context.team || ''}
                      onChange={(e) => updateContext('team', e.target.value)}
                    >
                      <option value="">Select Domain...</option>
                      <option value="frontend">Frontend Engineering</option>
                      <option value="backend">Backend Engineering</option>
                      <option value="infrastructure">Infrastructure & DevOps</option>
                      <option value="database">Database Performance</option>
                      <option value="security">Security & Compliance</option>
                      <option value="fullstack">Full Stack Development</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label label-text text-xs">Priority Classification</label>
                    <select 
                      className="select select-bordered select-xs"
                      value={context.urgency || ''}
                      onChange={(e) => updateContext('urgency', e.target.value)}
                    >
                      <option value="">Select Priority...</option>
                      <option value="p4">P4 - Routine Analysis</option>
                      <option value="p3">P3 - Performance Monitoring</option>
                      <option value="p2">P2 - Issue Investigation</option>
                      <option value="p1">P1 - Critical Resolution Required</option>
                      <option value="p0">P0 - Emergency Response</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label label-text text-xs">Recent System Changes</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Deployment v2.1.3, database migration..."
                      className="input input-bordered input-xs" 
                      value={context.recent_changes || ''}
                      onChange={(e) => updateContext('recent_changes', e.target.value)}
                    />
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label label-text text-xs">Performance Optimization Targets</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Reduce p95 latency to <200ms, increase throughput by 25%..."
                      className="input input-bordered input-xs" 
                      value={context.performance_goals || ''}
                      onChange={(e) => updateContext('performance_goals', e.target.value)}
                    />
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label label-text text-xs">Known Performance Issues</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Database query optimization needed, memory leak in service X..."
                      className="input input-bordered input-xs" 
                      value={context.known_issues || ''}
                      onChange={(e) => updateContext('known_issues', e.target.value)}
                    />
                  </div>

                  <div className="form-control md:col-span-2">
                    <label className="label label-text text-xs">Specialized Analysis Requirements</label>
                    <textarea 
                      className="textarea textarea-bordered textarea-xs h-16" 
                      placeholder="Specific technical areas, compliance requirements, or business constraints to consider..."
                      value={context.custom_focus || ''}
                      onChange={(e) => updateContext('custom_focus', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="text-xs opacity-60 mt-2 space-y-1">
              <p>💡 Comprehensive system configuration enables precise AI-driven performance analysis</p>
              <p>🏆 Enterprise-grade analysis powered by AWS Bedrock Claude 3.5 models</p>
              {context.selectedModel && (
                <p>
                  <span className="font-semibold">Active Model:</span> {
                    AI_CONFIG.bedrock.models.find((model: any) => model.id === context.selectedModel)?.name || context.selectedModel
                  }
                </p>
              )}
            </div>
          </div>
        )}

        {/* Message when AI is disabled */}
        {!aiEnabled && (
          <div className="text-sm opacity-60 mt-2 text-center">
            🏆 Enable AI Analysis to leverage AWS Bedrock for intelligent performance diagnostics
          </div>
        )}
      </div>
    </div>
  );
}
