
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, MicOff, Volume2, Square, ExternalLink, Search, BookOpen, Sparkles, RefreshCcw, Key, AlertCircle, Info } from 'lucide-react';
import { ChatMessage, LogEntry, InfantProfile } from '../types';
import { generateHealthInsight, generateDynamicSuggestions } from '../services/geminiService';

interface AgentChatProps {
  logs: LogEntry[];
  profile: InfantProfile;
  onUpdateHistory: (msgs: ChatMessage[]) => void;
}

const DEFAULT_SUGGESTIONS = {
  en: ["Check breathing", "Managing fever", "Feeding guide", "Sleep safety"],
  te: ["శ్వాస తనిఖీ", "జ్వరం నిర్వహణ", "ఆహార గైడ్", "నిద్ర భద్రత"]
};

const formatText = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
       return (
         <li key={i} className="ml-4 list-disc marker:text-indigo-500 pl-1 text-slate-700 text-sm mb-1">
            {parseInlineStyles(line.replace(/^[*-]\s/, ''))}
         </li>
       );
    }
    return <p key={i} className="min-h-[1rem] text-slate-700 leading-relaxed mb-2 text-sm">{parseInlineStyles(line)}</p>;
  });
};

const parseInlineStyles = (text: string) => {
    return text.split(/(\*\*.*?\*\*)/).map((part, j) => 
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={j} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>
        ) : (
          part
        )
      );
}

