
import React, { useState, useEffect, useRef } from 'react';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { AgentChat } from './components/AgentChat';
import { HealthCharts } from './components/HealthCharts';
import { ReportView } from './components/ReportView';
import { LogModal } from './components/LogModal';
import { ViewState, LogEntry, InfantProfile, LogType, ChatMessage } from './types';
import { LayoutDashboard, Activity, MessageCircle, FileText, PlusCircle, AlertTriangle, VolumeX } from 'lucide-react';
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
  const [isAlarmActive, setIsAlarmActive] = useState(false);
  
  const audioCtxRef = useRef<AudioContext | null>(null);
  const alarmIntervalRef = useRef<number | null>(null);

  const stopAlarmSound = () => {
    if (alarmIntervalRef.current) {
      window.clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
    setIsAlarmActive(false);
  };

  const playAlarmSound = () => {
    if (isAlarmActive) return;
    setIsAlarmActive(true);
    
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const playBeep = () => {
      if (!audioCtxRef.current) return;
      const osc = audioCtxRef.current.createOscillator();
      const gain = audioCtxRef.current.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtxRef.current.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtxRef.current.currentTime + 0.5);
      gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(audioCtxRef.current.destination);
      osc.start();
      osc.stop(audioCtxRef.current.currentTime + 0.5);
    };

    playBeep();
    alarmIntervalRef.current = window.setInterval(playBeep, 1000);
  };

  useEffect(() => {
    if (logs.length === 0) return;
    const latest = logs[0];
    let isDanger = false;

    if (latest.type === LogType.TEMPERATURE && latest.details.temperature) {
      if (latest.details.temperature > 38.5 || latest.details.temperature < 35.5) isDanger = true;
    }
    if (latest.type === LogType.HEART_RATE && latest.details.bpm) {
      if (latest.details.bpm > 170 || latest.details.bpm < 80) isDanger = true;
    }
    if (latest.type === LogType.SPO2 && latest.details.oxygen) {
      if (latest.details.oxygen < 94) isDanger = true;
    }

    if (isDanger) {
      playAlarmSound();
    }
  }, [logs]);

  useEffect(() => {
    const fetchDigest = async () => {
      if (isAuthenticated && profile && logs.length > 0) {
        try {
          const summary = await generateDailySummary(logs, profile);
          setDailyDigest(summary.replace(/[#*]/g, ''));
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
    if (logs.length === 0) {
      setLogs([
        { id: '1', type: LogType.FEEDING, timestamp: new Date(Date.now() - 3600000), details: { amount: 4, note: "Good intake" } },
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
      {isAlarmActive && (
        <div className="bg-rose-600 text-white p-3 flex items-center justify-between animate-pulse z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Critical Vitals Warning</span>
          </div>
          <button 
            onClick={stopAlarmSound}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all"
          >
            <VolumeX size={16} /> Mute Alarm
          </button>
        </div>
      )}

      <div className="max-w-md mx-auto w-full h-full flex flex-col sm:border-x sm:border-slate-200 sm:bg-white sm:shadow-2xl">
        <div className="hidden sm:flex items-center justify-between p-6 border-b border-slate-100 shrink-0 bg-white z-10">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-500 bg-clip-text text-transparent">NurtureAI</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full uppercase">{profile.language}</span>
          </div>
        </div>

        <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-50/50">
          {view === 'dashboard' && (
            <div className="flex-1 overflow-y-auto p-4 pb-4">
              {dailyDigest && (
                <div className="mb-6 bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-3xl text-white shadow-xl animate-fade-in border border-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-white/20 p-1.5 rounded-lg"><Activity size={16} /></div>
                    <h3 className="font-bold text-sm tracking-wide italic">Daily Insight</h3>
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
                <p className="text-xs text-slate-400">Biological monitoring metrics</p>
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

        <div className="shrink-0 bg-white border-t border-slate-200 p-2 z-20 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.03)]">
          <div className="grid grid-cols-5 gap-1 relative items-center">
            <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20} />} label={t('dashboard', profile.language)} />
            <NavButton active={view === 'analysis'} onClick={() => setView('analysis')} icon={<Activity size={20} />} label={t('trends', profile.language)} />
            
            <div className="relative -top-6 flex justify-center pointer-events-none">
              <button 
                onClick={() => handleQuickLog(LogType.SYMPTOM)} 
                className="pointer-events-auto w-14 h-14 bg-indigo-600 rounded-full shadow-xl flex items-center justify-center text-white active:scale-90 transition-all border-4 border-white hover:bg-indigo-700"
              >
                <PlusCircle size={28} />
              </button>
            </div>

            <NavButton active={view === 'logs'} onClick={() => setView('logs')} icon={<MessageCircle size={20} />} label={t('agent', profile.language)} />
            <NavButton active={view === 'report'} onClick={() => setView('report')} icon={<FileText size={20} />} label={t('report', profile.language)} />
          </div>
        </div>
      </div>
      
      <LogModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type={modalType} onSave={saveLog} language={profile.language} />
    </div>
  );
};

const NavButton: React.FC<{active: boolean; onClick: () => void; icon: React.ReactNode; label: string}> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all ${active ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}>
    <div className={`transition-transform duration-200 ${active ? 'scale-110' : 'scale-100'}`}>{icon}</div>
    <span className="text-[10px] font-bold mt-1.5 truncate max-w-full tracking-tight">{label}</span>
  </button>
);

export default App;
