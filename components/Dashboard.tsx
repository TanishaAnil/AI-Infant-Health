
import React, { useMemo } from 'react';
import { LogEntry, LogType, InfantProfile } from '../types';
import { Baby, Utensils, Heart, Activity, Waves, Moon, Droplets, Thermometer, AlertCircle, CheckCircle2 } from 'lucide-react';
import { t } from '../utils/translations';

interface DashboardProps {
  logs: LogEntry[];
  profile: InfantProfile;
  onQuickLog: (type: LogType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ logs, profile, onQuickLog }) => {
  const lang = profile.language;
  
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
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                <Baby size={28} />
            </div>
            <div>
                <h2 className="font-bold text-slate-800 text-lg leading-tight">{profile.name}</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{profile.ageGroup}</p>
                </div>
            </div>
        </div>
        <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('weight', lang)}</p>
            <p className="font-black text-indigo-600 text-lg">{profile.weight} kg</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Heart Rate Card */}
        <div className={`p-4 rounded-3xl border shadow-sm transition-all ${stats.hrStatus === 'warning' ? 'bg-rose-50 border-rose-100' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-3">
                <Heart size={20} className={stats.hrStatus === 'warning' ? 'text-rose-500 animate-pulse' : 'text-rose-500'} />
                {stats.hrStatus === 'warning' ? <AlertCircle size={14} className="text-rose-400" /> : <CheckCircle2 size={14} className="text-emerald-400" />}
            </div>
            <p className="text-3xl font-black text-slate-800">{stats.lastHr?.details.bpm || '--'}</p>
            <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t('heart_rate', lang)}</span>
                <span className="text-[10px] font-medium text-slate-300">{getTimeAgo(stats.lastHr?.timestamp)}</span>
            </div>
        </div>

        {/* SpO2 Card */}
        <div className={`p-4 rounded-3xl border shadow-sm transition-all ${stats.oxyStatus === 'warning' ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-3">
                <Waves size={20} className="text-cyan-500" />
                {stats.oxyStatus === 'warning' ? <AlertCircle size={14} className="text-amber-500" /> : <CheckCircle2 size={14} className="text-emerald-400" />}
            </div>
            <p className="text-3xl font-black text-slate-800">{stats.lastSpo2?.details.oxygen ? `${stats.lastSpo2.details.oxygen}%` : '--'}</p>
            <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t('spo2', lang)}</span>
                <span className="text-[10px] font-medium text-slate-300">{getTimeAgo(stats.lastSpo2?.timestamp)}</span>
            </div>
        </div>

        {/* Temperature Card */}
        <div className={`p-4 rounded-3xl border shadow-sm transition-all ${stats.tempStatus === 'warning' ? 'bg-orange-50 border-orange-100' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center justify-between mb-3">
                <Thermometer size={20} className="text-orange-500" />
                {stats.tempStatus === 'warning' ? <AlertCircle size={14} className="text-orange-500" /> : <CheckCircle2 size={14} className="text-emerald-400" />}
            </div>
            <p className="text-3xl font-black text-slate-800">{stats.lastTemp?.details.temperature ? `${stats.lastTemp.details.temperature}°C` : '--'}</p>
            <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t('temperature', lang)}</span>
                <span className="text-[10px] font-medium text-slate-300">{getTimeAgo(stats.lastTemp?.timestamp)}</span>
            </div>
        </div>

        {/* Sleep Card */}
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <Moon size={20} className="text-indigo-500" />
                <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-slate-800">{stats.lastSleep?.details.duration ? `${stats.lastSleep.details.duration}m` : '--'}</p>
            <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{t('sleep', lang)}</span>
                <span className="text-[10px] font-medium text-slate-300">{getTimeAgo(stats.lastSleep?.timestamp)}</span>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 pb-4">
            {[LogType.FEEDING, LogType.SLEEP, LogType.DIAPER, LogType.TEMPERATURE, LogType.HEART_RATE, LogType.SPO2].map((type) => (
                <button 
                    key={type}
                    onClick={() => onQuickLog(type)}
                    className="flex flex-col items-center justify-center p-3.5 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95 group"
                >
                    <div className="mb-2 p-2 bg-slate-50 rounded-xl group-hover:bg-white transition-colors">
                        {type === LogType.FEEDING && <Utensils size={20} className="text-blue-500" />}
                        {type === LogType.SLEEP && <Moon size={20} className="text-indigo-500" />}
                        {type === LogType.DIAPER && <Droplets size={20} className="text-emerald-500" />}
                        {type === LogType.TEMPERATURE && <Thermometer size={20} className="text-orange-500" />}
                        {type === LogType.HEART_RATE && <Heart size={20} className="text-rose-500" />}
                        {type === LogType.SPO2 && <Waves size={20} className="text-cyan-500" />}
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
