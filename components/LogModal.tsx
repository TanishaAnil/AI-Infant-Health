
import React, { useState } from 'react';
import { X, Save, Heart, Activity, Waves, Thermometer, Utensils } from 'lucide-react';
import { LogType, LogEntry } from '../types';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: LogType | null;
  onSave: (entry: Omit<LogEntry, 'id'>) => void;
}

export const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, type, onSave }) => {
  const [value, setValue] = useState<string>('');
  const [notes, setNotes] = useState('');

  if (!isOpen || !type) return null;

  const handleSave = () => {
    const details: any = { note: notes };
    const numValue = parseFloat(value);

    if (type === LogType.FEEDING) details.amount = numValue;
    if (type === LogType.TEMPERATURE) details.temperature = numValue;
    if (type === LogType.HEART_RATE) details.bpm = numValue;
    if (type === LogType.SPO2) details.oxygen = numValue;
    if (type === LogType.BLOOD_GLUCOSE) details.glucose = numValue;

    onSave({ type, timestamp: new Date(), details });
    setValue('');
    setNotes('');
    onClose();
  };

  const getLabel = () => {
    switch(type) {
        case LogType.FEEDING: return 'Amount (oz)';
        case LogType.TEMPERATURE: return 'Temp (°C)';
        case LogType.HEART_RATE: return 'Heart Rate (BPM)';
        case LogType.SPO2: return 'Oxygen Level (%)';
        case LogType.BLOOD_GLUCOSE: return 'Blood Sugar (mg/dL)';
        default: return 'Value';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {type === LogType.HEART_RATE && <Heart className="text-rose-500" size={20} />}
            {type === LogType.SPO2 && <Waves className="text-cyan-500" size={20} />}
            {type === LogType.BLOOD_GLUCOSE && <Activity className="text-purple-500" size={20} />}
            Log {getLabel().split('(')[0]}
          </h2>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-full text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">{getLabel()}</label>
            <input 
                type="number" 
                value={value} 
                onChange={(e) => setValue(e.target.value)}
                autoFocus
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-black text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="0"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Observations</label>
            <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none text-sm text-slate-600"
                placeholder="Any unusual symptoms?"
            />
          </div>

          <button 
            onClick={handleSave}
            disabled={!value}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
          >
            Save Vitals
          </button>
        </div>
      </div>
    </div>
  );
};
