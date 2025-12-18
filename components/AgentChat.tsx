import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ChevronRight, Link2, Mic, MicOff, Volume2, Square } from 'lucide-react';
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
         <li key={i} className="ml-4 list-disc marker:text-indigo-400 pl-1">
            {parseInlineStyles(line.replace(/^[*-]\s/, ''))}
         </li>
       );
    }
    if (/^\d+\./.test(line.trim())) {
        return (
            <div key={i} className="ml-2 font-medium text-slate-800 mt-1">
                {parseInlineStyles(line)}
            </div>
        )
    }
    return <p key={i} className="min-h-[1rem]">{parseInlineStyles(line)}</p>;
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
        ? `నమస్కారం ${profile.parentName}. నేను డాక్టర్ NurtureAI. ${profile.name} ఆరోగ్యం గురించి చెప్పండి.`
        : `Hello ${profile.parentName}. I am Dr. NurtureAI. How is ${profile.name} doing today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load voices correctly
  useEffect(() => {
    const updateVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
    };
    updateVoices();
    window.speechSynthesis.onvoiceschanged = updateVoices;
    return () => window.speechSynthesis.cancel();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);
  useEffect(() => { onUpdateHistory(messages); }, [messages, onUpdateHistory]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input not supported.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = profile.language === 'te' ? 'te-IN' : 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      setInput(event.results[0][0].transcript);
    };
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
    
    const cleanText = text.replace(/\*\*/g, '').replace(/[#*]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // VERBAL TELUGU LOGIC:
    if (profile.language === 'te') {
        // Look for a native Telugu voice installed on the OS
        const teluguVoice = availableVoices.find(v => 
            v.lang.includes('te-IN') || 
            v.name.toLowerCase().includes('telugu')
        );
        
        if (teluguVoice) {
            utterance.voice = teluguVoice;
        } else {
            console.warn("No native Telugu voice found. Falling back to system default.");
        }
        utterance.lang = 'te-IN';
    } else {
        utterance.lang = 'en-US';
    }

    utterance.rate = 0.95;
    utterance.onstart = () => setSpeakingId(id);
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    window.speechSynthesis.speak(utterance);
  };

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
    window.speechSynthesis.cancel();
    setSpeakingId(null);

    const history = messages.slice(-6).map(m => `${m.role}: ${m.text}`).join('\n');

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
        setMessages(prev => [...prev, {
            id: 'err',
            role: 'model',
            text: profile.language === 'te' ? "సర్వర్ ఎర్రర్." : "Server error.",
            timestamp: new Date()
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-emerald-600 border border-emerald-100'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                </div>
                <div className="flex flex-col gap-1">
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'}`}>
                        {msg.role === 'model' ? formatText(msg.text) : msg.text}
                    </div>
                    {msg.role === 'model' && (
                        <button 
                            onClick={() => handleSpeak(msg.id, msg.text)}
                            className={`flex items-center gap-1 self-start text-[10px] font-bold px-3 py-1.5 rounded-full mt-1 ${speakingId === msg.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
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
                 <div className="flex flex-row items-center gap-3 p-3 bg-white rounded-2xl border border-slate-100">
                    <Sparkles size={14} className="text-emerald-500 animate-pulse" />
                    <span className="text-xs text-slate-400 font-medium italic">
                        {profile.language === 'te' ? 'డాక్టర్ ఆలోచిస్తున్నారు...' : 'Dr. Nurture is thinking...'}
                    </span>
                 </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleListening}
            className={`p-3.5 rounded-xl transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-slate-100 text-slate-500'}`}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={profile.language === 'te' ? 'ఇక్కడ టైప్ చేయండి...' : "Ask a question..."}
            className="flex-1 p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <button onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="p-3.5 bg-indigo-600 text-white rounded-xl active:scale-95 shadow-lg shadow-indigo-100">
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};