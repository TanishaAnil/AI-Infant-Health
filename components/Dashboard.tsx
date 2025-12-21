import React, { useMemo } from 'react';
import { LogEntry, LogType, InfantProfile } from '../types';
import { Baby, Utensils, Heart, Activity, Waves, Moon, Droplets, Thermometer } from 'lucide-react';
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
    const lastGlucose = logs.find(l => l.type === LogType.BLOOD_GLUCOSE);
    const lastSleep = logs.find(l => l.type === LogType.SLEEP);

    return { lastTemp, lastHr, lastSpo2, lastGlucose, lastSleep };
  }, [logs]);

  const getTimeAgo = (date?: Date) => {
    if (!date) return '--';
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000);
    if (diff < 60) return `${diff}m`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <Baby size={24} />
            </div>
            <div>
                <h2 className="font-bold text-slate-800 text-lg">{profile.name}</h2>
                <p className="text-xs text-slate-500">{profile.ageGroup}</p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">{t('weight', lang)}</p>
            <p className="font-bold text-indigo-600">{profile.weight} kg</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <Heart size={18} className="text-rose-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">BPM</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.lastHr?.details.bpm || '--'}</p>
            <p className="text-[10px] text-slate-400 mt-1">{t('heart_rate', lang)} • {getTimeAgo(stats.lastHr?.timestamp)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <Waves size={18} className="text-cyan-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">SpO2</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.lastSpo2?.details.oxygen ? `${stats.lastSpo2.details.oxygen}%` : '--'}</p>
            <p className="text-[10px] text-slate-400 mt-1">{t('spo2', lang)} • {getTimeAgo(stats.lastSpo2?.timestamp)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <Thermometer size={18} className="text-orange-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Temp</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.lastTemp?.details.temperature ? `${stats.lastTemp.details.temperature}°C` : '--'}</p>
            <p className="text-[10px] text-slate-400 mt-1">{t('temperature', lang)} • {getTimeAgo(stats.lastTemp?.timestamp)}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <Moon size={18} className="text-indigo-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sleep</span>
            </div>
            <p className="text-2xl font-black text-slate-800">{stats.lastSleep?.details.duration ? `${stats.lastSleep.details.duration}m` : '--'}</p>
            <p className="text-[10px] text-slate-400 mt-1">{t('sleep', lang)} • {getTimeAgo(stats.lastSleep?.timestamp)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
            {[LogType.FEEDING, LogType.SLEEP, LogType.DIAPER, LogType.TEMPERATURE, LogType.HEART_RATE, LogType.SPO2].map((type) => (
                <button 
                    key={type}
                    onClick={() => onQuickLog(type)}
                    className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm active:scale-95"
                >
                    {type === LogType.FEEDING && <Utensils size={18} className="text-blue-500" />}
                    {type === LogType.SLEEP && <Moon size={18} className="text-indigo-500" />}
                    {type === LogType.DIAPER && <Droplets size={18} className="text-emerald-500" />}
                    {type === LogType.TEMPERATURE && <Thermometer size={18} className="text-orange-500" />}
                    {type === LogType.HEART_RATE && <Heart size={18} className="text-rose-500" />}
                    {type === LogType.SPO2 && <Waves size={18} className="text-cyan-500" />}
                    <span className="text-[9px] font-bold text-slate-600 mt-1 truncate w-full text-center">
                        {t(type.toLowerCase(), lang)}
                    </span>
                </button>
            ))}
      </div>
    </div>
  );
};