export const AgentChat: React.FC<AgentChatProps> = ({ logs, profile, onUpdateHistory }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: profile.language === 'te' 
        ? `నమస్కారం ${profile.parentName}. నేను మీ సహాయకుడిని. ${profile.name} ఆరోగ్యం గురించి ఏదైనా అడగండి.`
        : `Hello ${profile.parentName}. I am your assistant. How can I help with ${profile.name}'s care today?`,
      timestamp: new Date()
    }
  ]);
  const [suggestions, setSuggestions] = useState<string[]>(profile.language === 'te' ? DEFAULT_SUGGESTIONS.te : DEFAULT_SUGGESTIONS.en);
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

  const handleFixConnection = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio?.openSelectKey) {
        try {
            await aistudio.openSelectKey();
            setHasConnectionIssue(false);
            const successMsg: ChatMessage = {
                id: 'key-update-' + Date.now(),
                role: 'model',
                text: profile.language === 'te' 
                  ? "కనెక్షన్ పునరుద్ధరించబడింది. దయచేసి మళ్ళీ ప్రయత్నించండి." 
                  : "Connection refreshed. Please try your request again.",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, successMsg]);
        } catch (err) {
            console.error("Failed to refresh connection", err);
        }
    } else {
        alert("Refresh is only available in the AI Studio environment.");
    }
  };

  const updateDynamicSuggestions = async (currentMessages: ChatMessage[]) => {
    setIsGeneratingSuggestions(true);
    const lastContext = currentMessages.slice(-4).map(m => `${m.role}: ${m.text}`).join('\n');
    const newSuggestions = await generateDynamicSuggestions(lastContext, logs, profile.language);
    if (newSuggestions && newSuggestions.length > 0) {
      setSuggestions(newSuggestions);
    }
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

    const history = updatedMessages.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');

    try {
        const { text, sources } = await generateHealthInsight(logs, textToSend, profile, history);
        
        if (text.includes("⚠️")) {
            setHasConnectionIssue(true);
        }

        const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: text, timestamp: new Date() };
        const finalMessages = [...updatedMessages, aiMsg];
        setMessages(finalMessages);
        if (sources.length > 0) setSourcesMap(prev => ({ ...prev, [aiMsg.id]: sources }));
        
        updateDynamicSuggestions(finalMessages);
    } catch (e: any) {
        console.error(e);
        setHasConnectionIssue(true);
        setMessages(prev => [...prev, { 
            id: 'err', 
            role: 'model', 
            text: profile.language === 'te' ? "క్షమించాలి, ఉచిత పరిమితి (Quota) సమస్య ఉంది." : "Sorry, there was a free tier quota or connection issue.", 
            timestamp: new Date() 
        }]);
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
    const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
    utterance.lang = profile.language === 'te' ? 'te-IN' : 'en-US';
    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="px-4 py-3 bg-indigo-700 border-b border-indigo-800 flex items-center justify-between text-white shadow-md z-10">
         <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg">
                <Bot size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">
                {profile.language === 'te' ? 'సహాయకుడు' : 'Assistant'}
            </span>
         </div>
         <button onClick={handleFixConnection} className="flex items-center gap-1 text-[10px] bg-white/10 px-2 py-1 rounded-md hover:bg-white/20 transition-all">
             <RefreshCcw size={12} /> {profile.language === 'te' ? 'రీఫ్రెష్' : 'Refresh'}
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex max-w-[92%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-100'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                </div>
                <div className="flex flex-col gap-1.5">
                    <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none'}`}>
                        {msg.role === 'model' ? formatText(msg.text) : <p className="text-sm">{msg.text}</p>}
                    </div>
                    
                    {sourcesMap[msg.id] && (
                        <div className="mt-1 flex flex-wrap gap-2">
                             {sourcesMap[msg.id].map((src, idx) => (
                                <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[9px] bg-white border border-slate-200 text-slate-500 px-3 py-1 rounded-full hover:bg-indigo-50 hover:text-indigo-600 transition-all">
                                    <Search size={8} /> {src.title.slice(0, 30)}...
                                </a>
                             ))}
                        </div>
                    )}

                    {msg.role === 'model' && (
                        <button onClick={() => handleSpeak(msg.id, msg.text)} className={`flex items-center gap-2 self-start text-[10px] font-bold px-3 py-1.5 rounded-full mt-1 border transition-all ${speakingId === msg.id ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200'}`}>
                            {speakingId === msg.id ? <Square size={10} fill="currentColor" /> : <Volume2 size={12} />}
                            {speakingId === msg.id ? 'Stop' : 'Listen'}
                        </button>
                    )}
                </div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start animate-fade-in">
                 <div className="flex items-center gap-2 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <RefreshCcw size={14} className="animate-spin text-indigo-600" />
                    <span className="text-[10px] text-indigo-700 font-bold uppercase tracking-widest italic">Analyzing...</span>
                 </div>
            </div>
        )}
        {hasConnectionIssue && (
             <div className="flex flex-col items-center gap-3 p-6 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 text-center animate-fade-in mx-4">
                <AlertCircle size={32} className="text-indigo-500" />
                <div className="space-y-1">
                    <p className="font-bold text-sm">Free Tier Limit / Connection Issue</p>
                    <p className="text-xs opacity-80">This usually happens when too many requests are sent quickly on a free plan. Please wait 15-30 seconds.</p>
                </div>
                <div className="flex flex-col gap-3 w-full">
                  <button onClick={handleFixConnection} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 active:scale-95 transition-all">
                      <RefreshCcw size={18} /> Refresh Connection
                  </button>
                  <p className="text-[10px] text-slate-400">If errors persist, ensure your API key is linked to an active project in AI Studio.</p>
                </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="bg-white border-t border-slate-200 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            <Sparkles size={14} className={`text-indigo-600 ${isGeneratingSuggestions ? 'animate-spin' : 'animate-pulse'}`} />
            {suggestions.map((text, i) => (
                <button key={i} onClick={() => handleSend(text)} className="shrink-0 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full hover:bg-indigo-100 transition-colors whitespace-nowrap">
                    {text}
                </button>
            ))}
        </div>

        <div className="p-4 flex items-center gap-2">
          <button onClick={toggleListening} className={`p-4 rounded-2xl transition-all shadow-sm ${isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={profile.language === 'te' ? 'ఇక్కడ అడగండి...' : "Ask baby care question..."}
            className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg disabled:opacity-50 active:scale-90 transition-all">
            <Send size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};
