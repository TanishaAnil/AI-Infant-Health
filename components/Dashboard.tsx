import React, { useMemo } from 'react';
import { LogEntry, LogType, InfantProfile, AgeGroup } from '../types';
import { Clock, Thermometer, Droplets, Moon, AlertTriangle, Baby, Utensils, Tag } from 'lucide-react';
import { t } from '../utils/translations';

interface DashboardProps {
  logs: LogEntry[];
  profile: InfantProfile;
  onQuickLog: (type: LogType) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ logs, profile, onQuickLog }) => {
  const lang = profile.language;
  const stats = useMemo(() => {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentLogs = logs.filter(l => l.timestamp > last24h);

    const lastFeed = logs.find(l => l.type === LogType.FEEDING);
    const lastSleep = logs.find(l => l.type === LogType.SLEEP);
    const lastDiaper = logs.find(l => l.type === LogType.DIAPER);
    const lastTemp = logs.find(l => l.type === LogType.TEMPERATURE);

    const totalSleepMinutes = recentLogs
      .filter(l => l.type === LogType.SLEEP && l.details.duration)
      .reduce((acc, curr) => acc + (curr.details.duration || 0), 0);
    
    // Sort logs descending for list
    const sortedLogs = [...logs].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 5);

    return { lastFeed, lastSleep, lastDiaper, lastTemp, totalSleepMinutes, sortedLogs };
  }, [logs]);

  const getTimeAgo = (date?: Date) => {
    if (!date) return '--';
    const diff = Math.floor((new Date().getTime() - date.getTime()) / 60000); // minutes
    if (diff < 60) return `${diff}m`;
    const h = Math.floor(diff / 60);
    return `${h}h ${diff % 60}m`;
  };

  const isFever = stats.lastTemp?.details.temperature && stats.lastTemp.details.temperature > 38.0;

  const getAgeGroupColor = (group?: AgeGroup) => {
    switch (group) {
        case AgeGroup.NEWBORN: return 'bg-purple-100 text-purple-700 border-purple-200';
        case AgeGroup.INFANT: return 'bg-blue-100 text-blue-700 border-blue-200';
        case AgeGroup.TODDLER: return 'bg-orange-100 text-orange-700 border-orange-200';
        default: return 'bg-slate-100 text-slate-700';
    }
  }

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* Header Profile */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                    <Baby size={24} />
                </div>
                <div>
                    <h2 className="font-bold text-slate-800 text-lg">{profile.name}</h2>
                    <p className="text-xs text-slate-500">{(new Date().getTime() - profile.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 7) | 0} weeks old</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-xs text-slate-400">{t('weight', lang)}</p>
                <p className="font-semibold text-slate-700">{profile.weight} kg</p>
            </div>
        </div>
        
        {/* Age Badge */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold w-fit ${getAgeGroupColor(profile.ageGroup)}`}>
            <Tag size={12} />
            <span>{profile.ageGroup}</span>
        </div>
      </div>

      {/* Critical Alert */}
      {isFever && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start space-x-3">
          <AlertTriangle className="text-red-500 shrink-0" />
          <div>
            <h3 className="font-bold text-red-700 text-sm">High Temperature</h3>
            <p className="text-xs text-red-600 mt-1">
              {stats.lastTemp?.details.temperature}°C. Monitor closely.
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Feeding */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-white rounded-lg shadow-sm text-blue-500"><Utensils size={18} /></div>
            <span className="text-xs font-medium text-blue-400">{t('feed', lang)}</span>
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-slate-700">{getTimeAgo(stats.lastFeed?.timestamp)}</p>
            <p className="text-xs text-slate-500">{stats.lastFeed?.details.amount ? `${stats.lastFeed.details.amount}oz` : 'Breastfeed'}</p>
          </div>
        </div>

        {/* Sleep */}
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-500"><Moon size={18} /></div>
            <span className="text-xs font-medium text-indigo-400">{t('sleep', lang)}</span>
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-slate-700">{(stats.totalSleepMinutes / 60).toFixed(1)} hrs</p>
            <p className="text-xs text-slate-500">Last: {getTimeAgo(stats.lastSleep?.timestamp)}</p>
          </div>
        </div>

        {/* Diaper */}
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-white rounded-lg shadow-sm text-emerald-500"><Droplets size={18} /></div>
            <span className="text-xs font-medium text-emerald-400">{t('diaper', lang)}</span>
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-slate-700">{getTimeAgo(stats.lastDiaper?.timestamp)}</p>
            <p className="text-xs text-slate-500 capitalize">{stats.lastDiaper?.details.contents || 'N/A'}</p>
          </div>
        </div>

        {/* Temp */}
        <div className="bg-rose-50 p-4 rounded-xl border border-rose-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-white rounded-lg shadow-sm text-rose-500"><Thermometer size={18} /></div>
            <span className="text-xs font-medium text-rose-400">{t('temp', lang)}</span>
          </div>
          <div className="mt-3">
            <p className="text-lg font-bold text-slate-700">{stats.lastTemp?.details.temperature ? `${stats.lastTemp.details.temperature}°C` : '--'}</p>
            <p className="text-xs text-slate-500">{getTimeAgo(stats.lastTemp?.timestamp)}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-slate-700 font-semibold mb-3 px-1">{t('quick_log', lang)}</h3>
        <div className="grid grid-cols-4 gap-2">
            <button onClick={() => onQuickLog(LogType.FEEDING)} className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm active:scale-95 transition-transform">
                <Utensils size={20} className="text-blue-500 mb-1" />
                <span className="text-[10px] font-medium text-slate-600">{t('feed', lang)}</span>
            </button>
            <button onClick={() => onQuickLog(LogType.SLEEP)} className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm active:scale-95 transition-transform">
                <Moon size={20} className="text-indigo-500 mb-1" />
                <span className="text-[10px] font-medium text-slate-600">{t('sleep', lang)}</span>
            </button>
            <button onClick={() => onQuickLog(LogType.DIAPER)} className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm active:scale-95 transition-transform">
                <Droplets size={20} className="text-emerald-500 mb-1" />
                <span className="text-[10px] font-medium text-slate-600">{t('diaper', lang)}</span>
            </button>
            <button onClick={() => onQuickLog(LogType.TEMPERATURE)} className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm active:scale-95 transition-transform">
                <Thermometer size={20} className="text-rose-500 mb-1" />
                <span className="text-[10px] font-medium text-slate-600">{t('temp', lang)}</span>
            </button>
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-50">
            <h3 className="text-slate-700 font-semibold text-sm">{t('recent_activity', lang)}</h3>
        </div>
        <div>
            {stats.sortedLogs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-sm">No logs yet.</div>
            ) : (
                stats.sortedLogs.map(log => (
                    <div key={log.id} className="flex items-center p-4 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <div className={`w-2 h-2 rounded-full mr-4 ${
                            log.type === LogType.FEEDING ? 'bg-blue-400' :
                            log.type === LogType.SLEEP ? 'bg-indigo-400' :
                            log.type === LogType.DIAPER ? 'bg-emerald-400' :
                            log.type === LogType.TEMPERATURE ? 'bg-rose-400' : 'bg-slate-400'
                        }`} />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-slate-700 capitalize">{log.type.toLowerCase()}</p>
                            <p className="text-xs text-slate-500">
                                {log.type === LogType.FEEDING && log.details.amount ? `${log.details.amount}oz` : 
                                 log.type === LogType.TEMPERATURE ? `${log.details.temperature}°C` :
                                 log.type === LogType.DIAPER ? log.details.contents :
                                 JSON.stringify(log.details)}
                            </p>
                        </div>
                        <div className="text-right">
                             <p className="text-xs text-slate-400"><Clock size={10} className="inline mr-1"/>{log.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>
    </div>
  );
};
