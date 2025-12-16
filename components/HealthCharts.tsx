import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { LogEntry, LogType } from '../types';

interface HealthChartsProps {
  logs: LogEntry[];
}

export const HealthCharts: React.FC<HealthChartsProps> = ({ logs }) => {
  
  // Prepare Temperature Data
  const tempData = logs
    .filter(l => l.type === LogType.TEMPERATURE && l.details.temperature)
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map(l => ({
      time: l.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temp: l.details.temperature,
      fullDate: l.timestamp
    }));

  // Prepare Feeding Data (Daily Volume)
  const feedDataMap = new Map<string, number>();
  logs
    .filter(l => l.type === LogType.FEEDING && l.details.amount)
    .forEach(l => {
        const dateKey = l.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const current = feedDataMap.get(dateKey) || 0;
        feedDataMap.set(dateKey, current + (l.details.amount || 0));
    });

  const feedData = Array.from(feedDataMap.entries()).map(([date, amount]) => ({ date, amount })).reverse();

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-rose-400 rounded-full"></span>
            Temperature Trend
        </h3>
        <div className="h-48 w-full">
            {tempData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tempData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="time" fontSize={10} tickMargin={10} stroke="#94a3b8" />
                        <YAxis domain={[35, 40]} fontSize={10} stroke="#94a3b8" />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#64748b', fontSize: '12px' }}
                        />
                        <Line type="monotone" dataKey="temp" stroke="#f43f5e" strokeWidth={3} dot={{ fill: '#f43f5e', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">Need more data points</div>
            )}
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-400 rounded-full"></span>
            Daily Feeding Volume (oz)
        </h3>
        <div className="h-48 w-full">
             {feedData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={feedData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" fontSize={10} tickMargin={10} stroke="#94a3b8" />
                        <YAxis fontSize={10} stroke="#94a3b8" />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Area type="monotone" dataKey="amount" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
                    </AreaChart>
                </ResponsiveContainer>
            ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-xs">No feeding logs yet</div>
            )}
        </div>
      </div>
    </div>
  );
};