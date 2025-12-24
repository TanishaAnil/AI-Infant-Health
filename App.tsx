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

  // Generate an AI insight whenever logs change
  useEffect(() => {
    const fetchDigest = async () => {
      if (isAuthenticated && profile && logs.length > 0) {
        try {
          const summary = await generateDailySummary(logs, profile);
          // Clean summary of markdown artifacts just in case
          const cleanSummary = summary.replace(/[#*]/g, '');
          setDailyDigest(cleanSummary);
        } catch (error) {
          console.error("Digest error:", error);
        }
      }
    };
    fetchDigest();
  }, [logs, profile, isAuthenticated]);

  const handleLogin = (userProfile: InfantProfile) => {
    setProfile(userProfile);
    setIsAuthenticated(true);
    // Initialize with some example data if empty
    if (logs.length === 0) {
      setLogs([
        { 
          id: '1', 
          type: LogType.FEEDING, 
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), 
          details: { amount: 4, note: "Took full bottle" } 
        },
        { 
          id: '2', 
          type: LogType.SLEEP, 
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), 
          details: { duration: 120, note: "Quiet sleep" } 
        },
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

  if (!isAuthenticated || !profile) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex flex-col">
      <div className="max-w-md mx-auto w-full h-full flex flex-col sm:border-x sm:border-slate-200 sm:bg-white sm:shadow-2xl">
        {/* Desktop Header */}
        <div className="hidden sm:flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-white z-10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">NurtureAI</h1>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Session</span>
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full uppercase">{profile.language}</span>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-50/50">
          {view === 'dashboard' && (
            <div className="flex-1 overflow-y-auto p-4 pb-4">
              {dailyDigest && (
                <div className="mb-6 bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-3xl text-white shadow-xl shadow-indigo-100 animate-fade-in border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-white/20 p-1.5 rounded-lg"><Activity size={16} /></div>
                    <h3 className="font-bold text-sm tracking-wide">Dr. NurtureAI Insight</h3>
                  </div>
                  <p className="text-xs leading-relaxed font-medium opacity-95">{dailyDigest}</p>
                </div>
              )}
              <Dashboard logs={logs} profile={profile} onQuickLog={handleQuickLog} />
            </div>
          )}
          
          {view === 'analysis' && (
            <div className="flex-1 overflow-y-auto p-4 pb-4 animate-fade-in">
              <header className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">{t('trends', profile.language)}</h2>
                <p className="text-xs text-slate-400">Health trajectory for the last 24 hours</p>
              </header>
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

        {/* Mobile Bottom Navigation */}
        <div className="shrink-0 bg-white border-t border-slate-200 p-2 z-20 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-5 gap-1 relative items-center">
            <NavButton 
              active={view === 'dashboard'} 
              onClick={() => setView('dashboard')} 
              icon={<LayoutDashboard size={20} />} 
              label={t('dashboard', profile.language)} 
            />
            <NavButton 
              active={view === 'analysis'} 
              onClick={() => setView('analysis')} 
              icon={<Activity size={20} />} 
              label={t('trends', profile.language)} 
            />
            
            {/* FAB (Floating Action Button) Center */}
            <div className="relative -top-6 flex justify-center pointer-events-none">
              <button 
                onClick={() => handleQuickLog(LogType.SYMPTOM)} 
                className="pointer-events-auto w-14 h-14 bg-indigo-600 rounded-full shadow-xl shadow-indigo-300 flex items-center justify-center text-white active:scale-90 transition-all border-4 border-white hover:bg-indigo-700"
                title="Log Symptom"
              >
                <PlusCircle size={28} />
              </button>
            </div>

            <NavButton 
              active={view === 'logs'} 
              onClick={() => setView('logs')} 
              icon={<MessageCircle size={20} />} 
              label={t('agent', profile.language)} 
            />
            <NavButton 
              active={view === 'report'} 
              onClick={() => setView('report')} 
              icon={<FileText size={20} />} 
              label={t('report', profile.language)} 
            />
          </div>
        </div>
      </div>
      
      {/* Universal Log Modal */}
      <LogModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        type={modalType} 
        onSave={saveLog}
        language={profile.language}
      />
    </div>
  );
};

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

const NavButton: React.FC<NavButtonProps> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${
      active 
        ? 'text-indigo-600 bg-indigo-50/50' 
        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
    }`}
  >
    <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>
      {icon}
    </div>
    <span className="text-[10px] font-bold mt-1.5 truncate max-w-full tracking-tight">{label}</span>
  </button>
);

export default App;