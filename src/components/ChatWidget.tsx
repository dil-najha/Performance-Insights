import React, { useState, useRef, useEffect } from 'react';
import { chatService, type ChatMessage } from '../services/chatService';

interface ChatWidgetProps {
  enabled?: boolean;
}

const INITIAL_SYSTEM: ChatMessage = { role: 'system', content: 'You are a helpful performance analysis assistant. Keep answers concise.' };

export const ChatWidget: React.FC<ChatWidgetProps> = ({ enabled = true }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_SYSTEM]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [messages, open]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: 'user', content: input.trim() };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await chatService.send([...messages, userMsg]);
      setMessages(m => [...m, { role: 'assistant', content: reply }]);
    } catch (e:any) {
      setMessages(m => [...m, { role: 'assistant', content: 'Chat failed. Try again.' }]);
    } finally { setLoading(false); }
  };

  if (!enabled) return null;

  return (
    <div className="fixed z-40 bottom-4 right-4 flex flex-col items-end gap-2">
      {open && (
        <div className="w-80 max-h-[70vh] flex flex-col bg-base-100 shadow-xl rounded-xl border border-primary/30 overflow-hidden animate-pop">
          <div className="flex items-center justify-between px-3 py-2 bg-base-200/70 backdrop-blur text-sm font-semibold">
            <span>AI Chat Assistant</span>
            <button className="btn btn-ghost btn-xs" onClick={()=>setOpen(false)}>✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3 text-sm">
            {messages.filter(m=>m.role!=='system').map((m,i)=>(
              <div key={i} className={`chat ${m.role==='user'?'chat-end':'chat-start'}`}>
                <div className={`chat-bubble ${m.role==='user'?'chat-bubble-primary':'chat-bubble-secondary'} whitespace-pre-line`}>{m.content}</div>
              </div>
            ))}
            {loading && <div className="chat chat-start"><div className="chat-bubble chat-bubble-secondary animate-pulse">Thinking...</div></div>}
            <div ref={bottomRef} />
          </div>
          <div className="p-2 border-t border-base-300 flex gap-2">
            <input
              className="input input-bordered input-sm flex-1"
              placeholder="Ask about metrics..."
              value={input}
              onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==='Enter') send(); }}
            />
            <button className={`btn btn-sm btn-primary ${loading?'loading':''}`} disabled={loading} onClick={send}>{!loading && 'Send'}</button>
          </div>
        </div>
      )}
      <button className="btn btn-primary btn-circle shadow-lg animate-pop" onClick={()=>setOpen(o=>!o)} aria-label="Toggle chat">
        {open ? '−' : '💬'}
      </button>
    </div>
  );
};

export default ChatWidget;
