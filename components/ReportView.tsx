
import React, { useState } from 'react';
import { FileText, Download, CheckCircle, RefreshCw, Printer, Shield, Activity, Calendar, User } from 'lucide-react';
import { LogEntry, InfantProfile, ChatMessage, LogType } from '../types';
import { generateFormalReport } from '../services/geminiService';
import { t } from '../utils/translations';

interface ReportViewProps {
  logs: LogEntry[];
  profile: InfantProfile;
  chatHistory: ChatMessage[];
}

export const ReportView: React.FC<ReportViewProps> = ({ logs, profile, chatHistory }) => {
  const [report, setReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    const chatText = chatHistory.slice(-10).map(m => `${m.role}: ${m.text}`).join('\n');
    const result = await generateFormalReport(logs, profile, chatText);
    setReport(result);
    setIsGenerating(false);
  };

  const handleDownload = () => {
    window.print();
  };

  const latestVitals = logs.filter(l => [LogType.TEMPERATURE, LogType.HEART_RATE, LogType.SPO2].includes(l.type)).slice(0, 5);

  return (
    <div className="p-4 h-full flex flex-col animate-fade-in print:bg-white print:p-0">
      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 flex-1 flex flex-col overflow-hidden">
        
        {/* OP Header */}
        <div className="px-6 py-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h1 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">NurtureAI Medical</h1>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Certified Pediatric Monitoring Agent</span>
                    </div>
                </div>
                {report && (
                     <button onClick={handleDownload} className="p-2 text-indigo-600 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors print:hidden">
                        <Printer size={20} />
                     </button>
                )}
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
                <div className="flex justify-between border-b border-slate-200/50 pb-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Patient Name</span>
                    <span className="text-[10px] font-bold text-slate-800 uppercase">{profile.name}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Record ID</span>
                    <span className="text-[10px] font-bold text-slate-800">OP-{Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase">DOB / Age</span>
                    <span className="text-[10px] font-bold text-slate-800">{profile.birthDate.toLocaleDateString()} / {profile.ageGroup?.split(' ')[0]}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/50 pb-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase">Sex / Weight</span>
                    <span className="text-[10px] font-bold text-slate-800">{profile.gender} / {profile.weight}kg</span>
                </div>
            </div>
        </div>

        {!report ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-8">
                 <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-inner">
                    <FileText size={32} className="text-slate-300" />
                 </div>
                 <div className="space-y-1">
                    <p className="font-black text-slate-800 uppercase tracking-tight">Generate Official OP Record</p>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                        Compiles clinical assessments, growth trends, and daily monitoring logs into a professional format.
                    </p>
                 </div>
                 <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating}
                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70 flex items-center gap-3 uppercase tracking-widest text-[10px]"
                 >
                    {isGenerating ? (
                        <><RefreshCw className="animate-spin" size={16} /> {t('generating', profile.language)}</>
                    ) : (
                        <><Activity size={16} /> Prepare Record</>
                    )}
                 </button>
            </div>
        ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Clinical Vitals Summary */}
                <section>
                    <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <Activity size={12} /> Recent Observations
                    </h3>
                    <div className="grid grid-cols-1 border border-slate-100 rounded-xl overflow-hidden">
                        <div className="grid grid-cols-3 bg-slate-50 p-2 text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                            <span>Vital Sign</span>
                            <span>Recorded Value</span>
                            <span>Time Captured</span>
                        </div>
                        {latestVitals.length > 0 ? latestVitals.map((l, i) => (
                            <div key={i} className="grid grid-cols-3 p-2 border-t border-slate-100 text-[10px] font-medium text-slate-700">
                                <span className="uppercase font-bold text-slate-500">{l.type}</span>
                                <span>{l.details.temperature || l.details.bpm || l.details.oxygen || '--'} {l.type === LogType.TEMPERATURE ? '°C' : l.type === LogType.HEART_RATE ? 'BPM' : '%'}</span>
                                <span className="text-[8px] text-slate-400">{l.timestamp.toLocaleString()}</span>
                            </div>
                        )) : (
                            <div className="p-4 text-center text-[10px] text-slate-300 italic">No vitals logs found.</div>
                        )}
                    </div>
                </section>

                {/* AI Assessment & Plan */}
                <section className="space-y-4">
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-4">Clinical Interpretation</h4>
                        <div className="text-[11px] text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                            {report}
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border-t border-dashed border-slate-200 mt-8">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Digital Signature</p>
                            <p className="text-[12px] font-serif italic text-slate-800 mt-1">NurtureAI Medical Agent v3.1</p>
                        </div>
                        <CheckCircle size={24} className="text-emerald-500 opacity-50" />
                    </div>
                </section>
            </div>
        )}
      </div>
    </div>
  );
};
