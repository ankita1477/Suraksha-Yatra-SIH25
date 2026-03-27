import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const AI_BASE = import.meta.env.VITE_AI_BASE || '/ai';
const CHAT_ENDPOINT = `${AI_BASE}/api/chat`;
const CLEAR_ENDPOINT = `${AI_BASE}/api/chat/clear`;

interface Message {
  role: 'user' | 'bot';
  text: string;
  ts: string;
}

const SESSION_ID = `dash-${Math.random().toString(36).slice(2)}`;

const SUGGESTIONS = [
  'What should I do in an emergency?',
  'How do I add emergency contacts?',
  'What are safe zone tips?',
  'Show recent safety alerts',
];

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'bot',
      text: "Hi! I'm **Suraksha AI** 👋\nI can help with safety tips, emergency guidance, and app features. How can I help you?",
      ts: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    const userMsg: Message = { role: 'user', text: trimmed, ts: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await axios.post(CHAT_ENDPOINT, {
        message: trimmed,
        session_id: SESSION_ID,
      });
      const botMsg: Message = {
        role: 'bot',
        text: res.data.response,
        ts: res.data.timestamp || new Date().toISOString(),
      };
      setMessages(prev => [...prev, botMsg]);
      if (!open) setUnread(n => n + 1);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: 'bot',
          text: "Sorry, I couldn't reach the AI service right now. Please try again in a moment.",
          ts: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      await axios.post(CLEAR_ENDPOINT, { session_id: SESSION_ID });
    } catch { /* ignore */ }
    setMessages([
      {
        role: 'bot',
        text: "Chat cleared! How can I help you?",
        ts: new Date().toISOString(),
      },
    ]);
  };

  const renderText = (text: string) => {
    // Basic markdown: **bold**, line breaks, bullet points
    return text
      .split('\n')
      .map((line, i) => {
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={i} className="block">
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
          </span>
        );
      });
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
        style={{ background: 'linear-gradient(135deg, #2D6A4F, #40916C)' }}
        title="Suraksha AI Assistant"
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-3 3v-3z" />
          </svg>
        )}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {/* Chat window */}
      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 flex flex-col rounded-2xl shadow-2xl overflow-hidden"
          style={{ width: 380, height: 560, border: '1px solid #e5e7eb', background: '#F8FAF5' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3 text-white"
            style={{ background: 'linear-gradient(135deg, #1B4332, #2D6A4F)' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                AI
              </div>
              <div>
                <p className="font-semibold text-sm">Suraksha AI</p>
                <p className="text-xs text-green-200">Safety Assistant • Powered by Gemini</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              className="text-green-200 hover:text-white text-xs underline"
              title="Clear chat"
            >
              Clear
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3" style={{ background: '#F0F4F0' }}>
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'bot' && (
                  <div className="w-7 h-7 rounded-full flex-shrink-0 mr-2 flex items-center justify-center text-xs font-bold text-white mt-1"
                    style={{ background: '#2D6A4F' }}>
                    AI
                  </div>
                )}
                <div
                  className="max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed"
                  style={
                    msg.role === 'user'
                      ? { background: '#2D6A4F', color: '#fff', borderBottomRightRadius: 4 }
                      : { background: '#fff', color: '#1B1B1B', borderBottomLeftRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                  }
                >
                  {renderText(msg.text)}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full flex-shrink-0 mr-2 flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: '#2D6A4F' }}>
                  AI
                </div>
                <div className="bg-white rounded-2xl px-4 py-3 shadow-sm" style={{ borderBottomLeftRadius: 4 }}>
                  <span className="flex gap-1">
                    {[0, 150, 300].map(d => (
                      <span key={d} className="w-2 h-2 rounded-full bg-green-400 animate-bounce"
                        style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions (only shown initially) */}
          {messages.length <= 1 && (
            <div className="px-3 pb-2 flex flex-wrap gap-1" style={{ background: '#F0F4F0' }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-2 py-1 rounded-full border border-green-300 text-green-700 hover:bg-green-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 border-t border-gray-200 bg-white">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              placeholder="Ask about safety, emergency help..."
              maxLength={2000}
              className="flex-1 text-sm rounded-full border border-gray-200 px-4 py-2 outline-none focus:border-green-400 transition-colors"
              style={{ background: '#F8FAF5' }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all disabled:opacity-40"
              style={{ background: '#2D6A4F' }}
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
