import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, BookOpen } from 'lucide-react';
import { ChatMessage, LogEntry, InfantProfile } from '../types';
import { generateHealthInsight } from '../services/geminiService';
import { t } from '../utils/translations';

interface AgentChatProps {
  logs: LogEntry[];
  profile: InfantProfile;
  onUpdateHistory: (msgs: ChatMessage[]) => void;
}

export const AgentChat: React.FC<AgentChatProps> = ({ logs, profile, onUpdateHistory }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: profile.language === 'te' 
        ? `నమస్కారం! నేను NurtureAI. ${profile.name} ఆరోగ్యం గురించి మీరు నన్ను ఏమైనా అడగవచ్చు.`
        : `Hi! I'm NurtureAI. I see ${profile.name} is in the ${profile.ageGroup || 'infant'} stage. How can I help?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);
  
  // Sync history back to parent for report generation
  useEffect(() => {
    onUpdateHistory(messages);
  }, [messages, onUpdateHistory]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const history = messages.slice(-5).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

    const responseText = await generateHealthInsight(logs, userMsg.text, profile, history);

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, aiMsg]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
        
        <div className="bg-indigo-50 px-4 py-2 flex items-center gap-2 border-b border-indigo-100">
            <BookOpen size={14} className="text-indigo-600" />
            <span className="text-[10px] font-medium text-indigo-700">{t('kb_active', profile.language)}</span>
        </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div
                    className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                    msg.role === 'user'
                        ? 'bg-indigo-500 text-white rounded-br-none'
                        : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                    }`}
                >
                    {msg.text}
                </div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                 <div className="flex max-w-[85%] flex-row items-end gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-500 text-white animate-pulse">
                         <Sparkles size={14} />
                    </div>
                    <div className="p-3 rounded-2xl bg-white border border-slate-100 rounded-bl-none">
                         <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={profile.language === 'te' ? 'ఇక్కడ టైప్ చేయండి...' : "Type here..."}
            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-md shadow-indigo-200"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
