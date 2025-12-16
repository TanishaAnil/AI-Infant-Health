import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AgentChat } from './components/AgentChat';
import { HealthCharts } from './components/HealthCharts';
import { ReportView } from './components/ReportView';
import { LogModal } from './components/LogModal';
import { ViewState, LogEntry, InfantProfile, LogType, ChatMessage } from './types';
import { LayoutDashboard, Activity, MessageCircle, FileText, PlusCircle } from 'lucide-react';
import { generateDailySummary } from './services/geminiService';
import { t } from './utils/translations';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState<ViewState>('dashboard');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [profile, setProfile] = useState<InfantProfile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<LogType | null>(null);
  const [dailyDigest, setDailyDigest] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Agentic Action: Proactive Analysis on load (only if logged in)
  useEffect(() => {
    const fetchDigest = async () => {
        if(isAuthenticated && profile && logs.length > 0) {
            const summary = await generateDailySummary(logs, profile);
            setDailyDigest(summary);
        }
    };
    fetchDigest();
  }, [logs.length, profile, isAuthenticated]);

  const handleLogin = (userProfile: InfantProfile) => {
    setProfile(userProfile);
    setIsAuthenticated(true);
    // Add some mock data for the demo if empty
    if (logs.length === 0) {
        setLogs([
            { id: '1', type: LogType.FEEDING, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), details: { amount: 4 } },
            { id: '2', type: LogType.SLEEP, timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), details: { duration: 120 } },
        ]);
    }
  };

  const handleQuickLog = (type: LogType) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const saveLog = (entry: Omit<LogEntry, 'id'>) => {
    const newLog = { ...entry, id: Date.now().toString() };
    setLogs(prev => [newLog, ...prev]);
  };

  // 1. Patient Login Flow
  if (!isAuthenticated || !profile) {
    return <Login onLogin={handleLogin} />;
  }

  // 2. Main App (Conversation & Monitoring)
  return (
    <div className="h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex flex-col">
      
      {/* Main Container */}
      <div className="max-w-md mx-auto w-full h-full flex flex-col sm:border-x sm:border-slate-200 sm:bg-white sm:shadow-2xl">
        
        {/* Desktop Header */}
        <div className="hidden sm:flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-white z-10">
             <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">NurtureAI</h1>
             <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full uppercase">{profile.language}</span>
        </div>

        {/* Dynamic Content - Flex-1 means it takes all remaining height. Overflow-hidden handles internal scrolling */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-50/50">
          
          {view === 'dashboard' && (
            <div className="flex-1 overflow-y-auto p-4 pb-4">
                {dailyDigest && (
                    <div className="mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-2xl text-white shadow-lg shadow-indigo-200 animate-fade-in">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-white/20 p-1 rounded-lg"><Activity size={16} /></div>
                            <h3 className="font-semibold text-sm">Agent Insight</h3>
                        </div>
                        <p className="text-xs leading-relaxed opacity-90">{dailyDigest}</p>
                    </div>
                )}
                <Dashboard logs={logs} profile={profile} onQuickLog={handleQuickLog} />
            </div>
          )}
          
          {view === 'analysis' && (
            <div className="flex-1 overflow-y-auto p-4 pb-4 animate-fade-in">
                 <h2 className="text-xl font-bold mb-4 text-slate-800">{t('trends', profile.language)}</h2>
                <HealthCharts logs={logs} />
            </div>
          )}
          
          {view === 'logs' && (
            <div className="flex-1 overflow-hidden flex flex-col animate-fade-in h-full">
                <AgentChat logs={logs} profile={profile} onUpdateHistory={setChatHistory} />
            </div>
          )}
          
          {view === 'report' && (
             <div className="flex-1 overflow-y-auto pb-4">
                <ReportView logs={logs} profile={profile} chatHistory={chatHistory} />
            </div>
          )}
        </main>

        {/* Bottom Navigation - Static Footer (Shrink-0) - No overlapping! */}
        <div className="shrink-0 bg-white border-t border-slate-200 p-2 z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div className="grid grid-cols-5 gap-1 relative">
                <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20} />} label={t('dashboard', profile.language)} />
                <NavButton active={view === 'analysis'} onClick={() => setView('analysis')} icon={<Activity size={20} />} label={t('trends', profile.language)} />
                
                {/* Center FAB - Floats strictly up from the footer, ensuring it never gets 'lost' */}
                <div className="relative -top-6 flex justify-center pointer-events-none">
                    <button 
                        onClick={() => handleQuickLog(LogType.FEEDING)} 
                        className="pointer-events-auto w-14 h-14 bg-indigo-600 rounded-full shadow-lg shadow-indigo-300 flex items-center justify-center text-white active:scale-95 transition-transform border-4 border-slate-50"
                    >
                        <PlusCircle size={28} />
                    </button>
                </div>

                <NavButton active={view === 'logs'} onClick={() => setView('logs')} icon={<MessageCircle size={20} />} label={t('agent', profile.language)} />
                <NavButton active={view === 'report'} onClick={() => setView('report')} icon={<FileText size={20} />} label={t('report', profile.language)} />
            </div>
        </div>

      </div>
      
      <LogModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        type={modalType} 
        onSave={saveLog} 
      />
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${active ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
    >
        {icon}
        <span className="text-[10px] font-medium mt-1 truncate max-w-full">{label}</span>
    </button>
);

export default App;