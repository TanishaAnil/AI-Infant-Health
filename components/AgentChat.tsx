
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Mic, MicOff, Volume2, Square, ExternalLink, Search, BookOpen } from 'lucide-react';
import { ChatMessage, LogEntry, InfantProfile } from '../types';
import { generateHealthInsight } from '../services/geminiService';

interface AgentChatProps {
  logs: LogEntry[];
  profile: InfantProfile;
  onUpdateHistory: (msgs: ChatMessage[]) => void;
}

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
        ? `నమస్కారం ${profile.parentName}. నేను డాక్టర్ NurtureAI. ${profile.name} ఆరోగ్యం గురించి ఏవైనా సందేహాలు ఉన్నాయా?`
        : `Hello ${profile.parentName}. I am Dr. NurtureAI. Do you have any concerns about ${profile.name}'s health?`,
      timestamp: new Date()
    }
  ]);
  const [sourcesMap, setSourcesMap] = useState<Record<string, {title: string, uri: string}[]>>({});
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [researchStatus, setResearchStatus] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages, isLoading]);
  useEffect(() => { onUpdateHistory(messages); }, [messages, onUpdateHistory]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Voice input not supported in this browser.");

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
    
    if (profile.language === 'te') {
        utterance.lang = 'te-IN';
        const voices = window.speechSynthesis.getVoices();
        // Prefer a Telugu voice if available on the system
        const teluguVoice = voices.find(v => v.lang.includes('te'));
        if (teluguVoice) utterance.voice = teluguVoice;
    } else {
        utterance.lang = 'en-US';
    }

    utterance.rate = 0.92;
    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    setResearchStatus(profile.language === 'te' ? 'వైద్య పత్రాలు మరియు గూగుల్ సెర్చ్ పరిశీలిస్తున్నాను...' : 'Analyzing documents and searching Google...');

    const history = messages.slice(-5).map(m => `${m.role}: ${m.text}`).join('\n');

    try {
        const { text, sources } = await generateHealthInsight(logs, userMsg.text, profile, history);
        const aiMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: text, timestamp: new Date() };
        setMessages(prev => [...prev, aiMsg]);
        if (sources.length > 0) setSourcesMap(prev => ({ ...prev, [aiMsg.id]: sources }));
    } catch (e) {
        setMessages(prev => [...prev, { id: 'err', role: 'model', text: profile.language === 'te' ? "క్షమించాలి, సమాచారం పొందడంలో ఇబ్బందిగా ఉంది." : "Sorry, I'm having trouble connecting right now.", timestamp: new Date() }]);
    } finally {
        setIsLoading(false);
        setResearchStatus('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      <div className="px-4 py-3 bg-indigo-600 border-b border-indigo-700 flex items-center justify-between text-white shadow-lg z-10">
         <div className="flex items-center gap-2">
            <div className="bg-white/20 p-1.5 rounded-lg animate-pulse">
                <Bot size={18} />
            </div>
            <span className="text-xs font-black uppercase tracking-widest">
                {profile.language === 'te' ? 'AI డాక్టర్ అందుబాటులో ఉన్నారు' : 'Dr. NurtureAI Agent'}
            </span>
         </div>
         <div className="flex gap-4 opacity-80">
             <BookOpen size={16} />
             <Search size={16} />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex max-w-[92%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-2`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-md ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-emerald-600 border border-emerald-100'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                </div>
                <div className="flex flex-col gap-1.5">
                    <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 rounded-tl-none'}`}>
                        {msg.role === 'model' ? formatText(msg.text) : <p className="text-sm">{msg.text}</p>}
                    </div>
                    
                    {sourcesMap[msg.id] && (
                        <div className="mt-1 flex flex-wrap gap-2">
                             {sourcesMap[msg.id].map((src, idx) => (
                                <a key={idx} href={src.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[10px] bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm">
                                    <ExternalLink size={10} /> {src.title.slice(0, 25)}...
                                </a>
                             ))}
                        </div>
                    )}

                    {msg.role === 'model' && (
                        <button 
                            onClick={() => handleSpeak(msg.id, msg.text)} 
                            className={`flex items-center gap-2 self-start text-[10px] font-bold px-4 py-2 rounded-full mt-1 border transition-all ${speakingId === msg.id ? 'bg-rose-500 text-white border-rose-600 shadow-rose-100' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                        >
                            {speakingId === msg.id ? <Square size={10} fill="currentColor" /> : <Volume2 size={12} />}
                            {speakingId === msg.id ? (profile.language === 'te' ? 'ఆపు' : 'Stop') : (profile.language === 'te' ? 'వినండి' : 'Listen')}
                        </button>
                    )}
                </div>
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start animate-fade-in">
                 <div className="flex flex-col gap-2 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-[85%]">
                    <div className="flex items-center gap-3">
                        <div className="flex gap-1">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                        </div>
                        <span className="text-[10px] text-indigo-700 font-black uppercase tracking-widest italic">Reasoning...</span>
                    </div>
                    {researchStatus && <p className="text-[10px] text-slate-400 font-bold leading-tight uppercase tracking-tighter">{researchStatus}</p>}
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2">
          <button 
            onClick={toggleListening} 
            className={`p-4 rounded-2xl transition-all shadow-md ${isListening ? 'bg-rose-500 text-white animate-pulse shadow-rose-200 scale-110' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
          >
            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={profile.language === 'te' ? 'సందేహాన్ని ఇక్కడ టైప్ చేయండి...' : "Ask a pediatric concern..."}
            className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-inner"
          />
          <button 
            onClick={() => handleSend()} 
            disabled={isLoading || !input.trim()} 
            className="p-4 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-90 transition-all"
          >
            <Send size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};
