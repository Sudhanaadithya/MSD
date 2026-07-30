import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createChatSession } from '../services/geminiAgent';

// ── Singleton chat session ─────────────────────────────────────────
const chatSession = createChatSession();

// ── Quick suggestion chips ─────────────────────────────────────────
const QUICK_ACTIONS = [
  { label: 'Rent Crane', query: 'I want to rent a crane tomorrow' },
  { label: 'Dashboard Stats', query: 'Show me the dashboard overview stats' },
  { label: 'Active Rentals', query: 'What are the currently active rentals?' },
  { label: 'Unresolved Alerts', query: 'Show me all unresolved alerts' },
  { label: 'Forecast Demand', query: 'Forecast demand for Excavator at site S001 for tomorrow' },
  { label: 'All Sites', query: 'List all active construction sites' },
];

// ── Function name → human-readable label ───────────────────────────
const FUNCTION_LABELS = {
  getDemandForecast: 'Predicting demand',
  detectAnomaly: 'Running anomaly detection',
  getAnomaliesList: 'Fetching anomalies',
  getDemandSummary: 'Loading demand trends',
  getEquipmentList: 'Querying equipment',
  getActiveRentals: 'Checking active rentals',
  getUnresolvedAlerts: 'Scanning alerts',
  getSites: 'Loading sites',
  getDashboardStats: 'Pulling dashboard stats',
  checkMLHealth: 'Checking ML service',
  getOperators: 'Fetching operators',
  getEquipmentById: 'Deep-diving asset',
};

