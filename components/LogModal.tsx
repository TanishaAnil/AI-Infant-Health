import React, { useState } from 'react';
import { X, Save, Clock } from 'lucide-react';
import { LogType, LogEntry } from '../types';

interface LogModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: LogType | null;
  onSave: (entry: Omit<LogEntry, 'id'>) => void;
}

export const LogModal: React.FC<LogModalProps> = ({ isOpen, onClose, type, onSave }) => {
  const [amount, setAmount] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [diaperType, setDiaperType] = useState<'wet' | 'dirty' | 'mixed'>('wet');

  if (!isOpen || !type) return null;

  const handleSave = () => {
    const details: any = { note: notes };
    if (type === LogType.FEEDING && amount) details.amount = parseFloat(amount);
    if (type === LogType.TEMPERATURE && temperature) details.temperature = parseFloat(temperature);
    if (type === LogType.DIAPER) details.contents = diaperType;
    if (type === LogType.SLEEP) details.duration = amount ? parseFloat(amount) * 60 : 0; // rough estimation for demo

    onSave({
      type,
      timestamp: new Date(),
      details
    });
    
    // Reset
    setAmount('');
    setTemperature('');
    setNotes('');
    setDiaperType('wet');
    onClose();
  };

  const getTitle = () => {
    switch(type) {
        case LogType.FEEDING: return 'Log Feeding';
        case LogType.SLEEP: return 'Log Sleep';
        case LogType.DIAPER: return 'Log Diaper Change';
        case LogType.TEMPERATURE: return 'Log Temperature';
        default: return 'Log Event';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl slide-up-animation">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">{getTitle()}</h2>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {type === LogType.FEEDING && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Amount (oz)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="0.0"
              />
            </div>
          )}

          {type === LogType.TEMPERATURE && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Temperature (°C)</label>
              <input 
                type="number" 
                value={temperature} 
                onChange={(e) => setTemperature(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-rose-500 outline-none" 
                placeholder="36.5"
              />
            </div>
          )}

          {type === LogType.DIAPER && (
            <div className="flex gap-2">
                {['wet', 'dirty', 'mixed'].map((dType) => (
                    <button
                        key={dType}
                        onClick={() => setDiaperType(dType as any)}
                        className={`flex-1 py-3 rounded-xl capitalize font-medium transition-colors ${
                            diaperType === dType ? 'bg-emerald-500 text-white shadow-md' : 'bg-slate-100 text-slate-600'
                        }`}
                    >
                        {dType}
                    </button>
                ))}
            </div>
          )}

           {type === LogType.SLEEP && (
             // Simplification for demo: just logging duration of sleep that just happened
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Duration (hours)</label>
              <input 
                type="number" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" 
                placeholder="1.5"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Notes (Optional)</label>
            <textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-24 resize-none text-sm"
                placeholder="Any specific symptoms or behaviors?"
            />
          </div>

          <button 
            onClick={handleSave}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            Save Log
          </button>
        </div>
      </div>
    </div>
  );
};
