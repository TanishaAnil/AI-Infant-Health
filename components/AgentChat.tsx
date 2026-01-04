
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, MicOff, Volume2, Square, Search, RefreshCcw, AlertCircle, Sparkles } from 'lucide-react';
import { ChatMessage, LogEntry, InfantProfile } from '../types';
import { generateHealthInsight, generateDynamicSuggestions } from '../services/geminiService';

interface AgentChatProps {
  logs: LogEntry[];
  profile: InfantProfile;
  onUpdateHistory: (msgs: ChatMessage[]) => void;
}

const cleanMarkdown = (text: string) => {
    // Remove #, *, _, and ` symbols
    return text.replace(/[#*_`]/g, '').trim();
};

const formatText = (text: string) => {
  const clean = cleanMarkdown(text);
  const lines = clean.split('\n');
  
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <div key={i} className="h-2" />;
    
    // Check if it's a section header (Caps or bracketed)
    const isHeader = trimmed.toUpperCase() === trimmed && trimmed.length > 3 || trimmed.startsWith('[');
    
    if (isHeader) {
        return (
            <h4 key={i} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 mt-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                {trimmed.replace(/[\[\]]/g, '')}
            </h4>
        );
    }
    
    return (
        <p key={i} className="text-slate-700 leading-relaxed mb-1.5 text-sm font-medium">
            {trimmed}
        </p>
    );
  });
};

export const AgentChat: React.FC<AgentChatProps> = ({ logs, profile, onUpdateHistory }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: profile.language === 'te' 
        ? `నమస్కారం ${profile.parentName}. నేను ${profile.name} యొక్క క్లినికల్ అసిస్టెంట్‌ని. ఈ రోజు నేను మీకు ఎలా సహాయపడగలను?`
        : `Hello ${profile.parentName}. I am ${profile.name}'s Clinical Assistant. How can I help you today?`,
      timestamp: new Date()
    }
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [sourcesMap, setSourcesMap] = useState<Record<string, {title: string, uri: string}[]>>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [hasConnectionIssue, setHasConnectionIssue] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, isLoading]);
  useEffect(() => { onUpdateHistory(messages); }, [messages, onUpdateHistory]);

  const updateDynamicSuggestions = async (currentMessages: ChatMessage[]) => {
    setIsGeneratingSuggestions(true);
    const lastContext = currentMessages.slice(-3).map(m => `${m.role}: ${m.text}`).join('\n');
    const newSuggestions = await generateDynamicSuggestions(lastContext, logs, profile.language);
    if (newSuggestions && newSuggestions.length > 0) setSuggestions(newSuggestions);
    setIsGeneratingSuggestions(false);
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setHasConnectionIssue(false);

    const history = updatedMessages.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n');

    try {
        const { text, sources } = await generateHealthInsight(logs, textToSend, profile, history);
        
        const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: text, timestamp: new Date() };
        const finalMessages = [...updatedMessages, aiMsg];
        setMessages(finalMessages);
        if (sources.length > 0) setSourcesMap(prev => ({ ...prev, [aiMsg.id]: sources }));
        
        updateDynamicSuggestions(finalMessages);
    } catch (e: any) {
        console.error(e);
        setHasConnectionIssue(true);
    } finally {
        setIsLoading(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice input not supported.");
    const recognition = new SpeechRecognition();
    recognition.lang = profile.language === 'te' ? 'te-IN' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => setInput(e.results[0][0].transcript);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSpeak = (id: string, text: string) => {
    if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
    }
    window.speechSynthesis.cancel();
    const cleanText = cleanMarkdown(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = profile.language === 'te' ? 'te-IN' : 'en-US';
    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Clinically themed header */}
      <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between z-10">
         <div className="flex items-center gap-3">
            <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-lg shadow-indigo-100">
                <Bot size={20} />
            </div>
            <div>
                <span className="text-xs font-black uppercase tracking-[0.15em] text-slate-800">
                    Clinical AI Consultation
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Agent Active • RAG Enabled</span>
                </div>
            </div>
         </div>
         <button onClick={() => setMessages([messages[0]])} className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
            <RefreshCcw size={18} />
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-8 bg-slate-50/30">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white text-indigo-600 border border-slate-100'}`}>
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={18} />}
                </div>
                <div className="flex flex-col gap-2">
                    <div className={`p-5 rounded-[24px] shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 rounded-tl-none'}`}>
                        {msg.role === 'model' ? formatText(msg.text) : <p className="text-sm font-medium">{msg.text}</p>}
                    </div>
                    
                    {sourcesMap[msg.id] && (
                        <div className="mt-1 flex flex-wrap gap-2">
                             {sourcesMap[msg.id].map((src, idx) => (
                                <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[9px] bg-white border border-slate-100 text-slate-500 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-all font-bold">
                                    <Search size={10} /> {src.title.slice(0, 20)}...
                                </a>
                             ))}
                        </div>
                    )}

                    {msg.role === 'model' && (
                        <button onClick={() => handleSpeak(msg.id, msg.text)} className={`flex items-center gap-2 self-start text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl mt-1 border transition-all ${speakingId === msg.id ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'}`}>
                            {speakingId === msg.id ? <Square size={12} fill="currentColor" /> : <Volume2 size={12} />}
                            {speakingId === msg.id ? 'Stop' : 'Listen'}
                        </button>
                    )}
                </div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start animate-fade-in">
                 <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    </div>
                    <span className="text-[10px] text-indigo-700 font-black uppercase tracking-widest">Medical Analysis...</span>
                 </div>
            </div>
        )}
        {hasConnectionIssue && (
             <div className="flex flex-col items-center gap-4 p-8 bg-white border border-slate-100 rounded-3xl text-center animate-fade-in mx-4 shadow-sm">
                <AlertCircle size={40} className="text-rose-500" />
                <div className="space-y-1">
                    <p className="font-black text-slate-800">Connection Interrupted</p>
                    <p className="text-xs text-slate-400">Unable to reach the clinical database. Please refresh or try again.</p>
                </div>
                <button onClick={() => handleSend()} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 active:scale-95 transition-all">
                    <RefreshCcw size={18} /> Retry Consultation
                </button>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-slate-100 p-4 shadow-[0_-20px_40px_rgba(0,0,0,0.03)]">
        {suggestions.length > 0 && (
            <div className="flex items-center gap-2 mb-4 overflow-x-auto no-scrollbar pb-1">
                <Sparkles size={14} className="text-amber-500 shrink-0" />
                {suggestions.map((text, i) => (
                    <button key={i} onClick={() => handleSend(text)} className="shrink-0 px-4 py-2 bg-slate-50 border border-slate-100 text-slate-600 text-[11px] font-bold rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all whitespace-nowrap">
                        {text}
                    </button>
                ))}
            </div>
        )}

        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-[24px] border border-slate-100">
          <button onClick={toggleListening} className={`p-3 rounded-2xl transition-all ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-slate-600'}`}>
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={profile.language === 'te' ? 'సంప్రదించండి...' : "Describe symptoms or issues..."}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium py-3"
          />
          <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg disabled:opacity-50 active:scale-90 transition-all">
            <Send size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};
