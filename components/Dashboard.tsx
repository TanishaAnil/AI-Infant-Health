
import React, { useMemo } from 'react';
import { LogEntry, LogType, InfantProfile } from '../types';
import { Baby, Utensils, Heart, Activity, Waves, Moon, Droplets, Thermometer, AlertCircle, CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { t } from '../utils/translations';

interface DashboardProps {
  logs: LogEntry[];
  profile: InfantProfile;
  onQuickLog: (type: LogType) => void;
  onViewReport: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ logs, profile, onQuickLog, onViewReport }) => {
  const lang = profile.language;
  
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return lang === 'te' ? 'శుభోదయం' : 'Good Morning';
    if (hour < 17) return lang === 'te' ? 'శుభ మధ్యాహ్నం' : 'Good Afternoon';
    return lang === 'te' ? 'శుభ సాయంత్రం' : 'Good Evening';
  }, [lang]);

  const stats = useMemo(() => {
    const lastTemp = logs.find(l => l.type === LogType.TEMPERATURE);
    const lastHr = logs.find(l => l.type === LogType.HEART_RATE);
    const lastSpo2 = logs.find(l => l.type === LogType.SPO2);
    const lastSleep = logs.find(l => l.type === LogType.SLEEP);

    return { 
      lastTemp, 
      lastHr, 
      lastSpo2, 
      lastSleep,
      tempStatus: lastTemp?.details.temperature && (lastTemp.details.temperature > 37.5 || lastTemp.details.temperature < 36) ? 'warning' : 'normal',
      hrStatus: lastHr?.details.bpm && (lastHr.details.bpm > 160 || lastHr.details.bpm < 100) ? 'warning' : 'normal',
      oxyStatus: lastSpo2?.details.oxygen && lastSpo2.details.oxygen < 95 ? 'warning' : 'normal',
    };
  }, [logs]);

  const getTimeAgo = (date?: Date) => {
    if (!date) return '--';
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}m`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Dynamic Header */}
      <div className="px-1 py-4">
        <h2 className="text-3xl font-black text-slate-900 leading-tight">
          {greeting}, <br/>
          <span className="text-indigo-600 font-bold">{profile.parentName}</span>
        </h2>
        <p className="text-slate-400 text-xs mt-2 font-bold uppercase tracking-widest flex items-center gap-2">
          <Clock size={12} /> Today's monitoring status
        </p>
      </div>

      {/* Baby ID Card */}
      <div className="bg-white p-5 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-inner">
                <Baby size={30} />
            </div>
            <div>
                <h3 className="font-black text-slate-800 text-lg leading-tight">{profile.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter bg-indigo-50 px-2 py-0.5 rounded-md">
                        {profile.ageGroup?.split(' ')[0]}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase">{profile.gender}</span>
                </div>
            </div>
        </div>
        <button onClick={onViewReport} className="text-indigo-600 p-2 bg-indigo-50 rounded-xl">
            <ChevronRight size={24} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Heart Rate Card */}
        <div className={`p-5 rounded-[32px] border shadow-sm transition-all ${stats.hrStatus === 'warning' ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${stats.hrStatus === 'warning' ? 'bg-rose-100 text-rose-600' : 'bg-rose-50 text-rose-500'}`}>
                  <Heart size={20} className={stats.hrStatus === 'warning' ? 'animate-pulse' : ''} />
                </div>
                {stats.hrStatus === 'warning' ? <AlertCircle size={14} className="text-rose-400" /> : <CheckCircle2 size={14} className="text-emerald-400" />}
            </div>
            <p className="text-3xl font-black text-slate-900 leading-none">{stats.lastHr?.details.bpm || '--'}</p>
            <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{t('heart_rate', lang)}</span>
                <span className="text-[10px] font-bold text-slate-300">{getTimeAgo(stats.lastHr?.timestamp)}</span>
            </div>
        </div>

        {/* SpO2 Card */}
        <div className={`p-5 rounded-[32px] border shadow-sm transition-all ${stats.oxyStatus === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-xl">
                  <Waves size={20} />
                </div>
                {stats.oxyStatus === 'warning' ? <AlertCircle size={14} className="text-amber-500" /> : <CheckCircle2 size={14} className="text-emerald-400" />}
            </div>
            <p className="text-3xl font-black text-slate-900 leading-none">{stats.lastSpo2?.details.oxygen ? `${stats.lastSpo2.details.oxygen}%` : '--'}</p>
            <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{t('spo2', lang)}</span>
                <span className="text-[10px] font-bold text-slate-300">{getTimeAgo(stats.lastSpo2?.timestamp)}</span>
            </div>
        </div>

        {/* Temperature Card */}
        <div className={`p-5 rounded-[32px] border shadow-sm transition-all ${stats.tempStatus === 'warning' ? 'bg-orange-50 border-orange-100' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                  <Thermometer size={20} />
                </div>
                {stats.tempStatus === 'warning' ? <AlertCircle size={14} className="text-orange-500" /> : <CheckCircle2 size={14} className="text-emerald-400" />}
            </div>
            <p className="text-3xl font-black text-slate-900 leading-none">{stats.lastTemp?.details.temperature ? `${stats.lastTemp.details.temperature}°C` : '--'}</p>
            <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{t('temperature', lang)}</span>
                <span className="text-[10px] font-bold text-slate-300">{getTimeAgo(stats.lastTemp?.timestamp)}</span>
            </div>
        </div>

        {/* Sleep Card */}
        <div className="bg-white p-5 rounded-[32px] border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Moon size={20} />
                </div>
                <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-slate-900 leading-none">{stats.lastSleep?.details.duration ? `${stats.lastSleep.details.duration}m` : '--'}</p>
            <div className="flex justify-between items-center mt-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{t('sleep', lang)}</span>
                <span className="text-[10px] font-bold text-slate-300">{getTimeAgo(stats.lastSleep?.timestamp)}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
            {[LogType.FEEDING, LogType.SLEEP, LogType.DIAPER, LogType.TEMPERATURE, LogType.HEART_RATE, LogType.SPO2].map((type) => (
                <button 
                    key={type}
                    onClick={() => onQuickLog(type)}
                    className="flex flex-col items-center justify-center p-4 bg-white border border-slate-100 rounded-[24px] hover:bg-slate-50 transition-all shadow-sm active:scale-95 group"
                >
                    <div className="mb-2 p-2.5 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 transition-colors">
                        {type === LogType.FEEDING && <Utensils size={22} className="text-blue-500" />}
                        {type === LogType.SLEEP && <Moon size={22} className="text-indigo-500" />}
                        {type === LogType.DIAPER && <Droplets size={22} className="text-emerald-500" />}
                        {type === LogType.TEMPERATURE && <Thermometer size={22} className="text-orange-500" />}
                        {type === LogType.HEART_RATE && <Heart size={22} className="text-rose-500" />}
                        {type === LogType.SPO2 && <Waves size={22} className="text-cyan-500" />}
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight text-center">
                        {t(type.toLowerCase(), lang)}
                    </span>
                </button>
            ))}
      </div>
    </div>
  );
};