// ── Auto-Intent Detection Helper (as user types) ───────────────────
const getLiveIntentBadge = (text) => {
  if (!text || !text.trim()) return null;
  const q = text.toLowerCase();

  if (/rent|book|hire|reserve|want|need|tmr|tomorrow/i.test(q)) {
    return { label: 'Rental & Asset Booking', icon: 'local_shipping', color: 'bg-amber-100 text-amber-900 border-amber-300' };
  }
  if (/forecast|predict|demand|future|upcoming/i.test(q)) {
    return { label: 'ML Demand Forecasting', icon: 'trending_up', color: 'bg-blue-100 text-blue-900 border-blue-300' };
  }
  if (/anomal|detect|flag|suspicious|outlier/i.test(q)) {
    return { label: 'Anomaly & Risk Detection', icon: 'search', color: 'bg-purple-100 text-purple-900 border-purple-300' };
  }
  if (/alert|warn|issue|problem|critical|danger/i.test(q)) {
    return { label: 'Operational Alert Scan', icon: 'warning', color: 'bg-red-100 text-red-900 border-red-300' };
  }
  if (/operator|staff|personnel|who|driver|worker/i.test(q)) {
    return { label: 'Personnel & Operator Roster', icon: 'badge', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' };
  }
  if (/price|cost|rate|fee|daily|weekly|how much/i.test(q)) {
    return { label: 'Rate Card & Pricing Estimate', icon: 'payments', color: 'bg-yellow-100 text-yellow-950 border-yellow-300' };
  }
  if (/(ex-\d+|cr-\d+|bd-\d+|ld-\d+|gr-\d+|cp-\d+|eqx\d+)/i.test(q)) {
    return { label: 'Asset Telemetry Deep-Dive', icon: 'analytics', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' };
  }
  return { label: 'Fleet Intelligence Query', icon: 'smart_toy', color: 'bg-gray-100 text-gray-800 border-gray-300' };
};

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hey! I'm your Smart Rental Track AI assistant. Ask me anything about your fleet — equipment status, demand forecasts, anomalies, alerts, or site operations.",
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeFunction, setActiveFunction] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // Focus input when chat opens & handle Escape key to close
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // ── Send message handler ─────────────────────────────────────────
  const handleSend = async (customMessage = null) => {
    const messageText = customMessage || input.trim();
    if (!messageText || isLoading) return;

    // Add user message & keep input focused
    setMessages((prev) => [...prev, { role: 'user', text: messageText }]);
    setInput('');
    setIsLoading(true);
    setActiveFunction(null);
    inputRef.current?.focus();

    try {
      const { text, functionsCalled } = await chatSession.sendMessage(
        messageText,
        (fnName) => {
          setActiveFunction(FUNCTION_LABELS[fnName] || fnName);
        }
      );

      // Add assistant message with metadata
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text,
          functionsCalled: functionsCalled.length > 0 ? functionsCalled : null,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `❌ Something went wrong: ${err.message}`,
        },
      ]);
    } finally {
      setIsLoading(false);
      setActiveFunction(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    chatSession.clearHistory();
    setMessages([
      {
        role: 'assistant',
        text: "Chat cleared! Ready for new fleet queries.",
      },
    ]);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  // ── Render message text with rich markdown formatting ────────────
  const renderMessageText = (text) => {
    if (!text) return null;

    const lines = text.split('\n');
    return lines.map((line, i) => {
      let processed = line.replace(
        /\*\*(.*?)\*\*/g,
        '<strong class="font-bold text-gray-900">$1</strong>'
      );

      if (processed.startsWith('- ') || processed.startsWith('• ')) {
        processed = `<span class="inline-flex gap-1.5 items-baseline"><span class="text-[#FFCD00] font-black text-xs select-none">■</span><span>${processed.slice(2)}</span></span>`;
      }

      const numberedMatch = processed.match(/^(\d+)\.\s(.+)/);
      if (numberedMatch) {
        processed = `<span class="inline-flex gap-1.5"><span class="text-gray-900 font-bold min-w-[18px] select-none">${numberedMatch[1]}.</span><span>${numberedMatch[2]}</span></span>`;
      }

      return (
        <span
          key={i}
          className="block leading-relaxed"
          dangerouslySetInnerHTML={{ __html: processed || '&nbsp;' }}
        />
      );
    });
  };

  const activeIntentBadge = getLiveIntentBadge(input);

  return (
    <>
      {/* ── Floating Trigger Button (Caterpillar Yellow) ────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-[9998] group transition-all duration-300 active:scale-95"
        id="chatbot-trigger"
        aria-label="Toggle AI Assistant"
      >
        <div
          className={`relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${
            isOpen
              ? 'bg-gray-900 text-white rotate-90 scale-95 shadow-xl'
              : 'bg-[#FFCD00] text-gray-950 hover:scale-105 shadow-2xl border-2 border-gray-900'
          }`}
          style={{
            boxShadow: isOpen
              ? '0 10px 30px rgba(0,0,0,0.3)'
              : '0 10px 25px rgba(255,205,0,0.5), 0 0 15px rgba(255,205,0,0.3)',
          }}
        >
          <span className="material-symbols-outlined text-2xl font-bold transition-transform duration-300">
            {isOpen ? 'close' : 'smart_toy'}
          </span>
          {!isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-gray-900 text-[#FFCD00] rounded-full border-2 border-white flex items-center justify-center text-[9px] font-black animate-pulse">
              ●
            </span>
          )}
        </div>
      </button>

      {/* ── Chat Panel (White Background + Black Text + Yellow Accents) ── */}
      <div
        className={`fixed bottom-24 left-6 z-[9999] w-[420px] max-h-[calc(100vh-130px)] flex flex-col transition-all duration-300 origin-bottom-left bg-white text-gray-900 rounded-2xl border-2 border-gray-900 shadow-2xl overflow-hidden ${
          isOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 translate-y-6 pointer-events-none'
        }`}
        style={{
          boxShadow: '0 25px 60px rgba(0,0,0,0.25), 0 0 20px rgba(255,205,0,0.15)',
        }}
      >
        {/* ── Header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-900 text-white border-b-4 border-[#FFCD00] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFCD00] text-gray-950 flex items-center justify-center font-bold border border-gray-800 shadow-sm">
              <span className="material-symbols-outlined text-xl">
                smart_toy
              </span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-wide flex items-center gap-1.5">
                Smart Rental AI Copilot
                <span className="px-1.5 py-0.5 rounded bg-[#FFCD00] text-gray-950 text-[9px] font-black tracking-wider uppercase">
                  LIVE
                </span>
              </h3>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] text-gray-300 font-medium tracking-wide">
                  Connected to Fleet Database
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-[#FFCD00] transition-colors"
              title="Clear chat history"
            >
              <span className="material-symbols-outlined text-lg">
                delete_sweep
              </span>
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
              title="Close AI Copilot (Esc)"
            >
              <span className="material-symbols-outlined text-lg font-bold">
                close
              </span>
            </button>
          </div>
        </div>

        {/* ── Messages Container ────────────────────────────────── */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gray-50/50"
          style={{
            minHeight: '280px',
            maxHeight: 'calc(100vh - 340px)',
            scrollbarWidth: 'thin',
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-[#FFCD00] text-gray-950 flex items-center justify-center flex-shrink-0 mr-2 mt-1 shadow-sm font-bold border border-gray-800">
                  <span className="material-symbols-outlined text-xs font-bold">
                    smart_toy
                  </span>
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 text-[13px] leading-relaxed rounded-2xl shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-[#FFCD00] text-gray-950 font-medium rounded-br-none border border-amber-400'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                {renderMessageText(msg.text)}

                {/* Execution Badges */}
                {msg.functionsCalled && msg.functionsCalled.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-gray-200">
                    {msg.functionsCalled.map((fc, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${
                          fc.success
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[11px]">
                          {fc.success ? 'check_circle' : 'error'}
                        </span>
                        {FUNCTION_LABELS[fc.name] || fc.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start animate-fade-in">
              <div className="w-7 h-7 rounded-lg bg-[#FFCD00] text-gray-950 flex items-center justify-center flex-shrink-0 mr-2 mt-1 shadow-sm font-bold border border-gray-800">
                <span className="material-symbols-outlined text-xs animate-spin">
                  sync
                </span>
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-none bg-white border border-gray-200 text-gray-800 shadow-sm max-w-[85%]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-[#FFCD00] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-[#FFCD00] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-[#FFCD00] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-[11px] text-gray-700 font-semibold">
                    {activeFunction || 'Searching fleet records...'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick Actions (Show when chat is empty/short) ──────── */}
        {messages.length <= 2 && !isLoading && (
          <div className="px-4 py-2 bg-gray-100/70 border-t border-gray-200 flex-shrink-0">
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-xs text-[#FFCD00] bg-gray-900 rounded p-0.5">bolt</span>
              Suggested Queries
            </p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(action.query)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-white text-gray-800 border border-gray-300 hover:border-gray-900 hover:bg-[#FFCD00] transition-all shadow-2xs"
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Live Auto-Type Intent Detection Banner ─────────────── */}
        {activeIntentBadge && (
          <div className="px-4 py-1.5 bg-amber-50/90 border-t border-amber-200 flex items-center justify-between transition-all animate-fade-in">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-xs text-amber-800">
                {activeIntentBadge.icon}
              </span>
              <span className="text-[11px] font-bold text-amber-900">
                {activeIntentBadge.label}
              </span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-700">
              Auto-Detected
            </span>
          </div>
        )}

        {/* ── Input Bar ─────────────────────────────────────────── */}
        <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 border-2 border-gray-200 focus-within:border-gray-900 focus-within:bg-white transition-all shadow-inner">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything... e.g. 'I want to rent a crane tmr'"
              disabled={isLoading}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 font-medium text-[13px] placeholder:text-gray-400"
              id="chatbot-input"
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-[#FFCD00] text-gray-950 hover:bg-[#E5B800] active:scale-95 border border-gray-900 shadow-sm"
              title="Send Message"
            >
              <span className="material-symbols-outlined text-lg font-bold">
                arrow_upward
              </span>
            </button>
          </div>
          <div className="flex items-center justify-between mt-1.5 px-1 text-[9px] text-gray-500 font-medium">
            <span>Press Esc to close</span>
            <span className="font-bold text-gray-700">Smart Rental Track AI</span>
          </div>
        </div>
      </div>

      {/* ── Animation Styles ────────────────────────────────────── */}
      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeSlideIn 0.25s ease-out forwards;
        }
      `}</style>
    </>
  );
};

export default Chatbot;