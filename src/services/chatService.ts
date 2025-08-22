// Simple chat service integrating with backend AI (if available) with graceful fallback
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

class ChatService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_AI_API_BASE_URL || 'http://localhost:3001/api';
    this.apiKey = import.meta.env.VITE_API_SECRET_KEY || 'dev-secure-api-key-for-performance-insights-2025';
  }

  async send(messages: ChatMessage[]): Promise<string> {
    // Try backend chat endpoint first
    try {
      const res = await fetch(`${this.baseUrl}/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({ messages })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.reply) return data.reply;
        if (Array.isArray(data.messages)) {
          const last = data.messages.reverse().find((m:any)=>m.role==='assistant');
          if (last) return last.content || '...';
        }
      } else {
        const txt = await res.text();
        console.warn('Chat endpoint error:', res.status, txt);
      }
    } catch (e) {
      console.warn('Chat endpoint unreachable, using fallback.', e);
    }

    // Fallback heuristic local response
    const lastUser = [...messages].reverse().find(m => m.role === 'user')?.content || '';
    if (/help|what can you do/i.test(lastUser)) {
      return 'I can explain performance diffs, suggest optimizations for latency, throughput, errors, CPU & memory. Ask about any metric you see.';
    }
    if (/latency|slow/i.test(lastUser)) {
      return 'Latency improvements usually come from reducing render blocking, optimizing DB queries, and caching hot paths. Identify the highest positive latency regressions in the Metric Differences table.';
    }
    if (/error/i.test(lastUser)) {
      return 'Error rate changes: drill into recent deployments, inspect logs for spike windows, verify upstream dependency health. Lower error rate is better.';
    }
    return 'Got it. Run an analysis then ask me about specific metrics (e.g. "Why is CPU higher?" or "How to improve LCP?").';
  }
}

export const chatService = new ChatService();
