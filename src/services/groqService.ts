// Groq LLM integration (Llama 3 / Mixtral) using Groq's OpenAI-compatible API
// Requires: create a free key at https://console.groq.com/ and add to .env.local as VITE_GROQ_API_KEY=...

import type { PerformanceReport, EnhancedComparisonResult, AIInsight } from '../types';
import { compareReports } from '../utils/compare';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = import.meta.env.VITE_GROQ_MODEL || 'llama3-70b-8192';
const KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export async function groqAnalyze(baseline: PerformanceReport, current: PerformanceReport): Promise<EnhancedComparisonResult | null> {
  if (!KEY) return null; // no key present

  const base = compareReports(baseline, current) as EnhancedComparisonResult;
  const diffsSummary = base.diffs.slice(0, 25).map(d => `${d.label}: ${d.baseline} -> ${d.current} (${d.pct?.toFixed(1)}% ${d.trend})`).join('\n');

  const systemPrompt = `You are an expert performance engineer. Provide concise insights. Sections: SUMMARY, KEY WINS, REGRESSIONS, ACTIONS.`;
  const userPrompt = `Compare baseline vs current metrics (top diffs below) and produce a brief structured analysis.\n\n${diffsSummary}`;

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.4,
        max_tokens: 700,
        stream: false
      })
    });
    if (!res.ok) {
      console.warn('Groq API error', res.status, await res.text());
      return null;
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';

    // Basic parsing into insights (simple heuristic split)
    const insights: AIInsight[] = [];
    if (content) {
      insights.push({
        type: 'explanation',
        severity: 'low',
        confidence: 0.75,
        title: 'Groq LLM Summary',
        description: content.substring(0, 4000),
        actionable_steps: [],
        affected_metrics: []
      });
    }
    base.aiInsights = insights;
    base.explanation = 'Generated via Groq LLM (' + MODEL + ')';
    return base;
  } catch (e) {
    console.warn('Groq analyze failed', e);
    return null;
  }
}
