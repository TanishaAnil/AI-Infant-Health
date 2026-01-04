
import React, { useState, useEffect, useRef } from 'react';
import { Landing } from './components/Landing';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { AgentChat } from './components/AgentChat';
import { HealthCharts } from './components/HealthCharts';
import { ReportView } from './components/ReportView';
import { ProfileSettings } from './components/ProfileSettings';
import { LogModal } from './components/LogModal';
import { ViewState, LogEntry, InfantProfile, LogType, ChatMessage } from './types';
import { LayoutDashboard, Activity, MessageCircle, FileText, PlusCircle, AlertTriangle, VolumeX, User } from 'lucide-react';
import { generateDailySummary } from './services/geminiService';
import { t } from './utils/translations';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('landing');
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
      if (profile && logs.length > 0) {
        try {
          const summary = await generateDailySummary(logs, profile);
          setDailyDigest(summary.replace(/[#*]/g, ''));
        } catch (error) {
          console.error("Digest error:", error);
        }
      }
    };
    fetchDigest();
  }, [logs, profile]);

  const handleAuth = (userProfile: InfantProfile) => {
    setProfile(userProfile);
    setView('dashboard');
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

  if (view === 'landing') return <Landing onStart={() => setView('auth')} />;
  if (view === 'auth') return <Auth onAuth={handleAuth} onBack={() => setView('landing')} />;

  return (
    <div className="h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden flex flex-col">
      {isAlarmActive && (
        <div className="bg-rose-600 text-white p-3 flex items-center justify-between animate-pulse z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} />
            <span className="text-xs font-black uppercase tracking-widest">Critical Vitals Warning</span>
          </div>
          <button onClick={stopAlarmSound} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg flex items-center gap-2 text-xs font-bold transition-all">
            <VolumeX size={16} /> Mute Alarm
          </button>
        </div>
      )}

      <div className="max-w-md mx-auto w-full h-full flex flex-col sm:border-x sm:border-slate-200 sm:bg-white sm:shadow-2xl">
        {/* Navigation Wrapper */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-slate-50/50">
          {view === 'dashboard' && (
            <div className="flex-1 overflow-y-auto p-4">
              {dailyDigest && (
                <div className="mb-6 bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-[32px] text-white shadow-xl animate-fade-in border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><Activity size={80} /></div>
                  <div className="flex items-center gap-2 mb-2 relative z-10">
                    <Activity size={16} className="text-emerald-300" />
                    <h3 className="font-black text-xs uppercase tracking-[0.2em]">Health Intelligence</h3>
                  </div>
                  <p className="text-sm leading-relaxed relative z-10">{dailyDigest}</p>
                </div>
              )}
              <Dashboard logs={logs} profile={profile!} onQuickLog={handleQuickLog} onViewReport={() => setView('report')} />
            </div>
          )}
          
          {view === 'analysis' && (
            <div className="flex-1 overflow-y-auto p-5 animate-fade-in">
              <header className="mb-6">
                <h2 className="text-2xl font-black text-slate-900">Health Trends</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Biological Metrics</p>
              </header>
              <HealthCharts logs={logs} />
            </div>
          )}
          
          {view === 'logs' && (
            <div className="flex-1 overflow-hidden flex flex-col h-full bg-white">
              <AgentChat logs={logs} profile={profile!} onUpdateHistory={setChatHistory} />
            </div>
          )}
          
          {view === 'report' && (
            <div className="flex-1 overflow-y-auto p-2">
              <ReportView logs={logs} profile={profile!} chatHistory={chatHistory} />
            </div>
          )}

          {view === 'profile' && (
            <ProfileSettings profile={profile!} onUpdate={(u) => setProfile(u)} onLogout={() => setView('landing')} />
          )}
        </main>

        <div className="shrink-0 bg-white border-t border-slate-100 p-3 z-20 shadow-[0_-15px_30px_rgba(0,0,0,0.04)]">
          <div className="grid grid-cols-5 gap-1 relative items-center">
            <NavButton active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={<LayoutDashboard size={20} />} label="Home" />
            <NavButton active={view === 'analysis'} onClick={() => setView('analysis')} icon={<Activity size={20} />} label="Trends" />
            
            <div className="relative -top-8 flex justify-center pointer-events-none">
              <button 
                onClick={() => handleQuickLog(LogType.SYMPTOM)} 
                className="pointer-events-auto w-16 h-16 bg-indigo-600 rounded-[24px] shadow-2xl flex items-center justify-center text-white active:scale-90 transition-all border-4 border-white hover:bg-indigo-700"
              >
                <PlusCircle size={32} />
              </button>
            </div>

            <NavButton active={view === 'logs'} onClick={() => setView('logs')} icon={<MessageCircle size={20} />} label="AI Doctor" />
            <NavButton active={view === 'profile'} onClick={() => setView('profile')} icon={<User size={20} />} label="Profile" />
          </div>
        </div>
      </div>
      
      <LogModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} type={modalType} onSave={saveLog} language={profile!.language} />
    </div>
  );
};

const NavButton: React.FC<{active: boolean; onClick: () => void; icon: React.ReactNode; label: string}> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all ${active ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-400 hover:text-slate-600'}`}>
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'scale-100'}`}>{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-tighter mt-1.5">{label}</span>
  </button>
);

export default App;
