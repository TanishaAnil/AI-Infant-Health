import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, ChevronRight, Link2, Mic, MicOff, Volume2, Square } from 'lucide-react';
import { ChatMessage, LogEntry, InfantProfile } from '../types';
import { generateHealthInsight } from '../services/geminiService';

interface AgentChatProps {
  logs: LogEntry[];
  profile: InfantProfile;
  onUpdateHistory: (msgs: ChatMessage[]) => void;
}

// Improved formatter for Doctor's Notes (Handling Bold, Lists, Links)
const formatText = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    // Handle bullet points
    if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
       return (
         <li key={i} className="ml-4 list-disc marker:text-indigo-400 pl-1">
            {parseInlineStyles(line.replace(/^[*-]\s/, ''))}
         </li>
       );
    }
    // Handle numbered lists
    if (/^\d+\./.test(line.trim())) {
        return (
            <div key={i} className="ml-2 font-medium text-slate-800 mt-1">
                {parseInlineStyles(line)}
            </div>
        )
    }
    // Handle Source Links (Markdown style [Title](url))
    if (line.includes('[') && line.includes('](')) {
        const parts = line.split(/(\[.*?\]\(.*?\))/g);
        return (
            <div key={i} className="text-xs text-indigo-600 flex items-center gap-1 mt-1">
                <Link2 size={12} />
                {parts.map((part, j) => {
                    const match = part.match(/\[(.*?)\]\((.*?)\)/);
                    if (match) {
                        return <a key={j} href={match[2]} target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-800">{match[1]}</a>
                    }
                    return <span key={j}>{part}</span>;
                })}
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
        ? `నమస్కారం ${profile.parentName}. నేను డాక్టర్ NurtureAI (పీడియాట్రిక్ కన్సల్టెంట్). ${profile.name} ఆరోగ్యం గురించి చెప్పండి. ఏవైనా లక్షణాలు ఉన్నాయా?`
        : `Hello ${profile.parentName}. I am Dr. NurtureAI, your Pediatric Health Consultant. I have access to ${profile.name}'s logs and medical guidelines. \n\nWhat symptoms are you observing today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const suggestions = profile.language === 'te' 
    ? ["జ్వరం వచ్చింది", "ఆహారం తీసుకోవట్లేదు", "దగ్గు/జలుబు ఉంది"]
    : ["Baby has a fever", "Not eating well", "Crying uncontrollably", "Skin rash advice"];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages, isLoading]);
  useEffect(() => { onUpdateHistory(messages); }, [messages, onUpdateHistory]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Auto-speak Logic for Telugu
  useEffect(() => {
    if (profile.language === 'te') {
        const lastMsg = messages[messages.length - 1];
        // Speak if it's a model message, and we aren't currently loading a new one
        if (lastMsg && lastMsg.role === 'model' && !isLoading) {
             // Delay slightly to allow UI render
             const timer = setTimeout(() => {
                 handleSpeak(lastMsg.id, lastMsg.text);
             }, 800);
             return () => clearTimeout(timer);
        }
    }
  }, [messages.length, isLoading, profile.language]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = profile.language === 'te' ? 'te-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSpeak = (id: string, text: string) => {
    // If currently speaking this message, stop it
    if (speakingId === id) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
    }

    // Stop any other speech
    window.speechSynthesis.cancel();

    // Create new utterance
    // Remove markdown symbols for cleaner speech
    // Remove links [title](url) -> title
    const cleanText = text
        .replace(/\*\*/g, '') // bold
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
        .replace(/[#*]/g, ''); // headings/bullets
        
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Set Language
    utterance.lang = profile.language === 'te' ? 'te-IN' : 'en-US';
    
    // Optional: Adjust rate/pitch
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

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
    // Stop speaking if user interrupts
    window.speechSynthesis.cancel();
    setSpeakingId(null);

    // Send recent context
    const history = messages.slice(-8).map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

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
            text: "Network Error: Unable to reach the medical service. Please check your connection.",
            timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMsg]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
        
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
            <div className={`flex max-w-[95%] md:max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-emerald-600 border border-emerald-100'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={16} />}
                </div>

                {/* Bubble Container */}
                <div className="flex flex-col gap-1 items-start">
                    {/* Bubble */}
                    <div
                        className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user'
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                        }`}
                    >
                        {msg.role === 'model' ? formatText(msg.text) : msg.text}
                    </div>
                    
                    {/* Actions for Model (TTS) */}
                    {msg.role === 'model' && (
                        <button 
                            onClick={() => handleSpeak(msg.id, msg.text)}
                            className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full transition-colors ${
                                speakingId === msg.id 
                                ? 'bg-indigo-100 text-indigo-600 animate-pulse' 
                                : 'text-slate-400 hover:bg-slate-100 hover:text-indigo-500'
                            }`}
                        >
                            {speakingId === msg.id ? <Square size={12} fill="currentColor" /> : <Volume2 size={12} />}
                            {speakingId === msg.id ? (profile.language === 'te' ? 'ఆపు' : 'Stop') : (profile.language === 'te' ? 'వినండి' : 'Listen')}
                        </button>
                    )}
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
                         <span className="text-xs text-slate-500 font-medium">Dr. Nurture is analyzing symptoms & guidelines...</span>
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
          <button
            onClick={toggleListening}
            className={`p-3.5 rounded-xl transition-all shadow-sm ${
                isListening 
                ? 'bg-red-50 text-red-500 border border-red-200 animate-pulse' 
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
            }`}
            title="Speak symptoms (Voice Input)"
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
                isListening 
                ? (profile.language === 'te' ? 'వినబడుతోంది...' : 'Listening...') 
                : (profile.language === 'te' ? 'లక్షణాలు టైప్ చేయండి...' : "Describe symptoms...")
            }
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