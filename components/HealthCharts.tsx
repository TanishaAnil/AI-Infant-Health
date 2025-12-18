
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { LogEntry, LogType } from '../types';

interface HealthChartsProps {
  logs: LogEntry[];
}

export const HealthCharts: React.FC<HealthChartsProps> = ({ logs }) => {
  
  const vitalsData = logs
    .filter(l => (l.type === LogType.HEART_RATE || l.type === LogType.SPO2) && (l.details.bpm || l.details.oxygen))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map(l => ({
      time: l.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      bpm: l.details.bpm,
      spo2: l.details.oxygen
    }));

  const tempData = logs
    .filter(l => l.type === LogType.TEMPERATURE && l.details.temperature)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map(l => ({
      time: l.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: l.details.temperature
    }));

  return (
    <div className="space-y-6">
      {/* Vitals Trend */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-rose-500 rounded-full"></span>
            Heart Rate & Oxygen
        </h3>
        <div className="h-48 w-full">
            {vitalsData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vitalsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" fontSize={10} tickMargin={10} stroke="#94a3b8" />
                        <YAxis domain={['auto', 'auto']} fontSize={10} stroke="#94a3b8" />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Line type="monotone" dataKey="bpm" name="BPM" stroke="#f43f5e" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="spo2" name="Oxygen %" stroke="#06b6d4" strokeWidth={3} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-medium uppercase italic">Waiting for vitals data...</div>
            )}
        </div>
      </div>

      {/* Temperature Trend */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider flex items-center gap-2">
            <span className="w-1.5 h-4 bg-orange-400 rounded-full"></span>
            Temperature (°C)
        </h3>
        <div className="h-48 w-full">
            {tempData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={tempData}>
                        <defs>
                            <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#fb923c" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="#fb923c" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" fontSize={10} tickMargin={10} stroke="#94a3b8" />
                        <YAxis domain={[35, 40]} fontSize={10} stroke="#94a3b8" />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                        <Area type="monotone" dataKey="temp" stroke="#fb923c" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={3} />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-[10px] font-medium uppercase italic">No temperature logs...</div>
            )}
        </div>
      </div>
    </div>
  );
};
