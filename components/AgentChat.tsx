import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen, ChevronRight } from 'lucide-react';
import { ChatMessage, LogEntry, InfantProfile } from '../types';
import { generateHealthInsight } from '../services/geminiService';
import { t } from '../utils/translations';

interface AgentChatProps {
  logs: LogEntry[];
  profile: InfantProfile;
  onUpdateHistory: (msgs: ChatMessage[]) => void;
}

// Simple formatter for Bold text (**text**) and newlines to avoid heavy markdown libraries
const formatText = (text: string) => {
  return text.split('\n').map((line, i) => (
    <React.Fragment key={i}>
      {line.split(/(\*\*.*?\*\*)/).map((part, j) => 
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={j} className="font-bold text-indigo-900">{part.slice(2, -2)}</strong>
        ) : (
          part
        )
      )}
      <br />
    </React.Fragment>
  ));
};

export const AgentChat: React.FC<AgentChatProps> = ({ logs, profile, onUpdateHistory }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: profile.language === 'te' 
        ? `నమస్కారం ${profile.parentName}! నేను NurtureAI. ${profile.name} ఆరోగ్యం గురించి మీరు నన్ను ఏమైనా అడగవచ్చు. ఈ రోజు నేను మీకు ఎలా సహాయపడగలను?`
        : `Hi ${profile.parentName}! I'm NurtureAI. I've reviewed ${profile.name}'s recent logs. How can I support you today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = profile.language === 'te' 
    ? ["పాప బరువు సరిగ్గా ఉందా?", "నిద్ర వేళలు ఎలా ఉన్నాయి?", "జ్వరం ఉంటే ఏం చేయాలి?"]
    : ["Is the weight normal?", "Analyze sleep pattern", "Signs of dehydration?", "Feeding schedule advice"];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);
  useEffect(() => { onUpdateHistory(messages); }, [messages, onUpdateHistory]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.slice(-6).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

    try {
        const responseText = await generateHealthInsight(logs, userMsg.text, profile, history);

        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          text: responseText,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
        const errorMsg: ChatMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "System Error: Unable to reach AI service. Please check your connection and API key.",
            timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
        
      {/* KB Indicator */}
      <div className="bg-white/80 backdrop-blur px-4 py-2 flex items-center justify-between border-b border-slate-100 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-emerald-600" />
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">{t('kb_active', profile.language)}</span>
          </div>
          <span className="text-[10px] text-slate-400">Gemini 2.5 Flash</span>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-emerald-600 border border-emerald-100'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div
                    className={`p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-br-none'
                        : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                    }`}
                >
                    {msg.role === 'model' ? formatText(msg.text) : msg.text}
                </div>
            </div>
          </div>
        ))}

        {/* Thinking Indicator */}
        {isLoading && (
            <div className="flex justify-start animate-fade-in">
                 <div className="flex max-w-[85%] flex-row items-end gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white border border-emerald-100">
                         <Sparkles size={14} className="text-emerald-500 animate-pulse" />
                    </div>
                    <div className="p-3 rounded-2xl bg-white border border-slate-100 rounded-bl-none flex items-center gap-3">
                         <span className="text-xs text-slate-400 font-medium">Consulting guidelines...</span>
                         <div className="flex space-x-1">
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        
        {/* Suggestion Chips */}
        {!isLoading && (
            <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mb-1">
                {suggestions.map((s, i) => (
                    <button 
                        key={i} 
                        onClick={() => handleSend(s)}
                        className="flex-shrink-0 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors border border-indigo-100 flex items-center gap-1"
                    >
                        {s} <ChevronRight size={10} />
                    </button>
                ))}
            </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={profile.language === 'te' ? 'ఇక్కడ టైప్ చేయండి...' : "Ask NurtureAI..."}
            className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 active:scale-95"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};