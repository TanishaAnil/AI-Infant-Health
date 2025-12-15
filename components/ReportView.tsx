import React, { useState } from 'react';
import { FileText, Download, CheckCircle, RefreshCw } from 'lucide-react';
import { LogEntry, InfantProfile, ChatMessage } from '../types';
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
    // Convert chat history to simple text for the prompt
    const chatText = chatHistory.slice(-10).map(m => `${m.role}: ${m.text}`).join('\n');
    const result = await generateFormalReport(logs, profile, chatText);
    setReport(result);
    setIsGenerating(false);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([report], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `Health_Report_${profile.name}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="p-4 pb-20 animate-fade-in h-full flex flex-col">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="text-indigo-600" /> 
                {t('report', profile.language)}
            </h2>
            {report && (
                 <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors">
                    <Download size={16} /> {t('download', profile.language)}
                 </button>
            )}
        </div>

        {!report ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 p-8 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
                 <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm">
                    <FileText size={32} className="text-slate-300" />
                 </div>
                 <p className="text-slate-500 max-w-xs text-sm">
                    Generate a detailed health summary including vitals, sleep analysis, and AI recommendations based on your logs.
                 </p>
                 <button 
                    onClick={handleGenerate} 
                    disabled={isGenerating}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center gap-2"
                 >
                    {isGenerating ? (
                        <><RefreshCw className="animate-spin" size={20} /> {t('generating', profile.language)}</>
                    ) : (
                        <>{t('generate_report', profile.language)}</>
                    )}
                 </button>
            </div>
        ) : (
            <div className="flex-1 overflow-y-auto bg-slate-50 rounded-xl p-4 border border-slate-200">
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
                    {report}
                </pre>
            </div>
        )}
      </div>
    </div>
  );
};
